'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { produktSpecs } from 'src/data/produkte';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { Vergleich } from './vergleich';
import { SpecKatalog } from './spec-katalog';

// ----------------------------------------------------------------------
// Product tab: neutral part descriptions across three workflow steps.



const demoTitleSx = {
  color: 'primary.main',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
} as const;

const demoRuleSx = { mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

const FLAGSHIP = produktSpecs[0];

const KERNZAHLEN = [
  {
    value: String(produktSpecs.length),
    label: 'neutral specs',
    note: 'derived from 10 RFI reference items: specifications rather than brand names',
  },
  {
    value: `${Math.round(produktSpecs.reduce((s, x) => s + x.totalQty, 0) / 1000)} thousand pieces`,
    label: 'bundled period demand',
    note: 'aggregated across brands and countries from the spend files',
  },
  {
    value: `${Math.round(produktSpecs.reduce((s, x) => s + x.totalEUR, 0) / 1000)} €k`,
    label: 'spend on these specs',
    note: 'supported reference items only: lower bound',
  },
  {
    value: String(produktSpecs.reduce((s, x) => s + x.nEquivalents, 0)),
    label: 'cross-brand equivalents',
    note: 'named by 10 suppliers in the synthetic RFI, with indicative prices',
  },
];

export function ProdukteView() {
  return (
    <DashboardContent maxWidth="xl">
      
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={<Typography sx={demoTitleSx}>Products: neutral item terminology</Typography>}
          subheader="From brand article to comparable spec: bundle, compare, decide"
        />
        <Box sx={demoRuleSx} />
        <Grid container spacing={3} sx={{ p: 3 }}>
          {KERNZAHLEN.map((k, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
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
              title={<Typography sx={demoTitleSx}>From branded item to specification</Typography>}
              subheader="AI decomposes each article name into neutral attributes, making brands comparable"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Box sx={{ px: 3, pb: 3 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ md: 'center' }}
                spacing={2}
              >
                <Box
                  sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral', minWidth: 280 }}
                >
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Branded item (HUB-N #{FLAGSHIP.code})
                  </Typography>
                  <Typography variant="subtitle2">{FLAGSHIP.brandName}</Typography>
                </Box>
                <Iconify
                  icon="solar:double-alt-arrow-right-bold-duotone"
                  width={28}
                  sx={{ color: 'primary.main', flexShrink: 0, mx: 'auto', transform: { xs: 'rotate(90deg)', md: 'none' } }}
                />
                <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap sx={{ flex: 1 }}>
                  {FLAGSHIP.chips.map((c) => (
                    <Chip key={c} color="primary" variant="soft" label={c} sx={{ fontWeight: 600 }} />
                  ))}
                </Stack>
              </Stack>
              <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                The same decomposition applies to every order line and RFI offer:
                two discs with the same grit, backing and attachment are treated as
                the same specification, whether branded 3M, Kovax or Mirka. This
                comparison uses grit, backing,
                and attachment to identify possible equivalents for validation.
              </Typography>
            </Box>
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Brand-independent demand aggregation</Typography>}
              subheader="Period demand per spec, bundled across all countries"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <SpecKatalog />
          </Card>
        </Grid>

        
        <Grid size={12}>
          <Card>
            <CardHeader
              title={<Typography sx={demoTitleSx}>Cross-brand comparison (synthetic)</Typography>}
              subheader="Same spec, every supplier: synthetic per-piece prices and product facts"
            />
            <Box sx={{ ...demoRuleSx, mb: 3 }} />
            <Vergleich />
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Basis: reference product terminology and synthetic offers. Comparison characteristics are illustrative demo assumptions, not manufacturer documentation.
      </Typography>
    </DashboardContent>
  );
}
