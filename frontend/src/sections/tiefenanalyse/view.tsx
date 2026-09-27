'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { taMeta, grenzen, kernzahlen } from 'src/data/tiefenanalyse';

import { Iconify } from 'src/components/iconify';

import { Pareto } from './pareto';
import { Regeln } from './regeln';
import { Monitor } from './monitor';
import { Rhythmus } from './rhythmus';
import { Bewertung } from './bewertung';
import { Rechnungsweg } from './rechnungsweg';
import { Artikelsprache } from './artikelsprache';

// ----------------------------------------------------------------------




const demoTitleSx = {
  color: 'primary.main',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
} as const;

const demoRuleSx = { mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

export function TiefenanalyseView() {
  return (
    <DashboardContent maxWidth="xl">
      
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={<Typography sx={demoTitleSx}>Deep analysis: patterns behind the baseline</Typography>}
          subheader="Article language, variety, supply routes, rhythm — recomputed against the raw data"
        />
        <Box sx={demoRuleSx} />
        <Grid container spacing={3} sx={{ p: 3 }}>
          {kernzahlen.map((k, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <Typography variant="h3" sx={{ lineHeight: 1.15, color: 'primary.main' }}>
                {k.value}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                {k.label}
              </Typography>
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                {k.note}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Card>

      <Grid container spacing={3}>
        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Missing shared item terminology</Typography>}
              subheader="How much spend joins to the tender basket?"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Artikelsprache />
          </Card>
        </Grid>

        
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Variety is manageable</Typography>}
              subheader="How many articles carry 80% of spend?"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Pareto />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Invoice route per Market</Typography>}
              subheader="Manufacturer entity or distributor, and where the RFI offers direct supply"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Rechnungsweg />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Supplier assessment matrix (RFI)</Typography>}
              subheader="Synthetic offer matrix and illustrative fulfillment scores"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Bewertung />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Ordering pattern</Typography>}
              subheader="Monthly patterns where markets provide them"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Rhythmus />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>If-then rules</Typography>}
              subheader="The patterns as transparent rules, no model needed"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <Regeln />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>From report to continuous monitoring</Typography>}
              subheader="What Lab monitors continuously through tender and contract phase"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <Monitor />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Measurement limits</Typography>}
              subheader="What this data cannot show, stated openly"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <Stack spacing={1.5} sx={{ p: 3 }}>
              {grenzen.map((g, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                  <Iconify
                    icon="solar:info-circle-bold"
                    width={18}
                    sx={{ mt: '2px', flexShrink: 0, color: 'text.disabled' }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {g}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Basis: {taMeta.basis}. Source: synthetic hackathon dataset. Updated: {taMeta.stand}
      </Typography>
    </DashboardContent>
  );
}
