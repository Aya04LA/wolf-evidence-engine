'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { monthRows } from 'src/data/tiefenanalyse';

// ----------------------------------------------------------------------




const W = 240;
const H = 56;
const PAD = 4;

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${mo}/${y.slice(2)}`;
};

const fmtK = (v: number) => `${Math.round(v / 1000).toLocaleString('en-GB')} €k`;

export function Rhythmus() {
  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Synthetic monthly series show different ordering patterns. Highlighted peaks illustrate potential consolidation windows.
      </Typography>
      <Typography variant="caption" sx={{ mb: 2.5, display: 'block', color: 'text.disabled' }}>
        Synthetic monthly series illustrate ordering rhythms and potential consolidation windows.
      </Typography>

      <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap>
        {monthRows.map((r) => {
          const vals = r.points.map((p) => p.valueEUR);
          const maxV = Math.max(...vals);
          const peakIdx = r.points.findIndex((p) => p.month === r.peakMonth);
          const step = (W - 2 * PAD) / Math.max(r.points.length - 1, 1);
          const y = (v: number) => H - PAD - (v / maxV) * (H - 2 * PAD);
          const path = r.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${(PAD + i * step).toFixed(1)},${y(p.valueEUR).toFixed(1)}`)
            .join(' ');
          return (
            <Box key={r.iso} sx={{ width: W }}>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {r.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Median {fmtK(r.medianEUR)}/month
                </Typography>
              </Stack>
              <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: 1, display: 'block' }}>
                <path d={path} fill="none" stroke="#8f8b83" strokeWidth={1.5} />
                {peakIdx >= 0 && (
                  <circle
                    cx={PAD + peakIdx * step}
                    cy={y(r.points[peakIdx].valueEUR)}
                    r={3.5}
                    fill="#F29100"
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Peak {fmtMonth(r.peakMonth)}: ×
                {r.peakFactor.toLocaleString('en-GB', { maximumFractionDigits: 2 })} of the median
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Box
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'warning.main',
          bgcolor: (theme) => `${theme.palette.warning.main}14`,
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>Open question to Manufacturer
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          For {monthRows.length} demo markets have synthetic monthly series. Missing series illustrate the limits of the analysis.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>
          Synthetic monthly series are available for {monthRows.length} demo markets. Missing time series illustrate analysis limitations.
        </Typography>
      </Box>
    </Box>
  );
}
