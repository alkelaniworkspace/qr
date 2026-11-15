/** Small animated line, Bedienoo style: draws itself, ends in a glowing dot. */
export function Sparkline({ points, color = "#7b5cff", className }: { points: number[]; color?: string; className?: string }) {
  const max = Math.max(1, ...points);
  const w = 120;
  const h = 32;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const xy = points.map((p, i) => [i * step, h - 3 - (p / max) * (h - 6)] as const);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1] ?? [w, h];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" className="[animation:draw_1.6s_ease-out_both]" />
      <circle cx={last[0]} cy={last[1]} r="3.2" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}
