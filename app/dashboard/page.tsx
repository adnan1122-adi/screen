'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Screen, Asset, Schedule } from '@/types';
import { Plus, Trash2, Upload, Bell, Monitor, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, []);

  // Fetch Screens
  useEffect(() => {
    const fetchScreens = async () => {
      const { data } = await supabase.from('screens').select('*');
      if (data) {
        setScreens(data);
        if (data.length > 0 && !selectedScreenId) setSelectedScreenId(data[0].id);
      }
    };
    fetchScreens();
  }, []);

  // Fetch Details when Screen Selected
  useEffect(() => {
    if (!selectedScreenId) return;
    
    const fetchData = async () => {
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .eq('screen_id', selectedScreenId)
        .order('order', { ascending: true });
      if (assetsData) setAssets(assetsData);

      const { data: schedData } = await supabase
        .from('schedules')
        .select('*')
        .eq('screen_id', selectedScreenId)
        .order('weekday').order('period');
      if (schedData) setSchedules(schedData);
    };
    fetchData();
  }, [selectedScreenId]);

  const handleAddScreen = async () => {
    const id = prompt("Enter Screen ID (e.g., room_101):");
    if (!id) return;
    const { error } = await supabase.from('screens').insert({ id, name: `Room ${id}` });
    if (!error) {
      setScreens([...screens, { id, name: `Room ${id}`, timezone: 'UTC' }]);
      setSelectedScreenId(id);
    }
  };

  const handleRingBell = async () => {
    if (!selectedScreenId) return;
    await supabase.from('commands').insert({
      screen_id: selectedScreenId,
      cmd: 'ring',
      payload: {}
    });
    alert('Bell command sent!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedScreenId) return;
    setUploading(true);

    const file = e.target.files[0];
    
    // 1. Get Signature
    const sigRes = await fetch('/api/cloudinary/sign');
    const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

    // 2. Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', 'signage_assets');

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      // 3. Save to Supabase
      const newAsset = {
        screen_id: selectedScreenId,
        type: uploadData.resource_type === 'video' ? 'video' : 'image',
        url: uploadData.secure_url,
        public_id: uploadData.public_id,
        duration: 10,
        order: assets.length
      };

      const { data, error } = await supabase.from('assets').insert(newAsset).select().single();
      if (data) setAssets([...assets, data as Asset]);
      if (error) console.error(error);

    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if(!confirm("Delete asset?")) return;
    await supabase.from('assets').delete().eq('id', id);
    setAssets(assets.filter(a => a.id !== id));
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const text = await file.text();
    
    const res = await fetch('/api/schedules/import', {
      method: 'POST',
      body: JSON.stringify({ csv: text }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      alert("Schedule imported successfully");
      window.location.reload();
    } else {
      alert("Import failed");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Monitor className="text-indigo-400" /> Admin
        </h1>
        <div className="flex-1 overflow-y-auto space-y-1">
          {screens.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScreenId(s.id)}
              className={`w-full text-left px-3 py-2 rounded transition ${selectedScreenId === s.id ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button onClick={handleAddScreen} className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <Plus size={16} /> Add Screen
        </button>
        <div className="mt-8 pt-4 border-t border-slate-800">
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-sm text-red-400">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedScreenId && (
          <div className="max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{screens.find(s => s.id === selectedScreenId)?.name}</h2>
                <p className="text-slate-500 font-mono text-sm">ID: {selectedScreenId}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => window.open(`/screen/${selectedScreenId}`, '_blank')} className="px-4 py-2 bg-slate-200 rounded font-medium">Open View</button>
                 <button onClick={handleRingBell} className="px-4 py-2 bg-amber-500 text-white rounded font-medium flex items-center gap-2"><Bell size={18} /> Ring Bell</button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Media Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2"><Monitor size={18} /> Playlist</h3>
                    <label className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm cursor-pointer flex items-center gap-2 hover:bg-indigo-700">
                      <Upload size={14} /> {uploading ? '...' : 'Add Media'}
                      <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*" disabled={uploading} />
                    </label>
                 </div>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {assets.map((asset, i) => (
                      <div key={asset.id} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded">
                         <span className="text-slate-400 text-xs font-mono w-4">{i+1}</span>
                         <div className="w-12 h-8 bg-slate-200 rounded overflow-hidden">
                            {asset.type === 'image' ? <img src={asset.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px]">VID</div>}
                         </div>
                         <div className="flex-1 text-sm truncate">{asset.public_id}</div>
                         <button onClick={() => handleDeleteAsset(asset.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {assets.length === 0 && <p className="text-slate-400 text-sm italic">No media content.</p>}
                 </div>
              </div>

              {/* Schedule Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2"><Calendar size={18} /> Schedule</h3>
                  <label className="text-indigo-600 text-sm cursor-pointer hover:underline">
                    Import CSV
                    <input type="file" className="hidden" accept=".csv" onChange={handleCSVImport} />
                  </label>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                   <table className="w-full text-sm text-left">
                     <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                       <tr>
                         <th className="px-2 py-2">Day</th>
                         <th className="px-2 py-2">Per</th>
                         <th className="px-2 py-2">Time</th>
                         <th className="px-2 py-2">Teacher</th>
                       </tr>
                     </thead>
                     <tbody>
                       {schedules.map(sch => (
                         <tr key={sch.id} className="border-b border-slate-50 hover:bg-slate-50">
                           <td className="px-2 py-2 font-medium">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'][sch.weekday]}</td>
                           <td className="px-2 py-2">{sch.period}</td>
                           <td className="px-2 py-2 whitespace-nowrap">{sch.start_time.slice(0,5)} - {sch.end_time.slice(0,5)}</td>
                           <td className="px-2 py-2">{sch.teacher}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}