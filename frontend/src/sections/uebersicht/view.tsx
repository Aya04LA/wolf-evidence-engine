'use client';

import type { Country } from 'src/data/platform';
import type { IconifyName } from 'src/components/iconify';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useLiveIntake } from 'src/hooks/use-live-intake';

import { DashboardContent } from 'src/layouts/dashboard';
import { companyKennzahlen, companyKennzahlenQuelle } from 'src/data/company-kennzahlen';
import { totals, fmtEUR, company, clusters, countries, suppliers, clusterById, intakeSubmissions } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { WorldMap } from './world-map';

// ----------------------------------------------------------------------

const heroPillSx = {
  px: 2.5,
  color: '#fff',
  borderRadius: 5,
  borderColor: 'rgba(255,255,255,0.48)',
  '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
} as const;

const pillSx = { borderRadius: 5 } as const;


const demoTitleSx = {
  color: 'primary.main',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
} as const;

const demoRuleSx = { mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

const totalStandorte = countries.reduce((s, c) => s + c.dealers, 0);

const fmtTimestamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  });

// ----------------------------------------------------------------------

type HeroNumberProps = { value: string; label: string };

function HeroNumber({ value, label }: HeroNumberProps) {
  return (
    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
      <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
        {label}
      </Typography>
    </Box>
  );
}

type StatTileProps = {
  label: string;
  value: string;
  icon: IconifyName;
  valueColor?: string;
  extra?: React.ReactNode;
};

function StatTile({ label, value, icon, valueColor, extra }: StatTileProps) {
  return (
    <Card sx={{ p: 3, position: 'relative' }}>
      <Iconify
        icon={icon}
        width={26}
        sx={{ top: 24, right: 24, position: 'absolute', color: 'text.disabled' }}
      />
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography
        variant="h3"
        sx={{ mt: 1, fontVariantNumeric: 'tabular-nums', ...(valueColor && { color: valueColor }) }}
      >
        {value}
      </Typography>
      {extra && <Box sx={{ mt: 1 }}>{extra}</Box>}
    </Card>
  );
}

// ----------------------------------------------------------------------

export function UebersichtView() {
  const router = useRouter();

  const [selected, setSelected] = useState<Country | null>(null);

  const { feed, extraSubmissions, latestIso } = useLiveIntake();

  const savingEUR = totals.priceSavingEUR + totals.logisticsSavingEUR;

  const liveSubmissions = Math.min(totals.submissionTarget, totals.submissions + extraSubmissions);

  const renderHero = () => (
    <Card
      sx={{
        p: { xs: 3, md: 5 },
        gap: 4,
        display: 'flex',
        color: 'common.white',
        backgroundImage:
          'linear-gradient(90deg, rgba(20,20,22,0.88) 0%, rgba(20,20,22,0.66) 55%, rgba(20,20,22,0.42) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
      }}
    >
      <Box sx={{ maxWidth: 620 }}>
        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.72)' }}>
          Materials tender Body and paint · Synthetic tender 09–12/2026
        </Typography>
        <Typography
          variant="h3"
          sx={{ mt: 1, letterSpacing: 0.5, textTransform: 'uppercase' }}
        >
          {company.claim}
        </Typography>
        <Box sx={{ my: 2, height: 3, width: 72, bgcolor: 'primary.main' }} />
        <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
          Body and paint materials intake across {countries.length} markets with{' '}
          {totalStandorte.toLocaleString('en-GB')} locations, forming the basis of the fictional manufacturer
          Tender 2026.
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            component={RouterLink}
            href={paths.dashboard.erhebung}
            variant="outlined"
            sx={heroPillSx}
          >
            Open demand intake
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.ausschreibung}
            variant="outlined"
            sx={heroPillSx}
          >
            Open tender
          </Button>
        </Stack>
      </Box>

      <Stack
        direction="row"
        spacing={4}
        flexWrap="wrap"
        useFlexGap
        sx={{ display: 'flex', flexShrink: 0, rowGap: 2 }}
      >
        <HeroNumber value={fmtEUR(totals.spendEUR)} label="Spend Jan–Aug 2026" />
        <HeroNumber value={`${liveSubmissions}/${totals.submissionTarget}`} label="Submissions" />
        <HeroNumber
          value={`${countries.length} · ${totalStandorte.toLocaleString('en-GB')}`}
          label="Markets · Locations"
        />
      </Stack>
    </Card>
  );

  const renderKennzahlen = () => (
    <Card>
      <CardHeader
        title="Fictional manufacturer in figures"
        subheader={`Source: ${companyKennzahlenQuelle}`}
        slotProps={{ title: { sx: demoTitleSx } }}
      />
      <Box sx={demoRuleSx} />
      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        {companyKennzahlen.map((k) => {
          const deltaPct = ((k.curr - k.prev) / k.prev) * 100;
          return (
            <Box key={k.id}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                {k.label}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
                <Typography
                  variant="h6"
                  sx={{ color: 'text.disabled', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                >
                  {k.fmt(k.prev)}
                </Typography>
                <Iconify
                  icon="eva:arrow-ios-forward-fill"
                  width={14}
                  sx={{ color: 'text.disabled', alignSelf: 'center' }}
                />
                <Typography
                  variant="h4"
                  sx={{ color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
                >
                  {k.fmt(k.curr)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                2025 → 2026 · {deltaPct >= 0 ? '+' : '−'}
                {Math.abs(deltaPct).toLocaleString('en-GB', { maximumFractionDigits: 1 })} %
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Divider sx={{ mx: 3, borderStyle: 'dashed' }} />
      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pt: 2, pb: 3 }}>
        These group figures include retail body and
        paint materials spending of around{' '}
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {fmtEUR(totals.spendEUR)} Jan–Aug 2026
        </Box>{' '}
        : the scope of this tender.
      </Typography>
    </Card>
  );

  const renderKpis = () => (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
      }}
    >
      <StatTile
        label="Identified savings"
        value={fmtEUR(savingEUR)}
        icon="solar:wad-of-money-bold"
        valueColor="success.main"
        extra={
          <Typography variant="caption" color="text.secondary">
            {fmtEUR(totals.priceSavingEUR)} Price · {fmtEUR(totals.logisticsSavingEUR)} Supply routes
            Jan–Aug 2026
          </Typography>
        }
      />
      <StatTile
        label="Supplier offers"
        value={totals.offers.toLocaleString('en-GB')}
        icon="solar:list-bold"
        extra={
          <Typography variant="caption" color="text.secondary">
            from {suppliers.length} Suppliers
          </Typography>
        }
      />
      <StatTile
        label="Ø Maturity"
        value={`${totals.avgMaturity.toFixed(1)} / 5`}
        icon="solar:shield-check-bold"
        extra={
          <Typography variant="caption" color="text.secondary">
            across {countries.length} Markets
          </Typography>
        }
      />
      <StatTile
        label="Intake progress"
        value={`${liveSubmissions}/${totals.submissionTarget}`}
        icon="solar:inbox-in-bold"
        extra={
          <Stack spacing={0.75}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (liveSubmissions / totals.submissionTarget) * 100)}
              sx={{ height: 6, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {Math.max(0, totals.submissionTarget - liveSubmissions).toLocaleString('en-GB')}{' '}
              Submissions pending
            </Typography>
          </Stack>
        }
      />
    </Box>
  );

  const renderClusters = () => (
    <Card>
      <CardHeader
        title="Categories"
        subheader={`Standard catalogue (${totals.sortimentArtikel} Items) across all ${countries.length} Markets`}
        slotProps={{ title: { sx: demoTitleSx } }}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.ausschreibung}
            size="small"
            variant="outlined"
            color="inherit"
            sx={pillSx}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Open tender
          </Button>
        }
      />
      <Box sx={demoRuleSx} />
      <TableContainer sx={{ mt: 1, pb: 3, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Line items</TableCell>
              <TableCell align="right">Spend Jan–Aug 2026</TableCell>
              <TableCell align="right">Savings potential</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clusters.map((c) => (
              <TableRow
                key={c.id}
                hover
                onClick={() => router.push(paths.dashboard.ausschreibung)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="subtitle2">{c.name}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    title={c.description}
                    sx={{ display: 'block' }}
                  >
                    {c.description}
                  </Typography>
                </TableCell>
                <TableCell align="right">{c.positions.toLocaleString('en-GB')}</TableCell>
                <TableCell align="right">{fmtEUR(c.spendEUR)}</TableCell>
                <TableCell align="right">
                  <Label color="success" variant="soft">
                    −{c.savingPotentialPct.toLocaleString('en-GB', { minimumFractionDigits: 1 })} %
                  </Label>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  const renderIntake = () => (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: 'success.main',
                '@keyframes wolfLivePulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.48)' },
                  '100%': { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
                },
                animation: 'wolfLivePulse 2.4s ease-out infinite',
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
            <Box component="span" sx={demoTitleSx}>
              Demand submissions — Live inbox
            </Box>
          </Stack>
        }
        subheader="AI-structured from voice, photos and delivery notes"
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.erhebung}
            size="small"
            variant="outlined"
            color="inherit"
            sx={pillSx}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Open demand intake
          </Button>
        }
      />
      <Box sx={demoRuleSx} />
      <Stack divider={<Divider />} sx={{ px: 3, pt: 2, pb: 3 }}>
        {feed.map((sub) => (
          <Box
            key={sub.key}
            sx={{
              py: 2,
              '@keyframes wolfSlideIn': {
                from: { opacity: 0, transform: 'translateY(-12px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              animation: 'wolfSlideIn 400ms ease-out',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {sub.site}
                </Typography>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Live · just received
                </Typography>
              </Box>
              <Label
                color={sub.status === 'structured' ? 'success' : 'warning'}
                variant="soft"
                sx={{ flexShrink: 0 }}
              >
                {sub.status}
              </Label>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Label color="info" variant="soft">
                {sub.channel}
              </Label>
              <Label variant="soft">{sub.language}</Label>
            </Stack>

            <Stack spacing={0.25} sx={{ mt: 1.25 }}>
              {sub.items.slice(0, 2).map((item, idx) => (
                <Typography key={idx} variant="caption" color="text.secondary">
                  • {item.item} — {item.qty}
                </Typography>
              ))}
              {sub.items.length > 2 && (
                <Typography variant="caption" color="text.disabled">
                  +{sub.items.length - 2} additional item(s)
                </Typography>
              )}
            </Stack>
          </Box>
        ))}

        {intakeSubmissions.map((sub) => (
          <Box key={sub.id} sx={{ py: 2 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {sub.site}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fmtTimestamp(sub.timestamp)} 
                </Typography>
              </Box>
              <Label
                color={sub.status === 'structured' ? 'success' : 'warning'}
                variant="soft"
                sx={{ flexShrink: 0 }}
              >
                {sub.status}
              </Label>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Label color="info" variant="soft">
                {sub.channel}
              </Label>
              <Label variant="soft">{sub.language}</Label>
            </Stack>

            <Stack spacing={0.25} sx={{ mt: 1.25 }}>
              {sub.items.slice(0, 2).map((item, idx) => (
                <Typography key={idx} variant="caption" color="text.secondary">
                  • {item.item} — {item.qtyPerMonth}
                </Typography>
              ))}
              {sub.items.length > 2 && (
                <Typography variant="caption" color="text.disabled">
                  +{sub.items.length - 2} additional item(s)
                </Typography>
              )}
            </Stack>

            {sub.painPoints.length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  mt: 1.25,
                  pl: 1.25,
                  display: 'block',
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  borderLeft: (theme) => `solid 2px ${theme.vars.palette.divider}`,
                }}
              >
                „{sub.painPoints[0]}“
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Card>
  );

  const renderDrawer = () => (
    <Drawer
      anchor="right"
      open={!!selected}
      onClose={() => setSelected(null)}
      slotProps={{ paper: { sx: { width: { xs: 1, sm: 400 } } } }}
    >
      {selected && (
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" sx={demoTitleSx}>
              {selected.name}
            </Typography>
            <IconButton onClick={() => setSelected(null)}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
          <Box sx={{ mt: 1.5, height: 3, bgcolor: 'primary.main' }} />

          <Stack direction="row" spacing={0.75} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Label color="primary" variant="soft">
              {selected.region}
            </Label>
            <Label variant="soft">{selected.language}</Label>
            <Label variant="soft">Market since {selected.entryYear}</Label>
          </Stack>

          <Box
            sx={{
              mt: 3,
              gap: 2,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
            }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                Locations
              </Typography>
              <Typography variant="h6">{selected.dealers.toLocaleString('en-GB')}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                Body Shops
              </Typography>
              <Typography variant="h6">{selected.bodyShops.toLocaleString('en-GB')}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                Revenue Jan–Aug 2026
              </Typography>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                {fmtEUR(selected.revenueEUR)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle2">Demand submissions</Typography>
            <Typography variant="body2" color="text.secondary">
              {selected.submissions} / {selected.submissionTarget}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (selected.submissions / selected.submissionTarget) * 100)}
            sx={{ height: 6, borderRadius: 1 }}
          />

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">Maturity</Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ typography: 'subtitle2', color: 'primary.main' }}>
                {selected.maturity}
              </Box>{' '}
              / 5
            </Typography>
          </Stack>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Top demand
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {selected.topDemands.map((id) => (
              <Label key={id} variant="soft">
                {clusterById(id)?.name ?? id}
              </Label>
            ))}
          </Stack>

          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            Supply route today
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {selected.supplyDependency}
          </Typography>

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              href={`${paths.dashboard.erhebung}?markt=${selected.iso}`}
              variant="outlined"
              color="inherit"
              fullWidth
              sx={pillSx}
            >
              Open demand intake
            </Button>
            <Button
              component={RouterLink}
              href={`${paths.dashboard.reifegrad}?markt=${selected.iso}`}
              variant="outlined"
              color="inherit"
              fullWidth
              sx={pillSx}
            >
              View maturity
            </Button>
          </Stack>
        </Box>
      )}
    </Drawer>
  );

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        {renderHero()}
        {renderKennzahlen()}
        {renderKpis()}
        <WorldMap onSelect={setSelected} pingIso={latestIso} />
        <Box
          sx={{
            gap: 3,
            display: 'grid',
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          }}
        >
          {renderClusters()}
          {renderIntake()}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pt: 1 }}>
          <Box sx={{ width: 10, height: 10, flexShrink: 0, bgcolor: 'primary.main' }} />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Synthetic hackathon demo · Luxury car manufacturer (fictional) — Materials tender Body and paint
          </Typography>
        </Stack>
      </Stack>

      {renderDrawer()}
    </DashboardContent>
  );
}
