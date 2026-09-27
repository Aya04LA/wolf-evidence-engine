'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { totals, fmtEUR, company, clusters, suppliers, countries } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { SortimentExplorer } from './sortiment-explorer';
import { SupplierMatchingTable } from './supplier-matching-table';

// ----------------------------------------------------------------------


function DemoSectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase' }}
      >
        {title}
      </Typography>
      <Box sx={{ mt: 1.5, height: 3, width: 1, bgcolor: 'primary.main' }} />
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

const TOTAL_DEALERS = countries.reduce((s, c) => s + c.dealers, 0);

const KPIS = [
  {
    label: 'Standardised line items',
    value: totals.positions.toLocaleString('en-GB'),
    hint: `from ${totals.submissions.toLocaleString('en-GB')} AI-structured demand submissions`,
    icon: 'solar:list-bold',
    valueColor: 'text.primary',
  },
  {
    label: 'Offers',
    value: totals.offers.toLocaleString('en-GB'),
    hint: `from ${suppliers.length} suppliers submitted`,
    icon: 'solar:file-text-bold',
    valueColor: 'text.primary',
  },
  {
    label: 'Price savings',
    value: fmtEUR(totals.priceSavingEUR),
    hint: 'versus current purchasing, Jan–Aug 2026',
    icon: 'solar:wad-of-money-bold',
    valueColor: 'success.main',
  },
  {
    label: 'Supply-route savings',
    value: fmtEUR(totals.logisticsSavingEUR),
    hint: 'through consolidated supply routes, Jan–Aug 2026',
    icon: 'carbon:delivery',
    valueColor: 'success.main',
  },
] as const;

// ----------------------------------------------------------------------

export function AusschreibungView() {
  const shortlist = suppliers.filter((s) => s.status === 'shortlist');

  
  
  const leadSuppliers = [...shortlist].sort((a, b) => b.matchScore - a.matchScore);
  const leadClusterIds = new Set(leadSuppliers.flatMap((s) => s.clusters));
  const leadCountryCount = new Set(leadSuppliers.flatMap((s) => s.countries)).size;
  const missingClusters = clusters.filter((c) => !leadClusterIds.has(c.id));
  const complementSupplier = suppliers
    .filter(
      (s) => s.status !== 'shortlist' && missingClusters.some((c) => s.clusters.includes(c.id)),
    )
    .sort((a, b) => b.matchScore - a.matchScore)[0];
  const combinedSavingEUR = totals.priceSavingEUR + totals.logisticsSavingEUR;

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        
        <Card sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            Luxury automotive manufacturer (fictional) · Tender
          </Typography>
          <Typography
            variant="h3"
            sx={{
              mt: 1,
              maxWidth: 760,
              fontWeight: 800,
              color: 'primary.main',
              textTransform: 'uppercase',
            }}
          >
            Offers compared with identified demand
          </Typography>
          <Box sx={{ mt: 2, height: 4, width: 1, bgcolor: 'primary.main' }} />
          <Typography variant="body1" sx={{ mt: 2.5, maxWidth: 680, color: 'text.secondary' }}>
            Suppliers bid against the standard catalogue ({totals.sortimentArtikel} Items,{' '}
            {clusters.length} categories). The platform compares each offer with demand,
            country coverage and supply routes across {TOTAL_DEALERS.toLocaleString('en-GB')} Locations
            in {countries.length} markets to establish whether it matches.
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mt: 3, flexWrap: 'wrap' }}
            useFlexGap
          >
            <Label variant="soft" color="primary">
              {fmtEUR(totals.spendEUR)} Volume Jan–Aug 2026
            </Label>
            <Label variant="soft" color="primary">
              {shortlist.length} shortlisted suppliers
            </Label>
            <Button
              component={RouterLink}
              href={paths.dashboard.vertraege}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 5 }}
              endIcon={<Iconify icon="eva:arrow-forward-fill" />}
            >
              Build contracts
            </Button>
          </Stack>
        </Card>

        
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {KPIS.map((kpi) => (
            <Card key={kpi.label} sx={{ p: 3 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  {kpi.label}
                </Typography>
                <Iconify icon={kpi.icon} width={22} sx={{ color: 'text.disabled' }} />
              </Stack>
              <Typography variant="h3" sx={{ mt: 1, color: kpi.valueColor }}>
                {kpi.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {kpi.hint}
              </Typography>
            </Card>
          ))}
        </Box>

        
        <SupplierMatchingTable />

        
        <Card>
          <CardHeader
            avatar={
              <Iconify icon="solar:verified-check-bold" width={28} sx={{ color: 'primary.main' }} />
            }
            title="Recommendation"
            subheader="Derived from demand, coverage and supply routes"
          />
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ maxWidth: 800 }}>
              {leadSuppliers.map((s) => s.name).join(' + ')} decken{' '}
              {missingClusters.length === 0
                ? `alle ${clusters.length}`
                : `${leadClusterIds.size} from ${clusters.length}`}{' '}
              Categories in{' '}
              {leadCountryCount === countries.length
                ? `allen ${countries.length}`
                : `${leadCountryCount} from ${countries.length}`}{' '}
              markets. Match scores {leadSuppliers.map((s) => `${s.matchScore} %`).join(' / ')}.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 0.5, sm: 1.5 }}
              alignItems={{ xs: 'flex-start', sm: 'baseline' }}
            >
              <Typography variant="h4" sx={{ color: 'success.main' }}>
                {fmtEUR(combinedSavingEUR)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                combined Jan–Aug 2026 impact: price savings plus consolidated supply routes
              </Typography>
            </Stack>

            {missingClusters.length > 0 && complementSupplier && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {complementSupplier.name} adds{' '}
                {missingClusters.map((c) => c.name).join(', ')} (Match{' '}
                {complementSupplier.matchScore} %) to cover the entire standard list across{' '}
                {leadSuppliers.length + 1} partners awarded.
              </Typography>
            )}

            <Box>
              <Button
                component={RouterLink}
                href="/dashboard/entscheidung"
                variant="contained"
                color="primary"
                sx={{ borderRadius: 5 }}
                startIcon={<Iconify icon="solar:full-screen-square-outline" />}
              >
                Present decision brief
              </Button>
            </Box>
          </Stack>
        </Card>

        
        <DemoSectionTitle
          title="Basis: the standard list"
          subtitle={`${clusters.length} Categories, ${totals.positions.toLocaleString('en-GB')} standardised line items: total volume ${fmtEUR(totals.spendEUR)} Jan–Aug 2026`}
        />

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {clusters.map((cluster) => (
            <Card key={cluster.id} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1">{cluster.name}</Typography>
              <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                {cluster.description}
              </Typography>

              <Stack spacing={1} sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Line items
                  </Typography>
                  <Typography variant="subtitle2">
                    {cluster.positions.toLocaleString('en-GB')}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Spend Jan–Aug 2026
                  </Typography>
                  <Typography variant="subtitle2">{fmtEUR(cluster.spendEUR)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Potential
                  </Typography>
                  <Label variant="soft" color="success">
                    −{cluster.savingPotentialPct.toLocaleString('en-GB', { maximumFractionDigits: 1 })} %
                  </Label>
                </Stack>
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  pt: 1.5,
                  borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                }}
              >
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                  Examples
                </Typography>
                {cluster.exampleItems.map((item) => (
                  <Typography
                    key={item}
                    variant="caption"
                    component="div"
                    sx={{ mt: 0.25, color: 'text.secondary' }}
                  >
                    · {item}
                  </Typography>
                ))}
              </Box>
            </Card>
          ))}
        </Box>

        
        <SortimentExplorer />

        
        <Card sx={{ p: { xs: 3, md: 4 }, bgcolor: 'background.neutral', boxShadow: 'none' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5">Shortlist → Contract builder</Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                {shortlist.map((supplier) => (
                  <Label key={supplier.id} variant="soft" color="primary">
                    {supplier.name}
                  </Label>
                ))}
              </Stack>
            </Box>
            <Button
              component={RouterLink}
              href={paths.dashboard.vertraege}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 5, flexShrink: 0 }}
              endIcon={<Iconify icon="eva:arrow-forward-fill" />}
            >
              Build contracts
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 2.5, color: 'text.secondary' }}
          >
            <Iconify icon="solar:cup-star-bold" width={18} />
            <Typography variant="body2">
              Each award creates training requirements in the{' '}
              <Box
                component={RouterLink}
                href={paths.dashboard.academy}
                sx={{ color: 'primary.main', fontWeight: 600 }}
              >
                Academy
              </Box>
              . {company.claim}
            </Typography>
          </Stack>
        </Card>

        
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 10, height: 10, bgcolor: 'primary.main', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Synthetic hackathon demo · Luxury car manufacturer (fictional) — Materials tender Body and paint
          </Typography>
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
