import { buildResidences, type ResidenceSeed } from './residences.js';

describe('buildResidences', () => {
  const residences = buildResidences();
  const byNumber = new Map(residences.map((r) => [r.number, r]));
  const count = (predicate: (r: ResidenceSeed) => boolean) =>
    residences.filter(predicate).length;

  it('creates 66 unique residences', () => {
    expect(residences).toHaveLength(66);
    expect(byNumber.size).toBe(66);
  });

  it('matches the status split 41 / 8 / 17', () => {
    expect(count((r) => r.status === 'AVAILABLE')).toBe(41);
    expect(count((r) => r.status === 'RESERVED')).toBe(8);
    expect(count((r) => r.status === 'SOLD')).toBe(17);
  });

  it('prices residences from the floor 7 list with per-floor steps', () => {
    expect(byNumber.get('7.03')?.priceUsd).toBe(218_000);
    expect(byNumber.get('2.03')?.priceUsd).toBe(198_000);
    expect(byNumber.get('5.03')?.priceUsd).toBe(210_000);
    expect(byNumber.get('8.03')?.priceUsd).toBe(222_000);
  });

  it('treats 11.05 and 11.06 as penthouses with terrace', () => {
    expect(byNumber.get('11.06')).toMatchObject({
      priceUsd: 486_000,
      areaM2: '164.0',
      isPenthouse: true,
    });
    expect(byNumber.get('11.05')).toMatchObject({ priceUsd: 438_000, isPenthouse: true });
    expect(count((r) => r.isPenthouse)).toBe(2);
  });

  it('has 22 two-bedroom residences, 14 of them available, cheapest 2.03', () => {
    const twoBedrooms = residences.filter((r) => r.bedrooms === 2);
    const available = twoBedrooms.filter((r) => r.status === 'AVAILABLE');
    const cheapest = [...available].sort((a, b) => a.priceUsd - b.priceUsd)[0];

    expect(twoBedrooms).toHaveLength(22);
    expect(available).toHaveLength(14);
    expect(cheapest.number).toBe('2.03');
  });
});
