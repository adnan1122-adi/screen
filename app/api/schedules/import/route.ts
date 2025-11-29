
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

// Use service role key to bypass RLS for bulk operations if needed, 
// or use auth context. Here we assume the user is authenticated via session.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { csv } = await req.json();
  
  const { data: rows } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });
  }

  // Validate and map
  // Expected CSV: screen_id, weekday, period, start_time, end_time, teacher
  const schedules = rows.map((r: any) => ({
    screen_id: r.screen_id,
    weekday: parseInt(r.weekday),
    period: parseInt(r.period),
    start_time: r.start_time,
    end_time: r.end_time,
    teacher: r.teacher
  }));

  const { error } = await supabase.from('schedules').insert(schedules);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: schedules.length });
}
