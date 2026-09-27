'use client';

import { varAlpha } from 'minimal-shared/utils';
import { useRef, useState, Suspense, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  company,
  countries,
  contracts,
  trainings,
  countryByIso,
  trainingById,
  maturityByIso,
  maturityProfiles,
  maturityDimensions,
} from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ScoreTone = 'success' | 'warning' | 'error';

const scoreTone = (v: number): ScoreTone => (v >= 3.5 ? 'success' : v >= 2.5 ? 'warning' : 'error');

const fmtScore = (v: number) => v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const avgOf = (scores: Record<string, number>) => {
  const vals = Object.values(scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

const formatIcon = (format: string) =>
  format === 'Roleplay' ? 'solar:microphone-bold' : 'solar:videocamera-record-bold';

const maturityLevels = [
  { level: 1, name: 'Ad-hoc', text: 'No shared standard; each workshop manages its own materials and processes.' },
  { level: 2, name: 'Repeatable', text: 'Initial standards exist but are applied inconsistently and rarely documented.' },
  { level: 3, name: 'Defined', text: 'The demo standard is documented, taught and adopted across sites.' },
  { level: 4, name: 'Managed', text: 'Metric-based management and consistent quality across workshops.' },
  { level: 5, name: 'Optimised', text: 'Continuous improvement; the market acts as a network benchmark.' },
];


const levelOf = (v: number) => Math.min(5, Math.max(1, Math.floor(v)));

const statusText = (v: number) => {
  const lvl = levelOf(v);
  return `Level ${lvl} — ${maturityLevels[lvl - 1].name}`;
};

// Map country-language labels to training language codes.
const LANGUAGE_CODES: Record<string, string> = {
  German: 'DE',
  English: 'EN',
  Spanish: 'ES',
  French: 'FR',
  Italian: 'IT',
  Portuguese: 'PT',
  Polish: 'PL',
  Czech: 'CS',
  Swedish: 'SV',
  Mandarin: 'ZH',
  Japanese: 'JA',
};


const isInCountryLanguage = (countryLanguage: string, trainingLanguages: string[]) =>
  countryLanguage
    .split('/')
    .map((part) => LANGUAGE_CODES[part.trim()])
    .some((code) => code !== undefined && trainingLanguages.includes(code));


const REGION_ORDER = [
  'Austria',
  'Northern Europe',
  'Central and Eastern Europe',
  'Southwestern Europe',
  'Asia',
  'South America',
] as const;

const GAP_PREVIEW_COUNT = 6;

// ----------------------------------------------------------------------


export function ReifegradView() {
  return (
    <Suspense fallback={null}>
      <ReifegradViewContent />
    </Suspense>
  );
}

function ReifegradViewContent() {
  const [showAllGaps, setShowAllGaps] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const marktParam = searchParams.get('markt');

  
  const [highlightedIso, setHighlightedIso] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!marktParam) return undefined;

    const iso = marktParam.toUpperCase();
    if (!countryByIso(iso)) return undefined;

    
    const scrollTimer = setTimeout(() => {
      rowRefs.current[iso]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    setHighlightedIso(iso);
    const highlightTimer = setTimeout(() => setHighlightedIso(null), 2000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
    };
  }, [marktParam]);

  
  const rows = maturityProfiles
    .map((profile) => ({
      profile,
      country: countryByIso(profile.iso)!,
      avg: avgOf(profile.scores),
    }))
    .sort((a, b) => b.avg - a.avg);

  
  const regionGroups = REGION_ORDER.map((region) => {
    const regionRows = rows.filter((r) => r.country.region === region);
    return {
      region,
      rows: regionRows,
      avg: regionRows.length
        ? regionRows.reduce((s, r) => s + r.avg, 0) / regionRows.length
        : 0,
    };
  }).filter((g) => g.rows.length > 0);

  const globalAvg = rows.reduce((s, r) => s + r.avg, 0) / rows.length;
  const marketsAtLevel3 = rows.filter((r) => r.avg >= 3).length;
  const recommendationCount = maturityProfiles.reduce((s, p) => s + p.gaps.length, 0);
  const completionsTotal = trainings.reduce((s, t) => s + t.completions, 0);

  
  const gateBlockedContracts = contracts.filter((c) =>
    c.countries.some((iso) => {
      const p = maturityByIso(iso);
      return p ? p.scores[c.maturityGate.dimension] < c.maturityGate.target : false;
    })
  );

  
  const gapRows = [...rows].filter((r) => r.profile.gaps.length > 0).sort((a, b) => a.avg - b.avg);
  const visibleGapRows = showAllGaps ? gapRows : gapRows.slice(0, GAP_PREVIEW_COUNT);

  
  const dimensionAvg: Record<string, number> = Object.fromEntries(
    maturityDimensions.map((dim) => [
      dim.id,
      maturityProfiles.reduce((s, p) => s + p.scores[dim.id], 0) / maturityProfiles.length,
    ])
  );
  const weakestDimensionId = maturityDimensions.reduce((min, dim) =>
    dimensionAvg[dim.id] < dimensionAvg[min.id] ? dim : min
  ).id;

  const renderHero = () => (
    <Card sx={{ p: { xs: 3, md: 5 } }}>
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Luxury car manufacturer (fictional) · Materials tender Body and paint
      </Typography>

      <Typography
        variant="h3"
        sx={{ mt: 1, maxWidth: 760, color: 'primary.main', fontWeight: 800, textTransform: 'uppercase' }}
      >
        Maturity: from workshop floor to tender
      </Typography>

      <Box sx={{ mt: 2, height: 3, bgcolor: 'primary.main' }} />

      <Typography variant="body1" sx={{ mt: 2.5, maxWidth: 680, color: 'text.secondary' }}>
        Five dimensions reveal gaps in each market and determine which
        training it needs, across {countries.length} retail markets and {company.standorte}{' '}
        locations. „{company.claim}“
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap' }} useFlexGap>
        <Button
          component={RouterLink}
          href={paths.dashboard.academy}
          variant="contained"
          color="primary"
          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          sx={{ borderRadius: 5 }}
        >
          Open academy
        </Button>
        <Button
          component={RouterLink}
          href={paths.dashboard.vertraege}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 5 }}
        >
          View contracts
        </Button>
      </Stack>
    </Card>
  );

  const kpis = [
    {
      label: 'Ø Maturity global',
      value: fmtScore(globalAvg),
      hint: `Scale 1–5, across ${rows.length} Markets`,
      icon: 'solar:chart-square-outline',
    },
    {
      label: 'Markets ≥ Level 3',
      value: `${marketsAtLevel3}/${rows.length}`,
      hint: 'Target: all markets by contract start',
      icon: 'solar:verified-check-bold',
    },
    {
      label: 'Derived training recommendations',
      value: recommendationCount.toLocaleString('en-GB'),
      hint: 'automatically derived from heatmap gaps',
      icon: 'solar:notebook-bold-duotone',
    },
    {
      label: 'Completed training',
      value: completionsTotal.toLocaleString('en-GB'),
      hint: 'across markets and formats',
      icon: 'solar:cup-star-bold',
    },
  ] as const;

  const renderKpis = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
      }}
    >
      {kpis.map((kpi) => (
        <Card key={kpi.label} sx={{ p: 3 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              {kpi.label}
            </Typography>
            <Iconify icon={kpi.icon} width={22} sx={{ color: 'text.disabled', flexShrink: 0 }} />
          </Stack>
          <Typography variant="h3" sx={{ mt: 1, color: 'primary.main' }}>
            {kpi.value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {kpi.hint}
          </Typography>
        </Card>
      ))}
    </Box>
  );

  const renderModel = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      }}
    >
      {maturityDimensions.map((dim, index) => {
        const avg = dimensionAvg[dim.id];
        return (
          <Card key={dim.id} sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'primary.main' }}>
              D{index + 1}
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {dim.name}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              {dim.description}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                {fmtScore(avg)}
              </Typography>
              <Label color={scoreTone(avg)} variant="soft">
                {statusText(avg)}
              </Label>
            </Stack>

            
            <Box
              sx={(theme) => ({
                mt: 1.5,
                height: 6,
                borderRadius: 0.75,
                bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
              })}
            >
              <Box
                sx={{
                  height: 1,
                  borderRadius: 0.75,
                  width: `${(avg / 5) * 100}%`,
                  bgcolor: 'primary.main',
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
              Ø across all {maturityProfiles.length} Markets
            </Typography>
            {dim.id === weakestDimensionId && (
              <Typography variant="caption" sx={{ display: 'block', color: 'warning.main' }}>
                largest network gap
              </Typography>
            )}
          </Card>
        );
      })}

      <Card sx={{ p: 3, bgcolor: 'background.neutral', boxShadow: 'none' }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          levels
        </Typography>
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {maturityLevels.map((lvl) => (
            <Stack key={lvl.level} direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={(theme) => ({
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  display: 'flex',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  typography: 'caption',
                  fontWeight: 700,
                  color: 'text.primary',
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
                })}
              >
                {lvl.level}
              </Box>
              <Box>
                <Typography variant="subtitle2" component="span">
                  {lvl.name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  {lvl.text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Box>
  );

  const renderCell = (value: number, tooltip?: string) => {
    const tone = scoreTone(value);

    const cell = (
      <Box
        className="heatmap-row-cell"
        sx={(theme) => ({
          py: 1,
          borderRadius: 1.5,
          textAlign: 'center',
          typography: 'subtitle2',
          color: theme.vars.palette[tone].darker,
          bgcolor: varAlpha(theme.vars.palette[tone].mainChannel, 0.2),
        })}
      >
        {fmtScore(value)}
      </Box>
    );

    return tooltip ? (
      <Tooltip title={tooltip} arrow>
        {cell}
      </Tooltip>
    ) : (
      cell
    );
  };

  const headCellSx = {
    py: 1,
    top: 0,
    zIndex: 9,
    position: 'sticky',
    bgcolor: 'background.paper',
    color: 'text.secondary',
  } as const;

  const renderHeatmap = () => (
    <Card>
      <CardHeader
        title="Maturity heatmap"
        subheader={`${rows.length} Markets in ${regionGroups.length} regions × ${maturityDimensions.length} dimensions. Scale 1 (ad hoc) to 5 (optimised). Click a row for academy training recommendations.`}
      />

      <Box sx={{ maxHeight: 640, overflow: 'auto', px: 3, pb: 3, mt: 3 }}>
        <Box
          sx={{
            minWidth: 820,
            display: 'grid',
            columnGap: 1,
            rowGap: 1,
            gridTemplateColumns: 'minmax(220px, 1.6fr) repeat(5, 1fr) 0.9fr',
            alignItems: 'center',
          }}
        >
          <Typography variant="overline" sx={headCellSx}>
            Market
          </Typography>
          {maturityDimensions.map((dim) => (
            <Tooltip key={dim.id} title={dim.description} arrow>
              <Typography
                variant="overline"
                sx={{ ...headCellSx, textAlign: 'center', cursor: 'default' }}
              >
                {dim.name}
              </Typography>
            </Tooltip>
          ))}
          <Typography variant="overline" sx={{ ...headCellSx, textAlign: 'center' }}>
            Ø
          </Typography>

          {regionGroups.map((group) => (
            <Box key={group.region} sx={{ display: 'contents' }}>
              
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ gridColumn: '1 / -1', mt: 1 }}
              >
                <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', flexShrink: 0 }} />
                <Typography variant="overline" sx={{ color: 'text.primary' }}>
                  {group.region}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {group.rows.length} {group.rows.length === 1 ? 'Market' : 'Markets'} · Ø{' '}
                  {fmtScore(group.avg)}
                </Typography>
              </Stack>

              {group.rows.map(({ profile, country, avg }) => (
                
                // display: contents has no box; apply hover styling to the child cells.
                
                <Box
                  key={profile.iso}
                  onClick={() => router.push(`${paths.dashboard.academy}?markt=${profile.iso}`)}
                  role="link"
                  aria-label={`Training recommendations for ${country.name} Open in the academy`}
                  sx={(theme) => ({
                    display: 'contents',
                    cursor: 'pointer',
                    '& .heatmap-row-cell': {
                      transition: theme.transitions.create(['box-shadow', 'background-color'], {
                        duration: theme.transitions.duration.short,
                      }),
                      ...(highlightedIso === profile.iso && {
                        boxShadow: `inset 0 0 0 2px ${theme.vars.palette.primary.main}`,
                      }),
                    },
                    '& .heatmap-row-name': {
                      borderRadius: 1.5,
                      px: 1,
                      mx: -1,
                      ...(highlightedIso === profile.iso && {
                        bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
                      }),
                    },
                    '&:hover .heatmap-row-name': {
                      bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                    },
                  })}
                >
                  <Stack
                    ref={(node: HTMLDivElement | null) => {
                      rowRefs.current[profile.iso] = node;
                    }}
                    className="heatmap-row-cell heatmap-row-name"
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ pr: 2, py: 0.5 }}
                  >
                    <Typography variant="subtitle2" noWrap>
                      {country.name}
                    </Typography>
                    <Label color={scoreTone(avg)} variant="soft">
                      {statusText(avg)}
                    </Label>
                  </Stack>

                  {maturityDimensions.map((dim) => {
                    const score = profile.scores[dim.id];
                    return (
                      <Box key={dim.id} sx={{ display: 'contents' }}>
                        {renderCell(
                          score,
                          `${dim.name} ${fmtScore(score)} — Level ${levelOf(score)}, ${maturityLevels[levelOf(score) - 1].name}`
                        )}
                      </Box>
                    );
                  })}

                  <Box
                    className="heatmap-row-cell"
                    sx={(theme) => ({
                      py: 1,
                      borderRadius: 1.5,
                      textAlign: 'center',
                      typography: 'subtitle2',
                      color: theme.vars.palette[scoreTone(avg)].darker,
                      bgcolor: varAlpha(theme.vars.palette[scoreTone(avg)].mainChannel, 0.24),
                    })}
                  >
                    {fmtScore(avg)}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  );

  const renderGaps = () => (
    <Card>
      <CardHeader
        title="Gaps → training"
        subheader={`${gapRows.length} markets with gaps. Recommendations are generated from heatmap gaps and contract gates. Training content is an English demo placeholder.`}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.academy}
            size="small"
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 5 }}
          >
            Open all training plans
          </Button>
        }
      />

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={(theme) => ({
          mx: 3,
          mt: 3,
          px: 2,
          py: 1.5,
          borderRadius: 1.5,
          bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
        })}
      >
        <Iconify icon="solar:shield-check-bold" width={20} sx={{ color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
          <Box component="span" sx={{ typography: 'subtitle2', color: 'text.primary' }}>
            {gateBlockedContracts.length} from {contracts.length} contracts
          </Box>{' '}
          have a maturity gate not yet met in at least one covered country.
        </Typography>
        <Button
          component={RouterLink}
          href={paths.dashboard.vertraege}
          size="small"
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 5, flexShrink: 0 }}
        >
          View contracts
        </Button>
      </Stack>

      <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} sx={{ p: 3 }}>
        {visibleGapRows.map(({ profile, country, avg }) => {
          const weakest = maturityDimensions.reduce((min, dim) =>
            profile.scores[dim.id] < profile.scores[min.id] ? dim : min
          );

          return (
            <Stack
              key={profile.iso}
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ py: 2 }}
            >
              <Box sx={{ width: { md: 220 }, flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">{country.name}</Typography>
                  <Label color={scoreTone(avg)} variant="soft">
                    Ø {fmtScore(avg)}
                  </Label>
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  Weakest dimension: {weakest.name} ({fmtScore(profile.scores[weakest.id])})
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                  <Iconify
                    icon="solar:users-group-rounded-bold"
                    width={14}
                    sx={{ color: 'text.disabled', flexShrink: 0 }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    for {country.bodyShops.toLocaleString('en-GB')} Body shops ·{' '}
                    {country.dealers.toLocaleString('en-GB')} Locations
                  </Typography>
                </Stack>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: 'wrap', flexGrow: 1 }}
                alignItems="center"
              >
                {profile.gaps.map((trainingId) => {
                  const training = trainingById(trainingId);
                  if (!training) return null;

                  const inCountryLanguage = isInCountryLanguage(
                    country.language,
                    training.languages
                  );

                  const chip = (
                    <Chip
                      key={trainingId}
                      component={RouterLink}
                      href={paths.dashboard.academy}
                      clickable
                      size="small"
                      variant="outlined"
                      icon={
                        <Iconify
                          icon={formatIcon(training.format)}
                          width={15}
                          sx={inCountryLanguage ? { color: 'success.main' } : undefined}
                        />
                      }
                      label={training.title}
                    />
                  );

                  return inCountryLanguage ? (
                    <Tooltip key={trainingId} title={`available in ${country.language}`} arrow>
                      {chip}
                    </Tooltip>
                  ) : (
                    <Stack key={trainingId} direction="row" spacing={0.75} alignItems="center">
                      {chip}
                      <Label variant="soft" color="warning">
                        not yet available in the market language
                      </Label>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      {gapRows.length > GAP_PREVIEW_COUNT && (
        <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => setShowAllGaps((prev) => !prev)}
            sx={{ borderRadius: 5 }}
          >
            {showAllGaps
              ? `Show the ${GAP_PREVIEW_COUNT} lowest-scoring markets`
              : `All ${gapRows.length} markets with gaps`}
          </Button>
        </Box>
      )}
    </Card>
  );

  const renderFooter = () => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ width: 10, height: 10, bgcolor: 'primary.main', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Synthetic hackathon demo · Luxury car manufacturer (fictional) — Materials tender Body and paint
      </Typography>
    </Stack>
  );

  return (
    <DashboardContent maxWidth="xl" sx={{ gap: 4, display: 'flex', flexDirection: 'column' }}>
      {renderHero()}
      {renderKpis()}
      {renderModel()}
      {renderHeatmap()}
      {renderGaps()}
      {renderFooter()}
    </DashboardContent>
  );
}
