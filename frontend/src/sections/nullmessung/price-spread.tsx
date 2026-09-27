'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { refProducts } from 'src/data/nullmessung';

// ----------------------------------------------------------------------
// Preisspannen-Dotplot: derselbe Referenzartikel, eingekauft in mehreren

// alle dazwischen neutralblau; Faktor-Chip


const DOT = 10;
const SERIES = '#2a78d6';
const MIN_COLOR = '#22a556';
const MAX_COLOR = '#d63a2a';

const fmtPrice = (v: number) =>
  v >= 100
    ? `${Math.round(v).toLocaleString('en-GB')} €`
    : `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function PriceSpread() {
  const rows = refProducts
    .map((p) => ({ ...p, points: [...p.points].sort((a, b) => a.priceEUR - b.priceEUR) }))
    .filter((p) => p.points.length >= 2);

  if (!rows.length) return null;

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Stack spacing={2.5}>
        {rows.map((p) => {
          const min = p.points[0];
          const max = p.points[p.points.length - 1];
          const span = Math.max(max.priceEUR - min.priceEUR, 1e-9);
          const pad = span * 0.06;
          const lo = min.priceEUR - pad;
          const hi = max.priceEUR + pad;
          const factor = max.priceEUR / Math.max(min.priceEUR, 1e-9);

          return (
            <Box key={p.code}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {p.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  #{p.code}
                </Typography>
                {factor >= 1.15 && (
                  <Chip
                    size="small"
                    variant="soft"
                    color={factor >= 1.5 ? 'error' : 'warning'}
                    label={`×${factor.toLocaleString('en-GB', { maximumFractionDigits: 1 })}`}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography
                  variant="caption"
                  sx={{ width: 84, flexShrink: 0, textAlign: 'right', fontWeight: 700, color: MIN_COLOR }}
                >
                  {min.iso} {fmtPrice(min.priceEUR)}
                </Typography>

                <Box
                  sx={{
                    position: 'relative',
                    flexGrow: 1,
                    height: DOT + 8,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {p.points.map((pt, i) => {
                    const isMin = i === 0;
                    const isMax = i === p.points.length - 1;
                    return (
                      <Tooltip
                        key={`${pt.iso}-${i}`}
                        title={`${pt.iso}: ${fmtPrice(pt.priceEUR)} (${pt.basis}${pt.note ? `, ${pt.note}` : ''})${isMin ? ' — cheapest country' : isMax ? ' — most expensive country' : ''}`}
                        placement="top"
                        arrow
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: `${((pt.priceEUR - lo) / (hi - lo)) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            width: isMin || isMax ? DOT + 2 : DOT,
                            height: isMin || isMax ? DOT + 2 : DOT,
                            borderRadius: '50%',
                            bgcolor: isMin ? MIN_COLOR : isMax ? MAX_COLOR : SERIES,
                            boxShadow: '0 0 0 2px #fff',
                            cursor: 'default',
                            zIndex: isMin || isMax ? 1 : 0,
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>

                <Typography
                  variant="caption"
                  sx={{ width: 84, flexShrink: 0, fontWeight: 700, color: MAX_COLOR }}
                >
                  {max.iso} {fmtPrice(max.priceEUR)}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.disabled' }}>
        Per-piece EUR where the packing unit is known; each tooltip states the basis.
        Green = cheapest market, red = most expensive, blue = in between. The
        packing unit must be confirmed before comparison.
      </Typography>
    </Box>
  );
}
