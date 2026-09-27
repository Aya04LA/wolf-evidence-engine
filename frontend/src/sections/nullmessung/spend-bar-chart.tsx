'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  fmtEURk,
  OTHER_COLOR,
  BRAND_COLORS,
  SUPPLIER_PALETTE,
  nullmessungCountries,
} from 'src/data/nullmessung';

import { SpendDrilldown, type DrillTarget } from './spend-drilldown';

// ----------------------------------------------------------------------






const BAR_HEIGHT = 20;
const GAP = 2;
const UNASSIGNED_LABEL = 'Unassigned / Other';

type Segment = { brand: string; valueEUR: number; color: string; drillKey: string };


// wie auf blauen Segmenten lesbar sein).
function labelColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  // eslint-disable-next-line no-bitwise
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq > 150 ? 'rgba(0.0.0.0.78)' : 'rgba(255,255,255,0.95)';
}

function countrySegments(
  topBrands: { name: string; valueEUR: number }[],
  totalEUR: number
): Segment[] {
  const named = topBrands.filter((b) => b.valueEUR > 0 && b.name !== 'unassigned');
  const namedSum = named.reduce((s, b) => s + b.valueEUR, 0);
  const preAssigned = new Set(
    named.map((b) => BRAND_COLORS[b.name]).filter(Boolean) as string[]
  );
  const used = new Set(preAssigned);
  const segments: Segment[] = named.map((b) => {
    let color = BRAND_COLORS[b.name];
    if (!color) {
      color = SUPPLIER_PALETTE.find((c) => !used.has(c)) ?? OTHER_COLOR;
      used.add(color);
    }
    return { brand: b.name, valueEUR: b.valueEUR, color, drillKey: b.name };
  });

  const unassignedListed = topBrands
    .filter((b) => b.name === 'unassigned')
    .reduce((s, b) => s + b.valueEUR, 0);
  const rest = totalEUR - namedSum - unassignedListed;
  const grey = unassignedListed + (rest > totalEUR * 0.01 ? rest : 0);
  if (grey > 0) {
    segments.push({ brand: UNASSIGNED_LABEL, valueEUR: grey, color: OTHER_COLOR, drillKey: 'Sonstige' });
  }
  return segments;
}

export function SpendBarChart() {
  const [drill, setDrill] = useState<DrillTarget | null>(null);

  const rows = nullmessungCountries
    .filter((c) => c.totalEUR > 0)
    .sort((a, b) => b.totalEUR - a.totalEUR);

  if (!rows.length) return null;

  const max = rows[0].totalEUR;

  
  
  const brandsInUse = Object.keys(BRAND_COLORS).filter((brand) =>
    rows.some((c) => c.topBrands.some((b) => b.name === brand && b.valueEUR > 0))
  );

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Stack direction="row" flexWrap="wrap" spacing={2} sx={{ mb: 1 }}>
        {[...brandsInUse, UNASSIGNED_LABEL].map((brand) => (
          <Stack key={brand} direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '3px',
                bgcolor: brand === UNASSIGNED_LABEL ? OTHER_COLOR : BRAND_COLORS[brand],
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {brand}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Typography variant="caption" sx={{ mb: 2.5, display: 'block', color: 'text.disabled' }}>
        Other colours indicate country-specific suppliers and distributors; names appear on the
        segment or tooltip. Click a segment for invoice lines. These are
        country-specific supplier references. Click to inspect the
        invoice lines.
      </Typography>

      <Stack spacing={1.25}>
        {rows.map((c) => {
          const segments = countrySegments(c.topBrands, c.totalEUR);
          const widthPct = (c.totalEUR / max) * 100;
          return (
            <Stack key={c.iso} direction="row" alignItems="center" spacing={1.5}>
              <Typography
                variant="body2"
                sx={{ width: 96, flexShrink: 0, color: 'text.primary' }}
                noWrap
              >
                {c.name}
              </Typography>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', width: `${widthPct}%`, minWidth: 8 }}>
                  {segments.map((s, i) => (
                    <Tooltip
                      key={s.brand}
                      title={`${s.brand}: ${fmtEURk(s.valueEUR)} — Show rows`}
                      placement="top"
                      arrow
                    >
                      <Box
                        onClick={() =>
                          setDrill({
                            iso: c.iso,
                            country: c.name,
                            segment: s.brand,
                            drillKey: s.drillKey,
                            valueEUR: s.valueEUR,
                            color: s.color,
                          })
                        }
                        sx={{
                          height: BAR_HEIGHT,
                          bgcolor: s.color,
                          flexGrow: s.valueEUR,
                          flexBasis: 0,
                          minWidth: 3,
                          mr: i < segments.length - 1 ? `${GAP}px` : 0,
                          borderRadius: i === segments.length - 1 ? '0 4px 4px 0' : 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          '&:hover': { opacity: 0.85 },
                        }}
                      >
                        
                        {s.valueEUR / max > 0.09 && (
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              px: 0.75,
                              fontSize: 11,
                              lineHeight: 1,
                              color: labelColor(s.color),
                              pointerEvents: 'none',
                            }}
                          >
                            {s.brand === UNASSIGNED_LABEL ? 'Sonstige' : s.brand}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  width: 76,
                  flexShrink: 0,
                  textAlign: 'right',
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtEURk(c.totalEUR)}
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.disabled' }}>
        Usable
        accounting data only; fixed approximate FX rates.
      </Typography>
      <SpendDrilldown target={drill} onClose={() => setDrill(null)} />
    </Box>
  );
}
