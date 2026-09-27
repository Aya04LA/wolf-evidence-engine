'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

//     (bar | line | donut). Das Template bringt keinen ApexCharts-Wrapper

// EN: Lightweight SVG renderer for the AI analyst's ```chart``` blocks.
// ----------------------------------------------------------------------

export type ChartSpec = {
  type: 'bar' | 'line' | 'donut';
  title?: string;
  categories: string[];
  series: { name: string; data: number[] }[];
};

const PALETTE = ['#F29100', '#1877F2', '#22C55E', '#8E33FF', '#FF5630', '#00B8D9'];

export function tryParseChart(raw: string): ChartSpec | null {
  try {
    const spec = JSON.parse(raw);
    if (
      !spec ||
      !['bar', 'line', 'donut'].includes(spec.type) ||
      !Array.isArray(spec.categories) ||
      !Array.isArray(spec.series) ||
      spec.series.length === 0 ||
      spec.series.some(
        (s: { name?: unknown; data?: unknown }) =>
          !Array.isArray(s.data) || (s.data as unknown[]).some((v) => typeof v !== 'number')
      )
    ) {
      return null;
    }
    return spec as ChartSpec;
  } catch {
    return null;
  }
}

const fmt = (v: number): string =>
  Math.abs(v) >= 1000
    ? `${(v / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })}k`
    : v.toLocaleString('en-GB', { maximumFractionDigits: 2 });

// ----------------------------------------------------------------------

function BarChart({ spec }: { spec: ChartSpec }) {
  const W = 360;
  const H = 190;
  const padL = 8;
  const padB = 26;
  const padT = 14;
  const max = Math.max(...spec.series.flatMap((s) => s.data), 1);
  const groupW = (W - padL * 2) / spec.categories.length;
  const barW = Math.min(26, (groupW * 0.7) / spec.series.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {spec.categories.map((cat, ci) => (
        <g key={cat + ci}>
          {spec.series.map((s, si) => {
            const v = s.data[ci] ?? 0;
            const h = Math.max(2, (v / max) * (H - padB - padT));
            const x =
              padL + ci * groupW + groupW / 2 - (barW * spec.series.length) / 2 + si * barW;
            const y = H - padB - h;
            return (
              <g key={s.name + si}>
                <rect
                  x={x}
                  y={y}
                  width={barW - 2}
                  height={h}
                  rx={2}
                  fill={PALETTE[si % PALETTE.length]}
                />
                {spec.series.length * spec.categories.length <= 12 && (
                  <text
                    x={x + (barW - 2) / 2}
                    y={y - 3}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill="currentColor"
                    opacity={0.75}
                  >
                    {fmt(v)}
                  </text>
                )}
              </g>
            );
          })}
          <text
            x={padL + ci * groupW + groupW / 2}
            y={H - padB + 12}
            textAnchor="middle"
            fontSize={9}
            fill="currentColor"
            opacity={0.65}
          >
            {cat.length > 14 ? `${cat.slice(0, 13)}…` : cat}
          </text>
        </g>
      ))}
      <line x1={padL} y1={H - padB} x2={W - padL} y2={H - padB} stroke="currentColor" opacity={0.2} />
    </svg>
  );
}

function LineChart({ spec }: { spec: ChartSpec }) {
  const W = 360;
  const H = 190;
  const padX = 16;
  const padB = 26;
  const padT = 14;
  const max = Math.max(...spec.series.flatMap((s) => s.data), 1);
  const min = Math.min(...spec.series.flatMap((s) => s.data), 0);
  const span = max - min || 1;
  const n = spec.categories.length;
  const xAt = (i: number) => padX + (n > 1 ? (i / (n - 1)) * (W - padX * 2) : (W - padX * 2) / 2);
  const yAt = (v: number) => H - padB - ((v - min) / span) * (H - padB - padT);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <line x1={padX} y1={H - padB} x2={W - padX} y2={H - padB} stroke="currentColor" opacity={0.2} />
      {spec.series.map((s, si) => (
        <g key={s.name + si}>
          <polyline
            points={s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')}
            fill="none"
            stroke={PALETTE[si % PALETTE.length]}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {s.data.map((v, i) => (
            <circle key={i} cx={xAt(i)} cy={yAt(v)} r={2.5} fill={PALETTE[si % PALETTE.length]} />
          ))}
        </g>
      ))}
      {spec.categories.map((cat, i) => (
        <text
          key={cat + i}
          x={xAt(i)}
          y={H - padB + 12}
          textAnchor="middle"
          fontSize={9}
          fill="currentColor"
          opacity={0.65}
        >
          {cat.length > 10 ? `${cat.slice(0, 9)}…` : cat}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ spec }: { spec: ChartSpec }) {
  const data = spec.series[0]?.data ?? [];
  const total = data.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <svg viewBox="0 0 160 160" style={{ width: 150, flexShrink: 0 }}>
        {data.map((v, i) => {
          const frac = Math.max(0, v) / total;
          const dash = frac * C;
          const offset = C * 0.25 - acc * C;
          acc += frac;
          return (
            <circle
              key={i}
              cx={80}
              cy={80}
              r={R}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={22}
              strokeDasharray={`${Math.max(0, dash - 1.5)} ${C - Math.max(0, dash - 1.5)}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        {spec.categories.map((cat, i) => (
          <Stack key={cat + i} direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: '3px',
                flexShrink: 0,
                bgcolor: PALETTE[i % PALETTE.length],
              }}
            />
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
              {cat}: {fmt(data[i] ?? 0)} ({Math.round(((data[i] ?? 0) / total) * 100)} %)
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  return (
    <Box
      sx={{
        my: 1,
        p: 1.5,
        borderRadius: 1.5,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.neutral',
        color: 'text.primary',
      }}
    >
      {spec.title && (
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {spec.title}
        </Typography>
      )}

      {spec.type === 'bar' && <BarChart spec={spec} />}
      {spec.type === 'line' && <LineChart spec={spec} />}
      {spec.type === 'donut' && <DonutChart spec={spec} />}

      {spec.type !== 'donut' && spec.series.length > 1 && (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
          {spec.series.map((s, i) => (
            <Stack key={s.name + i} direction="row" spacing={0.5} alignItems="center">
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '3px',
                  bgcolor: PALETTE[i % PALETTE.length],
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {s.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
