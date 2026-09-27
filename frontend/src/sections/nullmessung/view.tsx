'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  fmtEURk,
  rawSamples,
  refProducts,
  brandColor,
  rfiSuppliers,
  nullmessungMeta,
  nullmessungInsights,
  nullmessungCountries,
} from 'src/data/nullmessung';

import { Iconify } from 'src/components/iconify';

import { AgentFeed } from './agent-feed';
import { PriceSpread } from './price-spread';
import { DeltaAnalyse } from './delta-analyse';
import { SpendBarChart } from './spend-bar-chart';
import { QualityScorecard } from './quality-scorecard';
import { Gegenueberstellung } from './gegenueberstellung';

// ----------------------------------------------------------------------




const demoTitleSx = {
  color: 'primary.main',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
} as const;

const demoRuleSx = { mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

const INSIGHT_ICON = {
  finding: { icon: 'solar:verified-check-bold', color: 'success.main' },
  gap: { icon: 'solar:danger-triangle-bold', color: 'warning.main' },
  risk: { icon: 'solar:danger-triangle-bold', color: 'error.main' },
} as const;

type StatProps = { value: string; label: string };

function Stat({ value, label }: StatProps) {
  return (
    <Box>
      <Typography variant="h4" sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
}

export function NullmessungView() {
  const usable = nullmessungCountries.filter(
    (c) => c.quality === 'clean' || c.quality === 'raw'
  ).length;

  return (
    <DashboardContent maxWidth="xl">
      
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={<Typography sx={demoTitleSx}>Baseline: current market data</Typography>}
          subheader="Baseline: market spend exports, RFI feedback and offer sheet, consolidated"
        />
        <Box sx={demoRuleSx} />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={3}
          sx={{ p: 3 }}
        >
          <Box>
            <Typography variant="h2" sx={{ lineHeight: 1.1 }}>
              {fmtEURk(nullmessungMeta.totalEUR)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>identified purchasing volume from data nobody could put
              side by side before
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.disabled' }}>
              Synthetic purchasing scope with illustrative estimates and mixed catalogues.
            </Typography>
          </Box>

          <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
            <Stat value={String(nullmessungMeta.files)} label="Files processed" />
            <Stat value={String(nullmessungMeta.countries)} label="Countries" />
            <Stat
              value={nullmessungMeta.rows.toLocaleString('en-GB')}
              label="Data rows"
            />
            <Stat
              value={String(nullmessungMeta.languages.length)}
              label="Languages"
            />
            <Stat
              value={String(nullmessungMeta.currencies.length)}
              label="Currencies"
            />
            <Stat value={`${usable}/${nullmessungMeta.countries}`} label="usable" />
          </Stack>
        </Stack>

        {rawSamples.length > 0 && (
          <>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ p: 3, pt: 2.5 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled' }}>As delivered — as read
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                {rawSamples.map((s) => (
                  <Box
                    key={s.iso}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      p: 1.75,
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {s.iso} · {s.raw}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: brandColor(s.brand),
                        }}
                      />
                      <Typography variant="body2" noWrap>
                        {s.brand} · {s.readAs}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ ml: 'auto !important', flexShrink: 0, color: 'text.secondary' }}
                      >
                        {s.currency !== 'EUR'
                          ? `${s.valueLocal.toLocaleString('en-GB')} ${s.currency} → ${fmtEURk(s.valueEUR)}`
                          : fmtEURk(s.valueEUR)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Card>

      <Grid container spacing={3}>
        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>The agent raises an alert</Typography>}
              subheader="Push, not pull: the machine reaches out when a decision is needed"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <AgentFeed />
          </Card>
        </Grid>

        
        {nullmessungInsights.length > 0 && (
          <Grid size={12}>
            <Card>
              <CardHeader
                title={<Typography sx={demoTitleSx}>Insights</Typography>}
                subheader="What the machine found in the data pot"
              />
              <Box sx={demoRuleSx} />
              <Grid container spacing={2} sx={{ p: 3 }}>
                {nullmessungInsights.map((ins, i) => {
                  const cfg = INSIGHT_ICON[ins.kind];
                  return (
                    <Grid key={i} size={{ xs: 12, md: 6 }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Iconify
                          icon={cfg.icon}
                          width={20}
                          sx={{ mt: '2px', flexShrink: 0, color: cfg.color }}
                        />
                        <Box>
                          <Typography variant="body2">{ins.de}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {ins.en}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>
          </Grid>
        )}

        
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Volume per Country</Typography>}
              subheader="Identified 2026 purchasing by brand"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <SpendBarChart />
          </Card>
        </Grid>

        
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Price ranges</Typography>}
              subheader="Same article, different countries"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <PriceSpread />
            {!refProducts.length && (
              <Typography variant="body2" sx={{ p: 3, color: 'text.disabled' }}>
                No overlapping reference items found.
              </Typography>
            )}
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Delta analysis: negotiation targets</Typography>}
              subheader="What the numbers already say about achievable targets"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <DeltaAnalyse />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Data quality per Country</Typography>}
              subheader="What the markets delivered, assessed as-is"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <QualityScorecard />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={
                <Typography sx={demoTitleSx}>RFI versus accounting comparison</Typography>
              }
              subheader={`Current supply route versus RFI offer, ${rfiSuppliers.length} Suppliers: current supply route versus RFI offer`}
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <Gegenueberstellung />
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Source: synthetic hackathon commercial data. No customer records.
      </Typography>
    </DashboardContent>
  );
}
