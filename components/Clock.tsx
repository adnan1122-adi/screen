
'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="text-7xl font-mono font-bold tracking-tighter leading-none">
        {format(time, 'HH:mm')}
      </div>
      <div className="text-2xl text-slate-400 font-medium mt-1">
        {format(time, 'EEEE, MMMM do')}
      </div>
    </div>
  );
};
