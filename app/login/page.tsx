'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else router.push('/dashboard');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-xl shadow-xl w-96">
        <h1 className="text-2xl font-bold mb-6 text-white">Admin Login</h1>
        <input 
          className="w-full mb-4 p-3 rounded bg-slate-700 text-white border border-slate-600"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input 
          className="w-full mb-6 p-3 rounded bg-slate-700 text-white border border-slate-600"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-500">
          Sign In
        </button>
      </form>
    </div>
  );
}