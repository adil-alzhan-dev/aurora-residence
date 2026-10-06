const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const MOCKUP_YEAR = 2026;
const MOCKUP_TODAY = Date.UTC(MOCKUP_YEAR, 9, 4);
/** Clock time of the seed run in the mockup world, a bit after the latest enquiry (11:48). */
const MOCKUP_NOW_MINUTES = 12 * 60 + 13;

export type DemoClock = (mockupDate: string) => Date;

/**
 * The mockups are drawn for "today = Oct 4, 2026". Earlier days keep their
 * clock time and move to the same distance from the real today. Times of
 * Oct 4 are counted back from the seed run, so they never land in the future,
 * whatever the hour, and stay later than every event of the day before.
 */
export function createDemoClock(now: Date = new Date()): DemoClock {
  return (mockupDate) => {
    const match = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{2}):(\d{2})$/.exec(mockupDate);
    const monthIndex = match ? MONTHS.indexOf(match[1]) : -1;
    if (!match || monthIndex < 0) {
      throw new Error(`Invalid mockup date "${mockupDate}", expected "Oct 4, 11:48"`);
    }
    const offsetDays = Math.round(
      (Date.UTC(MOCKUP_YEAR, monthIndex, Number(match[2])) - MOCKUP_TODAY) / DAY_MS,
    );
    const hours = Number(match[3]);
    const minutes = Number(match[4]);
    if (offsetDays === 0) {
      const minutesAgo = MOCKUP_NOW_MINUTES - (hours * 60 + minutes);
      if (minutesAgo < 0) throw new Error(`Mockup date "${mockupDate}" is later than the seed run`);
      return new Date(now.getTime() - minutesAgo * MINUTE_MS);
    }
    if (offsetDays > 0) throw new Error(`Mockup date "${mockupDate}" is in the future`);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hours, minutes);
  };
}

export function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}
