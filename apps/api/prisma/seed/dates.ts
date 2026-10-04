const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 24 * 60 * 60 * 1000;
const MOCKUP_YEAR = 2026;
const MOCKUP_TODAY = Date.UTC(MOCKUP_YEAR, 9, 4);

export type DemoClock = (mockupDate: string) => Date;

/**
 * The mockups are drawn for "today = Oct 4, 2026". A mockup date like
 * "Sep 28, 10:40" is moved to the same distance from the real today,
 * keeping the clock time in the process time zone.
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
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offsetDays,
      Number(match[3]),
      Number(match[4]),
    );
  };
}

export function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}
