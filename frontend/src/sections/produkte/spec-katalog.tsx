'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { kategorien, produktSpecs } from 'src/data/produkte';

// ----------------------------------------------------------------------




const KAT_COLORS: Record<string, string> = {
  Schleifen: '#d5001c',
  Abdecken: '#2a78d6',
  Lackvorbereitung: '#b8860b',
  Polieren: '#4f9a6e',
};

const fmtEUR = (v: number) => `${Math.round(v / 1000).toLocaleString('en-GB')} €k`;
const fmtQty = (v: number) => v.toLocaleString('en-GB');

export function SpecKatalog() {
  const maxEUR = Math.max(...produktSpecs.map((s) => s.totalEUR));
  const flagship = produktSpecs[0];

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Each circle represents a neutral specification; its area shows aggregated Jan–Aug 2026 spend
        across countries and brands. The first demo product aggregates{' '}
        {fmtQty(flagship?.totalQty ?? 0)} units from{' '}
        {flagship?.nCountries ?? 0} countries.
      </Typography>
      <Typography variant="caption" sx={{ mb: 3, display: 'block', color: 'text.disabled' }}>
        Each bubble is one neutral spec; the area is the bundled period spend across all
        countries, brand-independent.
      </Typography>

      
      <Stack direction="row" flexWrap="wrap" alignItems="flex-end" spacing={2} useFlexGap sx={{ mb: 4 }}>
        {produktSpecs.map((s) => {
          const d = 28 + Math.sqrt(s.totalEUR / maxEUR) * 64;
          return (
            <Tooltip
              key={s.code}
              title={`${s.neutral}: ${fmtEUR(s.totalEUR)} Jan–Aug 2026, ${fmtQty(s.totalQty)} pieces, ${s.nCountries} Countries`}
              placement="top"
              arrow
            >
              <Stack alignItems="center" spacing={0.5} sx={{ width: 96 }}>
                <Box
                  sx={{
                    width: d,
                    height: d,
                    borderRadius: '50%',
                    bgcolor: KAT_COLORS[s.kategorie],
                    opacity: 0.85,
                    cursor: 'default',
                  }}
                />
                <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.2 }} noWrap>
                  {fmtEUR(s.totalEUR)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ textAlign: 'center', color: 'text.disabled', lineHeight: 1.2, fontSize: 10 }}
                >
                  {s.neutral.split(',')[0]}
                </Typography>
              </Stack>
            </Tooltip>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {kategorien.map((k) => (
          <Stack key={k.name} direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: KAT_COLORS[k.name] }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {k.name} ({fmtEUR(k.totalEUR)})
            </Typography>
          </Stack>
        ))}
      </Stack>

      
      <Grid container spacing={2}>
        {produktSpecs.map((s) => {
          const maxQty = Math.max(...s.demand.map((r) => r.qty), 1);
          return (
            <Grid key={s.code} size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, height: 1, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: KAT_COLORS[s.kategorie] }} />
                  <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>
                    {s.neutral}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Ref #{s.code}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.disabled' }} noWrap>
                  today: {s.brandName}
                </Typography>
                <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap sx={{ mb: 1.5 }}>
                  {s.chips.map((c) => (
                    <Chip key={c} size="small" variant="outlined" label={c} sx={{ height: 20, fontSize: 10 }} />
                  ))}
                </Stack>

                <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2">{fmtQty(s.totalQty)} pcs</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Demand Jan–Aug 2026
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">{fmtEUR(s.totalEUR)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Spend Jan–Aug 2026
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">{s.nEquivalents} Suppliers</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      RFI equivalents
                    </Typography>
                  </Box>
                  {s.bestPiece && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
                        {s.bestPiece.pricePerPiece?.toLocaleString('en-GB', { maximumFractionDigits: 2 })}{' '}
                        €/piece
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        best RFI price ({s.bestPiece.supplier})
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Stack spacing={0.5}>
                  {s.demand.slice(0, 5).map((r) => (
                    <Stack key={r.iso} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" sx={{ width: 24, flexShrink: 0, color: 'text.secondary' }}>
                        {r.iso}
                      </Typography>
                      <Box sx={{ flex: 1, height: 8, borderRadius: 0.5, bgcolor: 'divider' }}>
                        <Box
                          sx={{
                            width: `${(r.qty / maxQty) * 100}%`,
                            minWidth: 2,
                            height: 1,
                            borderRadius: 0.5,
                            bgcolor: KAT_COLORS[s.kategorie],
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ width: 76, flexShrink: 0, textAlign: 'right', color: 'text.secondary' }}>
                        {fmtQty(r.qty)} pcs
                      </Typography>
                    </Stack>
                  ))}
                  {s.demand.length > 5 && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      + {s.demand.length - 5} additional Countries
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
