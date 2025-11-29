
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 text-center px-4">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
        Classroom Signage Hub
      </h1>
      <div className="flex gap-4">
        <Link 
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
        >
          Admin Dashboard
        </Link>
        <Link 
          href="/screen/demo"
          className="px-6 py-3 bg-slate-700 rounded-lg font-bold hover:bg-slate-600 transition"
        >
          View Demo Screen
        </Link>
      </div>
    </div>
  );
}
