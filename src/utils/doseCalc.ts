import { addHours, startOfHour, isWithinInterval, subHours } from 'date-fns';

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
