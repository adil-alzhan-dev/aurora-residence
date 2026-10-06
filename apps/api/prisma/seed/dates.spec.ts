import { createDemoClock } from './dates.js';
import { ENQUIRIES } from './enquiries.js';
import { planActivity, planReservations, planStatusChangedAt } from './plan.js';
import { buildResidences } from './residences.js';

const MINUTE_MS = 60 * 1000;

const SEED_RUNS = [
  new Date(2026, 9, 7, 0, 0),
  new Date(2026, 9, 7, 0, 30),
  new Date(2026, 9, 7, 3, 5),
  new Date(2026, 9, 7, 9, 0),
  new Date(2026, 9, 7, 12, 13),
  new Date(2026, 9, 7, 18, 45),
  new Date(2026, 9, 7, 23, 59),
  new Date(2027, 2, 28, 1, 30),
];

describe('createDemoClock', () => {
  it('counts the times of the mockup today back from the seed run', () => {
    const now = new Date(2026, 9, 7, 8, 0);
    const clock = createDemoClock(now);
    const minutesAgo = (mockupDate: string) => (now.getTime() - clock(mockupDate).getTime()) / MINUTE_MS;

    expect(minutesAgo('Oct 4, 11:48')).toBe(25);
    expect(minutesAgo('Oct 4, 10:15')).toBe(118);
    expect(minutesAgo('Oct 4, 09:02')).toBe(191);
  });

  it('keeps the clock time of earlier days and moves them by the same number of days', () => {
    const clock = createDemoClock(new Date(2026, 9, 7, 8, 0));

    expect(clock('Oct 3, 18:40')).toEqual(new Date(2026, 9, 6, 18, 40));
    expect(clock('Aug 11, 14:40')).toEqual(new Date(2026, 7, 14, 14, 40));
  });

  it('rejects dates after the mockup seed run', () => {
    const clock = createDemoClock();

    expect(() => clock('Oct 4, 12:30')).toThrow('later than the seed run');
    expect(() => clock('Oct 5, 09:00')).toThrow('in the future');
  });

  describe.each(SEED_RUNS)('seed run at %s', (now) => {
    const clock = createDemoClock(now);
    const residences = buildResidences();
    const reservations = planReservations(clock);
    const statusChangedAt = planStatusChangedAt(residences, reservations, clock);
    const activity = planActivity(residences, statusChangedAt, clock);
    const receivedAt = ENQUIRIES.map((enquiry) => clock(enquiry.receivedAt));

    it('puts no enquiry, activity or reservation start in the future', () => {
      for (const date of receivedAt) expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
      for (const entry of activity) expect(entry.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
      for (const reservation of reservations) {
        expect(reservation.startsAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }
      for (const date of statusChangedAt.values()) expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('keeps the enquiries newest first, as in the spec', () => {
      for (let index = 1; index < receivedAt.length; index += 1) {
        expect(receivedAt[index].getTime()).toBeLessThan(receivedAt[index - 1].getTime());
      }
    });

    it('logs enquiry activity after the enquiry was received', () => {
      for (const entry of activity) {
        if (entry.enquiryIndex === undefined) continue;
        expect(entry.createdAt.getTime()).toBeGreaterThanOrEqual(receivedAt[entry.enquiryIndex].getTime());
      }
    });

    it('keeps the activity of today later than every event of the day before', () => {
      const today = ENQUIRIES.flatMap((enquiry) =>
        [enquiry.receivedAt, enquiry.takenAt, enquiry.noteAddedAt].filter(
          (date): date is string => date?.startsWith('Oct 4,') ?? false,
        ),
      ).map((date) => clock(date).getTime());
      const earlier = activity
        .map((entry) => entry.createdAt.getTime())
        .filter((time) => !today.includes(time));

      expect(Math.min(...today)).toBeGreaterThan(Math.max(...earlier));
    });
  });
});
