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
  hubs,
  supplierG2M,
  referenceArticles,
  domesticWarehouses,
} from 'src/data/lieferlinie';

import { Label } from 'src/components/label';

import { Netzwerk } from './netzwerk';
import { PainFeed } from './pain-feed';
import { G2mMatrix } from './g2m-matrix';
import { SzenarioRechner } from './szenario-rechner';

// ----------------------------------------------------------------------




const demoTitleSx = {
  color: 'primary.main',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
} as const;

const demoRuleSx = { mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

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

export function LieferlinieView() {
  const reachableCountries = new Set(hubs.flatMap((h) => h.deliversTo)).size;

  return (
    <DashboardContent maxWidth="xl">
      
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={<Typography sx={demoTitleSx}>Internal supply chain</Typography>}
          subheader="Can the group deliver itself? North hub, South hub and domestic warehouses as an alternative to wholesale"
          action={
            <Label color="error" variant="soft" sx={{ mt: 1, mr: 1 }}>
              Synthetic demo — NDA
            </Label>
          }
        />
        <Box sx={demoRuleSx} />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={3}
          sx={{ p: 3 }}
        >
          <Box sx={{ maxWidth: 520 }}>
            <Typography variant="body2">
              The fictional network connects North and South hubs with regional warehouses. Surcharges and routes are synthetic scenario assumptions.
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.disabled' }}>
              The fictional network connects two hubs and regional warehouses. All routes and surcharges are synthetic assumptions.
            </Typography>
          </Box>

          <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
            <Stat value={String(hubs.length)} label="Hubs (HUB-N, HUB-S)" />
            <Stat
              value={String(domesticWarehouses.length)}
              label="Domestic warehouses, pending"
            />
            <Stat
              value={String(reachableCountries)}
              label="deliverable countries"
            />
            <Stat value={String(supplierG2M.length)} label="Suppliers in the RFI" />
            <Stat
              value={String(referenceArticles.length)}
              label="Reference items"
            />
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Das interne Netz</Typography>}
              subheader="Hub-and-spoke: both hubs with surcharge per target country"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Netzwerk />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Aufschlags-Kaskade — Szenario-Rechner</Typography>}
              subheader="Source price through the surcharge cascade vs. today's local price"
            />
            <Box sx={demoRuleSx} />
            <SzenarioRechner />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Go-to-Market per Supplier</Typography>}
              subheader={`Direct markets, manufacturer warehouses, distributors and logistics options from ${supplierG2M.length}Routes to market and logistics-contract options from the RFI protocols`}
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <G2mMatrix />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>The agent raises an alert</Typography>}
              subheader="Push, not pull: structural pain points surfaced from the protocols"
            />
            <Box sx={{ ...demoRuleSx, mb: 1 }} />
            <PainFeed />
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Source: synthetic hackathon dataset with fictional hubs, surcharges and reference prices.
      </Typography>
    </DashboardContent>
  );
}
