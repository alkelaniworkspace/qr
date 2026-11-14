import { cn } from "@/lib/cn";

const dShort = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });

/** Daily scans as quiet bars with a highlighted peak. Pure SVG, rendered on the server. */
export function ScanSeries({ series }: { series: { date: string; scans: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.scans));
  const W = 720;
  const H = 200;
  const gap = 4;
  const bw = (W - gap * (series.length - 1)) / Math.max(1, series.length);
  const peak = series.reduce((a, b) => (b.scans > a.scans ? b : a), series[0] ?? { date: "", scans: 0 });
  const ticks = [0, Math.round(max / 2), max];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Scans pro Tag, letzte 30 Tage">
        {ticks.map((t) => {
          const y = H - (t / max) * H;
          return (
            <g key={t}>
              <line x1="0" x2={W} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray={t === 0 ? undefined : "3 5"} />
              <text x={W} y={y - 4} textAnchor="end" fontSize="11" fill="#6f757c">{t}</text>
            </g>
          );
        })}
        {series.map((s, i) => {
          const h = s.scans === 0 ? 0 : Math.max(3, (s.scans / max) * (H - 18));
          const isPeak = s.scans > 0 && s.date === peak.date;
          return (
            <g key={s.date}>
              <rect x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={Math.min(4, bw / 2)} fill={isPeak ? "#d2ff1f" : "#3a3f45"} style={isPeak ? { filter: "drop-shadow(0 0 8px rgba(210,255,31,0.7))" } : undefined}>
                <title>{`${dShort.format(new Date(s.date))}: ${s.scans} Scans`}</title>
              </rect>
              {(i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2)) && (
                <text x={i * (bw + gap) + bw / 2} y={H + 18} textAnchor="middle" fontSize="11" fill="#6f757c">{dShort.format(new Date(s.date))}</text>
              )}
            </g>
          );
        })}
      </svg>
      {peak.scans > 0 && (
        <p className="mt-3 text-xs text-dim">
          Stärkster Tag: <span className="font-bold text-lime">{dShort.format(new Date(peak.date))}</span> mit {peak.scans} Scans
        </p>
      )}
    </div>
  );
}

/** 24 cells, darker = more scans. Shows when people scan (Berlin time). */
export function HourStrip({ hours }: { hours: { hour: number; n: number }[] }) {
  const max = Math.max(1, ...hours.map((h) => h.n));
  return (
    <div>
      <div className="grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
        {hours.map((h) => (
          <div
            key={h.hour}
            title={`${h.hour}:00 Uhr – ${h.n} Scans`}
            className="aspect-[1/2.2] rounded-md"
            style={{ backgroundColor: h.n === 0 ? "rgba(255,255,255,0.05)" : `rgb(210 255 31 / ${0.18 + (h.n / max) * 0.82})` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-faint">
        <span>0 Uhr</span><span>6</span><span>12</span><span>18</span><span>23 Uhr</span>
      </div>
    </div>
  );
}

export function Breakdown({ items, total, empty = "Noch keine Daten" }: { items: { label: string; n: number }[]; total: number; empty?: string }) {
  if (!items.length) return <p className="text-sm text-dim">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.slice(0, 6).map((it, i) => {
        const pct = total ? Math.round((it.n / total) * 100) : 0;
        return (
          <li key={it.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="truncate">{it.label}</span>
              <span className="tabular-nums text-dim">{it.n} · {pct} %</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className={cn("h-full rounded-full transition-all duration-700", i === 0 ? "bg-lime shadow-[0_0_10px_rgba(210,255,31,0.6)]" : "bg-white/25")} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
