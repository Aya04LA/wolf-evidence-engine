'use client';

import type { PriceBasis, RepairCase, SupplierSystem } from 'src/data/systemvergleich';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { DashboardContent } from 'src/layouts/dashboard';
import { OTHER_COLOR, BRAND_COLORS } from 'src/data/nullmessung';
import {
  repairCases,
  systemCosts,
  SOURCE_LABEL,
  DEFAULT_HOURLY_RATE,
} from 'src/data/systemvergleich';

// ----------------------------------------------------------------------

// Schleifsystem gegen Schleifsystem je Reparaturfall. Jede Marke arbeitet



const demoTitleSx = {
  color: 'primary.main',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
} as const;

const demoRuleSx = { mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

const fmtEUR = (v: number, digits = 2) =>
  `${v.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })} €`;

const fmtEURk = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 2 })} €m`
    : `${Math.round(v / 1000).toLocaleString('en-GB')} €k`;

const SOURCE_COLOR = {
  nullmessung: '#2E7D32',
  listenpreis_web: '#B26A00',
  hersteller_sop: '#2E7D32',
  annahme: '#9B9B9D',
} as const;

const supplierColor = (s: string) => BRAND_COLORS[s] ?? OTHER_COLOR;

// ----------------------------------------------------------------------

function SystemLane({
  system,
  basis,
  hourlyRate,
  volume,
  bestTotal,
}: {
  system: SupplierSystem;
  basis: PriceBasis;
  hourlyRate: number;
  volume: number;
  bestTotal: number;
}) {
  const color = supplierColor(system.supplier);
  const costs = systemCosts(system, basis, hourlyRate);
  const isBest = Math.abs(costs.totalEUR - bestTotal) < 1e-9;
  const deltaPct = ((costs.totalEUR - bestTotal) / bestTotal) * 100;

  return (
    <Box sx={{ px: 3, py: 2.5, '&:not(:last-of-type)': { borderBottom: '1px dashed', borderColor: 'divider' } }}>
      
      <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: color }} />
        <Typography variant="subtitle1" sx={{ mr: 1 }}>
          {system.supplier} · {system.systemName}
        </Typography>
        <Tooltip arrow title={system.prozessQuelle}>
          <Chip
            size="small"
            variant="outlined"
            label="Synthetic process assumption"
            color={system.chainSource === 'hersteller_sop' ? 'success' : 'default'}
          />
        </Tooltip>
        <Chip
          size="small"
          variant="outlined"
          label={`Instructions ${system.status.anleitung}`}
          color={system.status.anleitung === 'received' ? 'success' : 'default'}
        />
        <Chip size="small" variant="outlined" label={`Products ${system.status.produkte}`} />
        <Chip size="small" variant="outlined" label={`Test ${system.status.test}`} color="warning" />
        <Chip size="small" variant="outlined" label={`Setup time ~${system.setupMin} min`} />
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'stretch' }}>
        
        <Box sx={{ flexGrow: 1, minWidth: 0, overflowX: 'auto' }}>
          <Stack direction="row" spacing={0} alignItems="stretch" sx={{ minWidth: 'fit-content' }}>
            {system.steps.map((st, i) => (
              <Stack key={st.articleNo} direction="row" alignItems="center">
                <Tooltip
                  arrow
                  title={`${st.product} (${st.articleNo}) — Price ${fmtEUR(st.priceEUR[basis])}/${st.unit} [${SOURCE_LABEL[st.priceSource[basis]]}], Consumption ${st.consumption.toLocaleString('en-GB')} ${st.unit}/Reparatur, ${st.timeMin.toLocaleString('en-GB')} min`}
                >
                  <Box
                    sx={{
                      width: 168,
                      p: 1.25,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderTop: `3px solid ${color}`,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                      <Typography variant="subtitle2" sx={{ color }}>
                        {st.grit}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {st.timeMin.toLocaleString('en-GB')} min
                      </Typography>
                    </Stack>
                    <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                      {st.product}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {st.consumption.toLocaleString('en-GB')} × {fmtEUR(st.priceEUR[basis])}
                      </Typography>
                      <Tooltip arrow title={`Price source: ${SOURCE_LABEL[st.priceSource[basis]]}`}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: SOURCE_COLOR[st.priceSource[basis]],
                          }}
                        />
                      </Tooltip>
                    </Stack>
                  </Box>
                </Tooltip>
                {i < system.steps.length - 1 && (
                  <Box sx={{ width: 22, height: 2, bgcolor: 'divider', mx: 0.25 }} />
                )}
              </Stack>
            ))}
          </Stack>
          {system.note && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.disabled' }}>
              {system.note}
            </Typography>
          )}
        </Box>

        
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: 1, lg: 300 },
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: isBest ? color : 'divider',
            bgcolor: isBest ? `${color}14` : 'transparent',
          }}
        >
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h4" noWrap sx={{ color: 'text.primary' }}>
              {fmtEUR(costs.totalEUR)}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
              per Repair
            </Typography>
            {!isBest && (
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                +{deltaPct.toLocaleString('en-GB', { maximumFractionDigits: 0 })} %
              </Typography>
            )}
          </Stack>
          {isBest && (
            <Chip
              size="small"
              label="lowest-cost system"
              sx={{ mt: 0.5, bgcolor: `${color}22`, color, fontWeight: 700 }}
            />
          )}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Material {fmtEUR(costs.materialEUR)} · Labour time {costs.timeMin.toLocaleString('en-GB')}{' '}
            min = {fmtEUR(costs.laborEUR)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
            {fmtEURk(costs.totalEUR * volume)} p.a.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            at {volume.toLocaleString('en-GB')} jobs/year
            {!isBest &&
              ` · Additional cost ${fmtEURk((costs.totalEUR - bestTotal) * volume)} versus cheapest`}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function SystemvergleichView() {
  const [caseId, setCaseId] = useState<string>(repairCases[0].id);
  const [basis, setBasis] = useState<PriceBasis>('AT');
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const repairCase = repairCases.find((c) => c.id === caseId) as RepairCase;
  const [volumes, setVolumes] = useState<Record<string, number>>(() =>
    Object.fromEntries(repairCases.map((c) => [c.id, c.defaultVolume]))
  );
  const volume = volumes[caseId];

  const bestTotal = useMemo(
    () => Math.min(...repairCase.systems.map((s) => systemCosts(s, basis, hourlyRate).totalEUR)),
    [repairCase, basis, hourlyRate]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Typography sx={demoTitleSx}>Abrasives test — System comparison</Typography>
          }
          subheader="Not product vs. product but sanding system vs. sanding system per repair case, each brand following its own process guide"
        />
        <Box sx={demoRuleSx} />

        
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ md: 'center' }}
          sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack spacing={0.75}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Repair case
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={caseId}
              onChange={(_, v) => v && setCaseId(v)}
            >
              {repairCases.map((c) => (
                <ToggleButton key={c.id} value={c.id} sx={{ px: 1.5 }}>
                  {c.title}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={0.75}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Price basis
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={basis}
              onChange={(_, v) => v && setBasis(v)}
            >
              <ToggleButton value="AT" sx={{ px: 2 }}>
                Austria
              </ToggleButton>
              <ToggleButton value="PT" sx={{ px: 2 }}>
                Portugal
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={0.75} sx={{ minWidth: 220, flexGrow: 1, maxWidth: 340 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Jobs per Year: <b>{volume.toLocaleString('en-GB')}</b>
            </Typography>
            <Slider
              size="small"
              value={volume}
              min={Math.round(repairCase.volumeMax * 0.05)}
              max={repairCase.volumeMax}
              step={Math.round(repairCase.volumeMax / 100)}
              onChange={(_, v) => setVolumes((prev) => ({ ...prev, [caseId]: v as number }))}
            />
          </Stack>

          <Stack spacing={0.75} sx={{ minWidth: 180, maxWidth: 240 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Hourly labour rate: <b>{hourlyRate} €/h</b> (Assumption)
            </Typography>
            <Slider
              size="small"
              value={hourlyRate}
              min={30}
              max={120}
              step={5}
              onChange={(_, v) => setHourlyRate(v as number)}
            />
          </Stack>
        </Stack>

        
        <Box sx={{ px: 3, pt: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {repairCase.subtitle}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {repairCase.volumeNote}
          </Typography>
        </Box>

        
        <Box sx={{ mt: 1 }}>
          {repairCase.systems.map((s) => (
            <SystemLane
              key={s.supplier}
              system={s}
              basis={basis}
              hourlyRate={hourlyRate}
              volume={volume}
              bestTotal={bestTotal}
            />
          ))}
        </Box>

        
        <Box sx={{ px: 3, pb: 3, pt: 1 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
            {(Object.keys(SOURCE_LABEL) as (keyof typeof SOURCE_LABEL)[]).map((k) => (
              <Stack key={k} direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: SOURCE_COLOR[k] }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {SOURCE_LABEL[k]}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>
            All process chains, prices, consumption and times are synthetic hackathon assumptions. They compare fictional systems and are not manufacturer specifications.
          </Typography>
        </Box>
      </Card>
    </DashboardContent>
  );
}
