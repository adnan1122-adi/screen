
export interface Screen {
  id: string;
  name: string;
  timezone: string;
  last_seen?: string;
  settings?: Record<string, any>;
}

export interface Schedule {
  id?: number;
  screen_id: string;
  weekday: number; // 1 = Monday
  period: number;
  teacher: string;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
}

export interface Asset {
  id: string;
  screen_id: string;
  type: 'image' | 'video';
  url: string;
  public_id: string;
  duration: number;
  order: number;
}

export interface Command {
  id: string;
  screen_id: string | null;
  cmd: string;
  payload?: any;
  created_at: string;
}

export interface CurrentStatus {
  period: Schedule | null;
  nextPeriod: Schedule | null;
  timeRemaining: string; // Formatted string
  minutesToBell: number;
  isBreak: boolean;
}
