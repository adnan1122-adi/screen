
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Asset, Schedule, CurrentStatus, Command } from '@/types';
import { getCurrentStatus } from '@/lib/scheduler';
import { Clock } from '@/components/Clock';
import { MediaPlayer } from '@/components/MediaPlayer';
import clsx from 'clsx';
import { Bell, AlertCircle } from 'lucide-react';

export default function ScreenPlayer() {
  const { id } = useParams() as { id: string };
  const supabase = createClient();
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [status, setStatus] = useState<CurrentStatus | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  
  // Realtime subscription ref
  const channelRef = useRef<any>(null);

  // Initial Fetch & Subscribe
  useEffect(() => {
    if (!id) return;

    // 1. Fetch Initial Data
    const fetchData = async () => {
      const { data: sched } = await supabase.from('schedules').select('*').eq('screen_id', id);
      if (sched) setSchedules(sched);
      
      const { data: media } = await supabase.from('assets').select('*').eq('screen_id', id).order('order');
      if (media) setAssets(media);
    };
    fetchData();

    // 2. Setup Realtime
    channelRef.current = supabase.channel(`screen-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commands', filter: `screen_id=eq.${id}` }, 
        (payload) => handleCommand(payload.new as Command)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets', filter: `screen_id=eq.${id}` }, 
        () => fetchData()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules', filter: `screen_id=eq.${id}` }, 
        () => fetchData()
      )
      .subscribe();

    // Register offline SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    return () => {
      supabase.removeChannel(channelRef.current);
    };
  }, [id]);

  // Scheduler Loop
  useEffect(() => {
    const tick = () => {
      const s = getCurrentStatus(schedules);
      setStatus(s);

      // Auto Bell Logic
      if (s.minutesToBell === 0 && s.timeRemaining.includes('0 min')) {
        // Debounce logic is simplified here; usually check if rung in last minute
        // For production, track `lastRungTime` ref
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [schedules]);

  // Bell Trigger for exact end of period
  const lastBellRef = useRef(0);
  useEffect(() => {
    if (status?.minutesToBell === 0) {
      const now = Date.now();
      if (now - lastBellRef.current > 60000) {
        playBell();
        lastBellRef.current = now;
      }
    }
  }, [status]);

  const handleCommand = (cmd: Command) => {
    if (cmd.cmd === 'ring') playBell();
    if (cmd.cmd === 'reload') window.location.reload();
  };

  const playBell = () => {
    const audio = document.getElementById('bell-audio') as HTMLAudioElement;
    audio?.play().catch(e => console.log("Audio blocked:", e));
  };

  const handleStart = () => {
    setIsStarted(true);
    document.documentElement.requestFullscreen().catch(() => {});
    playBell(); // Test audio context
  };

  if (!isStarted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-4">
        <h1 className="text-2xl font-bold">Classroom {id}</h1>
        <button onClick={handleStart} className="px-8 py-4 bg-indigo-600 rounded-xl text-xl font-bold shadow-xl animate-pulse">
          Click to Start Display
        </button>
      </div>
    );
  }

  const isUrgent = status && status.minutesToBell <= 3 && !status.isBreak;

  return (
    <div className="h-screen w-screen grid grid-cols-12 bg-black text-white overflow-hidden relative">
      {/* Sidebar Info */}
      <div className="col-span-4 bg-slate-900 border-r border-slate-800 flex flex-col p-6 gap-6 z-10">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <Clock />
        </div>

        <div className={clsx(
          "flex-1 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden transition-all duration-500",
          isUrgent ? "bg-amber-900/40 border-2 border-amber-500 animate-pulse" : "bg-indigo-900/20 border border-slate-700"
        )}>
          {status?.period ? (
            <>
              <div className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-2">Current Period</div>
              <h1 className="text-8xl font-black mb-2">{status.period.period}</h1>
              <div className="text-3xl text-indigo-300 font-medium mb-8">{status.period.teacher}</div>
              
              <div className="mt-auto">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-400">Ends at {status.period.end_time.slice(0,5)}</span>
                    <span className={clsx("text-3xl font-mono font-bold", isUrgent ? "text-amber-400" : "text-white")}>
                      {status.timeRemaining}
                    </span>
                 </div>
              </div>
            </>
          ) : (
             <div className="text-center text-slate-500">
               <Bell size={48} className="mx-auto mb-4 opacity-50"/>
               <h2 className="text-2xl">No Active Class</h2>
             </div>
          )}
        </div>

        <div className="bg-slate-800/30 p-6 rounded-2xl">
           <div className="text-slate-500 uppercase text-xs font-bold mb-2">Next Up</div>
           {status?.nextPeriod ? (
             <div className="flex justify-between items-center">
                <div>
                   <div className="text-xl font-bold text-white">Period {status.nextPeriod.period}</div>
                   <div className="text-indigo-300">{status.nextPeriod.teacher}</div>
                </div>
                <div className="text-right font-mono text-xl">{status.nextPeriod.start_time.slice(0,5)}</div>
             </div>
           ) : (
             <span className="text-slate-400">End of Day</span>
           )}
        </div>
      </div>

      {/* Media Player */}
      <div className="col-span-8 bg-black relative">
        <MediaPlayer assets={assets} />
        
        {/* Urgent Overlay */}
        {isUrgent && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-50">
            <AlertCircle size={24} />
            <span className="text-xl font-bold">Class Ends in {status?.minutesToBell} Minutes</span>
          </div>
        )}
      </div>
    </div>
  );
}
