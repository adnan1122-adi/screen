'use client';
import { useState, useEffect, useRef } from 'react';
import { Asset } from '@/types';

export const MediaPlayer = ({ assets }: { assets: Asset[] }) => {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!assets.length) return;
    const item = assets[index];
    
    let timer: ReturnType<typeof setTimeout>;

    if (item.type === 'image') {
      timer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % assets.length);
      }, item.duration * 1000);
    } else {
       // Video autoplay handled by onEnded
       videoRef.current?.play().catch(() => {});
    }

    return () => clearTimeout(timer);
  }, [index, assets]);

  if (!assets.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">
        <p className="text-2xl">No Media Scheduled</p>
      </div>
    );
  }

  const item = assets[index];

  return (
    <div className="w-full h-full relative">
      {item.type === 'image' ? (
        <img 
          key={item.id}
          src={item.url} 
          alt="slide" 
          className="w-full h-full object-contain bg-black animate-fade-in"
        />
      ) : (
        <video
          key={item.id}
          ref={videoRef}
          src={item.url}
          className="w-full h-full object-contain bg-black"
          autoPlay
          muted
          onEnded={() => setIndex((prev) => (prev + 1) % assets.length)}
        />
      )}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur">
         {index + 1} / {assets.length}
      </div>
    </div>
  );
};