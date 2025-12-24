import { addHours, startOfHour, isWithinInterval, subHours, startOfDay } from 'date-fns';

export interface DoseWindow {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Calculates all dose windows for a day based on medication frequency.
 * For example, if frequency is 8 hours, returns 3 windows (Morning, Afternoon, Evening).
 */
export const calculateDoseWindows = (frequencyHours: number): DoseWindow[] => {
  const windows: DoseWindow[] = [];
  const dayStart = startOfDay(new Date());
  const dosesPerDay = Math.floor(24 / frequencyHours);
  
  const labels = ['Morning', 'Afternoon', 'Evening', 'Night'];
  
  for (let i = 0; i < dosesPerDay; i++) {
    const idealTime = addHours(dayStart, i * frequencyHours);
    const windowStart = subHours(idealTime, 2);
    const windowEnd = addHours(idealTime, 2);
    
    windows.push({
      start: windowStart,
      end: windowEnd,
      label: labels[i] || `Dose ${i + 1}`
    });
  }
  
  return windows;
};

/**
 * Calculates the current administration window for a medication.
 * For example, if a med is taken every 8 hours, and now is 12:00 PM,
 * the window might be 10:00 AM to 2:00 PM (4 hour window).
 */
export const getDoseWindow = (frequencyHours: number, baseDate: Date = new Date()) => {
  const now = baseDate;
  
  // Logic: Divide the day into chunks based on frequency
  // Simplified for demo: Window is +/- 2 hours from the ideal scheduled time
  const idealTime = startOfHour(now);
  const windowStart = subHours(idealTime, 2);
  const windowEnd = addHours(idealTime, 2);

  return {
    windowStart,
    windowEnd,
    isDue: true // Logic to check if dose was already taken would be in a hook
  };
};

/**
 * Calculates remaining days in a multi-day course.
 */
export const getRemainingDays = (startDate: Date, durationDays: number) => {
  const now = new Date();
  const end = addHours(startDate, durationDays * 24);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
