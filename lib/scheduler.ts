
import { Schedule, CurrentStatus } from "../types";
import { format, parse, differenceInMinutes, getDay, addDays } from "date-fns";

export const getCurrentStatus = (schedules: Schedule[]): CurrentStatus => {
  const now = new Date();
  
  // getDay returns 0 for Sunday, we want 7 for Sunday to match DB. 1=Mon...6=Sat
  let currentDay = getDay(now); 
  if (currentDay === 0) currentDay = 7;

  // Filter for today
  const todaySchedules = schedules
    .filter(s => s.weekday === currentDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const currentTimeStr = format(now, 'HH:mm:ss');

  let currentPeriod: Schedule | null = null;
  let nextPeriod: Schedule | null = null;
  let isBreak = false;

  for (let i = 0; i < todaySchedules.length; i++) {
    const s = todaySchedules[i];
    // Check intersection
    if (currentTimeStr >= s.start_time && currentTimeStr < s.end_time) {
      currentPeriod = s;
      nextPeriod = todaySchedules[i + 1] || null;
      break;
    }
    // Check if we are before this period (break)
    if (currentTimeStr < s.start_time) {
      nextPeriod = s;
      isBreak = true;
      break;
    }
  }

  let minutesToBell = 999;
  let timeRemaining = "";

  if (currentPeriod) {
    // End of current period
    const endTimeDate = parse(currentPeriod.end_time, 'HH:mm:ss', now);
    minutesToBell = differenceInMinutes(endTimeDate, now);
    timeRemaining = `${minutesToBell} min`;
  } else if (nextPeriod) {
    // Start of next period
    const startTimeDate = parse(nextPeriod.start_time, 'HH:mm:ss', now);
    minutesToBell = differenceInMinutes(startTimeDate, now);
    timeRemaining = `Starts in ${minutesToBell} min`;
  }

  return {
    period: currentPeriod,
    nextPeriod,
    timeRemaining,
    minutesToBell,
    isBreak
  };
};
