'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  fmtEURk,
  priceIndex,
  priceBenchmark,
  priceIndexNote,
  priceStatements,
} from 'src/data/nullmessung';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------





const SERIES = '#2a78d6';
const BASE_FACTOR = 1.0;

const fmtFactor = (f: number) => `×${f.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PreisErkenntnisse() {
  if (!priceIndex.length) return null;

  const maxFactor = Math.max(...priceIndex.map((r) => r.factor), 1.6);

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} sx={{ px: 3, pb: 3 }}>
      
      <Box sx={{ flex: 6, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Purchasing factor by country
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          ×1.00 = buys at the best group price
        </Typography>

        <Stack spacing={1.25}>
          {priceIndex.map((r) => {
            const widthPct = ((r.factor - BASE_FACTOR) / (maxFactor - BASE_FACTOR)) * 100;
            return (
              <Stack key={r.iso} direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="body2" sx={{ width: 118, flexShrink: 0 }} noWrap>
                  {r.name}
                </Typography>
                <Box sx={{ position: 'relative', flexGrow: 1, height: 18 }}>
                  
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      bgcolor: 'divider',
                    }}
                  />
                  <Tooltip
                    title={`${r.name}: on average ${fmtFactor(r.factor)} of the respective best price, across ${r.articles} comparison items`}
                    placement="top"
                    arrow
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '2px',
                        top: 0,
                        height: 18,
                        width: `calc(${Math.max(widthPct, 1.5)}% - 2px)`,
                        bgcolor: r.factor <= 1.02 ? '#0ca30c' : SERIES,
                        borderRadius: '0 4px 4px 0',
                        '&:hover': { opacity: 0.85 },
                      }}
                    />
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    width: 96,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'text.secondary',
                  }}
                >
                  {fmtFactor(r.factor)} · {r.articles} Art.
                </Typography>
              </Stack>
            );
          })}
        </Stack>

        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.disabled' }}>
          {priceIndexNote}
        </Typography>
      </Box>

      
      <Box sx={{ flex: 6, minWidth: 0 }}>
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Iconify icon="solar:cup-star-bold" width={28} sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2">
              Benchmark: {priceBenchmark.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              pays for {priceBenchmark.wins} from {priceBenchmark.articles} comparison items with
              the best group price. HUB-N terms benchmark all markets and indicate
              the best group price across {priceBenchmark.wins} of {priceBenchmark.articles}{' '}
              comparable articles.
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1.75}>
          {priceStatements.map((s, i) => (
            <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
              <Iconify
                icon="solar:verified-check-bold"
                width={18}
                sx={{ mt: '2px', flexShrink: 0, color: 'success.main' }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2">
                  {s.de}
                  {s.valueEUR ? (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'success.darker' }}
                    >
                      {' '}
                      ({fmtEURk(s.valueEUR)})
                    </Typography>
                  ) : null}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {s.en}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
