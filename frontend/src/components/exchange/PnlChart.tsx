import { useMemo } from 'react';
import type { PnlPoint } from '@/lib/ledger';

const W = 640;
const H = 220;
const PAD_L = 44;
const PAD_B = 28;

export function PnlChart({ series }: { series: PnlPoint[] }) {
  const { path, yMin, yMax, yMid, labels } = useMemo(() => {
    if (series.length === 0) {
      return { path: '', yMin: 0, yMax: 0, yMid: 0, labels: [] as string[] };
    }
    const values = series.map((p) => p.cumulative);
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const span = Math.max(1, max - min);
    const x = (i: number) => PAD_L + (i / Math.max(1, series.length - 1)) * (W - PAD_L - 8);
    const y = (v: number) => 8 + ((max - v) / span) * (H - PAD_B - 8);

    let d = `M ${x(0)} ${y(values[0]!)}`;
    for (let i = 1; i < series.length; i++) {
      d += ` L ${x(i)} ${y(values[i - 1]!)} L ${x(i)} ${y(values[i]!)}`;
    }
    const dateLabel = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    const idx = [0, Math.floor((series.length - 1) / 2), series.length - 1];
    return {
      path: d,
      yMin: min,
      yMax: max,
      yMid: Math.round((max + min) / 2),
      labels: [...new Set(idx)].map((i) => dateLabel(series[i]!.t)),
    };
  }, [series]);

  const yPos = (v: number) => {
    if (series.length === 0) return H - PAD_B;
    const span = Math.max(1, yMax - yMin);
    return 8 + ((yMax - v) / span) * (H - PAD_B - 8);
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cumulative realized P&L chart">
        {[yMax, yMid, yMin].map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - 8} y1={yPos(v)} y2={yPos(v)} stroke="#DDD8CD" strokeWidth="1" />
            <text x={0} y={yPos(v) + 4} fontSize="11" fontFamily="IBM Plex Mono" fill="#706F65">
              {v > 0 ? `+${v}` : v}
            </text>
          </g>
        ))}
        {series.length === 0 ? (
          <line x1={PAD_L} x2={W - 8} y1={yPos(0)} y2={yPos(0)} stroke="#254D3B" strokeWidth="2" />
        ) : (
          <path d={path} fill="none" stroke="#254D3B" strokeWidth="2" />
        )}
        {labels.map((label, i) => {
          const anchors = ['start', 'middle', 'end'] as const;
          const xs = [PAD_L, (W - PAD_L) / 2 + PAD_L / 2, W - 8];
          return (
            <text
              key={`${label}-${i}`}
              x={xs[i]}
              y={H - 8}
              fontSize="11"
              fontFamily="IBM Plex Mono"
              fill="#706F65"
              textAnchor={anchors[i]}
            >
              {label}
            </text>
          );
        })}
      </svg>
      {series.length === 0 && <p className="mt-2 text-[11px] text-muted">No settled results yet.</p>}
    </div>
  );
}
