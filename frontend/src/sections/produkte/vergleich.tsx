'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { produktSpecs } from 'src/data/produkte';
import { dossiers, rechercheHinweis } from 'src/data/produkte-recherche';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------


// synthetischen technischen Merkmalen.

const fmtP = (v: number) =>
  `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function Vergleich() {
  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Pilot specifications allow side-by-side comparison.
        Illustrative product comparison using reference suppliers. Price bars and comparison characteristics use synthetic demo assumptions.
      </Typography>
      <Typography variant="caption" sx={{ mb: 3, display: 'block', color: 'text.disabled' }}>
        Illustrative product comparisons use fictional suppliers, synthetic prices and
        synthetic technical specifications.
      </Typography>

      <Stack spacing={4} divider={<Divider flexItem />}>
        {dossiers.map((d) => {
          const spec = produktSpecs.find((s) => s.code === d.code);
          if (!spec) return null;
          const rows = d.entries.map((e) => ({
            ...e,
            eq: spec.equivalents.find((q) => q.supplier === e.supplier),
          }));
          const prices = rows
            .map((r) => r.eq?.pricePerPiece)
            .filter((p): p is number => p != null);
          const maxP = Math.max(...prices, 1e-9);
          const minP = Math.min(...prices);

          return (
            <Box key={d.code}>
              <Typography variant="subtitle1" sx={{ mb: 0.25 }}>
                {d.title}
              </Typography>
              <Typography variant="caption" sx={{ mb: 0.25, display: 'block', color: 'text.secondary' }}>
                {d.intro}
              </Typography>
              <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.disabled' }}>
                {d.introEn}
              </Typography>

              <Stack spacing={2}>
                {rows
                  .sort((a, b) => (a.eq?.pricePerPiece ?? Infinity) - (b.eq?.pricePerPiece ?? Infinity))
                  .map((r) => {
                    const p = r.eq?.pricePerPiece;
                    const isMin = p != null && p === minP;
                    const isReference = r.supplier === '3M';
                    return (
                      <Box key={r.supplier}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ width: 96, flexShrink: 0, fontWeight: isReference ? 800 : 600 }}
                            noWrap
                          >
                            {r.supplier}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {p != null ? (
                              <Box
                                sx={{
                                  width: `${(p / maxP) * 100}%`,
                                  minWidth: 40,
                                  height: 18,
                                  borderRadius: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  px: 1,
                                  bgcolor: isMin ? 'success.main' : isReference ? 'primary.main' : '#8f8b83',
                                }}
                              >
                                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>
                                  {fmtP(p)}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                no RFI price provided
                              </Typography>
                            )}
                          </Box>
                          {isReference && (
                            <Chip size="small" variant="outlined" label="Reference" sx={{ height: 20, fontSize: 10 }} />
                          )}
                          {isMin && (
                            <Chip size="small" variant="soft" color="success" label="cheapest" sx={{ height: 20, fontSize: 10 }} />
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ ml: '112px', display: 'block', fontWeight: 600 }}>
                          {r.product}
                        </Typography>
                        <Stack sx={{ ml: '112px' }} spacing={0.25}>
                          {r.facts.map((f, i) => (
                            <Stack key={i} direction="row" spacing={0.75} alignItems="flex-start">
                              <Iconify
                                icon={f.source === 'web' ? 'solar:info-circle-bold' : 'solar:file-text-bold'}
                                width={13}
                                sx={{ mt: '3px', flexShrink: 0, color: 'text.disabled' }}
                              />
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {f.text}{' '}
                                {f.source === 'web' && f.url ? (
                                  <Link href={f.url} target="_blank" rel="noopener" sx={{ fontSize: 10 }}>
                                    Source
                                  </Link>
                                ) : (
                                  <Box component="span" sx={{ fontSize: 10, color: 'text.disabled' }}>
                                    [RFI]
                                  </Box>
                                )}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'text.disabled' }}>
        {rechercheHinweis}
      </Typography>
    </Box>
  );
}
