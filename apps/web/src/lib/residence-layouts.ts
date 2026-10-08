/**
 * Room areas by position, the same on every floor (spec, "Room areas by position").
 * Rooms of each layout add up to the residence area; 7.03 is taken from the spec as is.
 */
export type RoomName = "studio" | "living" | "master" | "bedroom" | "ensuite" | "hall" | "bath" | "entrance" | "terrace";

export type Room = { name: RoomName; areaM2: number };

export type ResidenceLayout = {
  rooms: Room[];
  widthM: number;
  depthM: number;
};

const room = (name: RoomName, areaM2: number): Room => ({ name, areaM2 });

export const residenceLayouts: Record<number, ResidenceLayout> = {
  1: {
    widthM: 5.3,
    depthM: 7.2,
    rooms: [room("studio", 29.1), room("bath", 5.2), room("hall", 3.9)],
  },
  2: {
    widthM: 7.2,
    depthM: 7.2,
    rooms: [room("living", 24.6), room("bedroom", 14.2), room("bath", 6.0), room("hall", 7.0)],
  },
  3: {
    widthM: 10.5,
    depthM: 8.0,
    rooms: [
      room("living", 34.8),
      room("master", 15.1),
      room("bedroom", 13.6),
      room("ensuite", 9.3),
      room("hall", 5.9),
      room("bath", 5.5),
    ],
  },
  4: {
    widthM: 11.0,
    depthM: 8.0,
    rooms: [
      room("living", 36.4),
      room("master", 15.6),
      room("bedroom", 14.2),
      room("ensuite", 9.6),
      room("hall", 6.1),
      room("bath", 5.7),
    ],
  },
  5: {
    widthM: 17.0,
    depthM: 7.0,
    rooms: [
      room("living", 46.8),
      room("master", 19.2),
      room("bedroom", 15.8),
      room("bedroom", 13.6),
      room("hall", 12.9),
      room("bath", 5.6),
      room("entrance", 4.6),
    ],
  },
  6: {
    widthM: 17.0,
    depthM: 7.5,
    rooms: [
      room("living", 50.4),
      room("master", 20.6),
      room("bedroom", 16.8),
      room("bedroom", 14.6),
      room("hall", 13.1),
      room("bath", 5.8),
      room("entrance", 5.0),
    ],
  },
};

/** Penthouses 11.05 and 11.06: the plan of their position plus a roof terrace counted in the area. */
const PENTHOUSE_TERRACE_M2: Record<number, number> = { 5: 33.9, 6: 37.7 };

const CEILING_M = 3.2;
const PENTHOUSE_CEILING_M = 3.6;

export function layoutOf(position: number, isPenthouse: boolean) {
  const layout = residenceLayouts[position];
  if (!layout) return null;
  const terrace = isPenthouse ? PENTHOUSE_TERRACE_M2[position] : undefined;
  return {
    ...layout,
    terraceM2: terrace ?? null,
    ceilingM: isPenthouse ? PENTHOUSE_CEILING_M : CEILING_M,
  };
}
