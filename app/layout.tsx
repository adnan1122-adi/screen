import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Classroom Signage',
  description: 'Digital Signage System',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen overflow-hidden">
        {children}
        {/* Global Bell Audio Element */}
        <audio id="bell-audio" src="/bell.mp3" preload="auto" />
      </body>
    </html>
  );
}