import {
  blocks,
  diagonalStreet,
  home,
  lakeCenter,
  lakeRings,
  MAP_HEIGHT,
  MAP_WIDTH,
  parkEdge,
  streets,
  trees,
  walkingRoute,
} from "./map-data";

const ringOrigin = { transformBox: "fill-box", transformOrigin: "center" } as const;

export function MapDrawing() {
  return (
    <svg
      aria-hidden="true"
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      fill="none"
      className="absolute inset-0"
    >
      <g opacity={0.8} className="stroke-border">
        {blocks.map((block) => (
          <rect key={`${block.x}-${block.y}`} {...block} rx={3} />
        ))}
      </g>
      <path d={diagonalStreet} strokeWidth={18} className="stroke-card" />
      <path d={streets} opacity={0.45} className="stroke-muted-foreground" />
      <g opacity={0.45} strokeWidth={0.8} className="fill-status-free-subtle stroke-status-free">
        {trees.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <path d={parkEdge} opacity={0.5} strokeDasharray="2 4" className="stroke-status-free" />
      <g opacity={0.7} className="stroke-muted-foreground">
        {lakeRings.map((ring) => (
          <ellipse key={ring.rx} cx={lakeCenter.x} cy={lakeCenter.y} rx={ring.rx} ry={ring.ry} opacity={ring.opacity} />
        ))}
      </g>
      <path
        d={walkingRoute}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="1 6"
        className="animate-route stroke-primary"
      />
      <circle cx={home.x} cy={home.y} r={16.5} opacity={0.35} className="stroke-primary" />
      <circle cx={home.x} cy={home.y} r={9.5} opacity={0.7} className="stroke-primary" />
      <circle cx={home.x} cy={home.y} r={9.5} style={ringOrigin} className="animate-halo stroke-primary" />
      <circle cx={home.x} cy={home.y} r={5} className="fill-primary" />
    </svg>
  );
}
