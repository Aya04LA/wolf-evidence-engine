'use client';

import type { ReactNode, ReactElement } from 'react';
import type { Supplier } from 'src/data/platform';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  totals,
  fmtEUR,
  company,
  clusters,
  contracts,
  suppliers,
  trainings,
  countries,
  supplierById,
} from 'src/data/platform';

// ----------------------------------------------------------------------




export const DEMO_ORANGE = '#FF7900';
export const DEMO_GREY = '#FFFFFF';
const DEMO_BG = '#0E1E1D';
const DEMO_SURFACE = '#122422';
const GREY_SOFT = '#B9C4C0';
const LINE_SOFT = 'rgba(237, 222, 208, 0.16)';
const GREEN = '#8CFFA7';
const AMBER = '#F5B463';
const RED = '#FF8A72';

export const FOOTER_TEXT =
  'Synthetic hackathon demo · Luxury car manufacturer (fictional) — Materials tender Body and paint';

type SlideProps = { pageNo: number };

const fmtInt = (v: number) => v.toLocaleString('en-GB');
const fmtPct1 = (v: number) => v.toLocaleString('en-GB', { maximumFractionDigits: 1 });

// ----------------------------------------------------------------------


const TOTAL_MARKETS = countries.length;
const TOTAL_BODYSHOPS = countries.reduce((s, c) => s + c.bodyShops, 0);
const COMBINED_SAVING_EUR = totals.priceSavingEUR + totals.logisticsSavingEUR;
const SAVING_SHARE_PCT = (COMBINED_SAVING_EUR / totals.spendEUR) * 100;

const TOP5 = [...suppliers].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
const SHORTLIST = suppliers
  .filter((s) => s.status === 'shortlist')
  .sort((a, b) => b.matchScore - a.matchScore);
const SHORTLIST_NAMES = SHORTLIST.map((s) => s.name.replace(/\s*\(.*\)$/, '')).join(' + ');

const TRAINING_COMMITMENTS = contracts.reduce((s, c) => s + c.trainingCommitments.length, 0);
const CONTRACT_VOLUME_EUR = contracts.reduce((s, c) => s + c.volumeEUR, 0);
const TRAINING_COMPLETIONS = trainings.reduce((s, t) => s + t.completions, 0);

const logoSlug = (id: string) => id.replace('sup-', '');


function scenarioMetrics(supplierIds: string[]) {
  const sel = supplierIds
    .map((id) => suppliers.find((s) => s.id === id))
    .filter((s): s is Supplier => !!s);

  const clusterIds = new Set(sel.flatMap((s) => s.clusters));
  const marketIsos = new Set(sel.flatMap((s) => s.countries));

  
  const priceSavingEUR = clusters
    .filter((c) => clusterIds.has(c.id))
    .reduce((sum, c) => {
      const bestDeltaPct = Math.max(
        ...sel.filter((s) => s.clusters.includes(c.id)).map((s) => Math.abs(s.priceDeltaPct))
      );
      return sum + (c.spendEUR * bestDeltaPct) / 100;
    }, 0);

  const logisticsSavingEUR = sel.reduce((s, x) => s + x.logisticsSavingEUR, 0);

  return {
    suppliers: sel,
    clusterCount: clusterIds.size,
    marketCount: marketIsos.size,
    savingEUR: priceSavingEUR + logisticsSavingEUR,
  };
}

function scenarioRisk(sel: Supplier[], clusterCount: number, marketCount: number) {
  if (sel.length === 1) {
    return {
      label: 'High',
      color: RED,
      reason: `Single Source — ${clusters.length - clusterCount} from ${clusters.length} Categories without Coverage`,
    };
  }
  if (sel.some((s) => s.type === 'Distributor')) {
    return {
      label: 'Medium',
      color: AMBER,
      reason: `Two-stage supply routes remain, ${TOTAL_MARKETS - marketCount} uncovered markets`,
    };
  }
  return {
    label: 'Low',
    color: GREEN,
    reason: `${sel.length} Manufacturers with direct supply, match scores ${sel.map((s) => `${s.matchScore} %`).join(' / ')}`,
  };
}

const SCENARIOS = [
  {
    key: 'A',
    title: 'Consolidated',
    subtitle: 'One supplier wherever feasible',
    ids: [TOP5[0].id],
    recommended: false,
  },
  {
    key: 'B',
    title: `Recommended (${SHORTLIST_NAMES})`,
    subtitle: 'Platform shortlist: awards by category',
    ids: SHORTLIST.map((s) => s.id),
    recommended: true,
  },
  {
    key: 'C',
    title: 'Regional',
    subtitle: 'Distributor and regional manufacturers per region',
    ids: ['sup-orbit', 'sup-solis'],
    recommended: false,
  },
].map((sc) => {
  const m = scenarioMetrics(sc.ids);
  return { ...sc, ...m, risk: scenarioRisk(m.suppliers, m.clusterCount, m.marketCount) };
});

// ----------------------------------------------------------------------
// Folien-Bausteine

function SlideFooter({ pageNo, light }: { pageNo: number; light?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ position: 'absolute', left: { xs: 24, md: 56 }, bottom: { xs: 20, md: 32 } }}
    >
      <Box
        sx={{
          width: 26,
          height: 26,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: DEMO_ORANGE,
          color: DEMO_BG,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {pageNo}
      </Box>
      <Typography
        variant="caption"
        sx={{ color: light ? 'rgba(255,255,255,0.75)' : GREY_SOFT, pr: { xs: 16, md: 40 } }}
      >
        {FOOTER_TEXT}
      </Typography>
    </Stack>
  );
}

function SlideFrame({
  pageNo,
  kicker,
  title,
  children,
}: {
  pageNo: number;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        height: 1,
        bgcolor: DEMO_BG,
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 3, md: 7 },
        pt: { xs: 4, md: 6 },
        pb: { xs: 9, md: 11 },
      }}
    >

      <Box
        sx={{
          width: 1,
          maxWidth: 1240,
          mx: 'auto',
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="overline" sx={{ color: GREY_SOFT, letterSpacing: 1.2 }}>
          {kicker}
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            pr: { xs: 8, md: 20 },
            color: DEMO_ORANGE,
            fontWeight: 800,
            lineHeight: 1.12,
            textTransform: 'uppercase',
            fontSize: { xs: 24, md: 36 },
          }}
        >
          {title}
        </Typography>
        <Box sx={{ mt: 2, height: 3, width: 1, bgcolor: DEMO_ORANGE }} />

        <Box sx={{ flexGrow: 1, minHeight: 0, mt: { xs: 3, md: 5 }, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>

      <SlideFooter pageNo={pageNo} />
    </Box>
  );
}

function StatTile({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Box sx={{ borderTop: `3px solid ${highlight ? DEMO_ORANGE : LINE_SOFT}`, pt: 2 }}>
      <Typography variant="overline" sx={{ color: GREY_SOFT }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontWeight: 800,
          lineHeight: 1.1,
          fontSize: { xs: 34, md: 48 },
          color: highlight ? DEMO_ORANGE : DEMO_GREY,
        }}
      >
        {value}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.75, color: GREY_SOFT }}>
        {hint}
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Folie 1 — Cover

function SlideCover({ pageNo }: SlideProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        height: 1,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 3, md: 10 },
        backgroundImage:
          'linear-gradient(180deg, rgba(18,18,20.0.55) 0%, rgba(18,18,20.0.78) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      <Box sx={{ maxWidth: 980 }}>
        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 2 }}>
          Luxury car manufacturer (fictional) · 09/2026 · Synthetic demo
        </Typography>
        <Typography
          sx={{
            mt: 1.5,
            color: '#FFF',
            fontWeight: 800,
            lineHeight: 1.1,
            textTransform: 'uppercase',
            fontSize: { xs: 32, md: 56 },
          }}
        >
          Materials tender Body and paint
        </Typography>
        <Typography
          sx={{
            mt: 1,
            color: DEMO_ORANGE,
            fontWeight: 800,
            textTransform: 'uppercase',
            fontSize: { xs: 22, md: 34 },
          }}
        >
          Decision brief
        </Typography>
        <Box sx={{ mt: 3, height: 3, width: 180, bgcolor: DEMO_ORANGE }} />
        <Typography sx={{ mt: 3, color: 'rgba(255,255,255,0.85)', fontSize: { xs: 16, md: 20 } }}>
          {company.claim}
        </Typography>
      </Box>

      <SlideFooter pageNo={pageNo} light />
    </Box>
  );
}

// ----------------------------------------------------------------------
// Folie 2 — Bedarf

function SlideBedarf({ pageNo }: SlideProps) {
  return (
    <SlideFrame pageNo={pageNo} kicker="Starting point" title="Demand collected from all markets">
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatTile
          label="Markets"
          value={fmtInt(TOTAL_MARKETS)}
          hint="retail markets worldwide in scope"
        />
        <StatTile
          label="Locations"
          value={fmtInt(company.standorte)}
          hint={`davon ${fmtInt(TOTAL_BODYSHOPS)} with body and paint operations`}
        />
        <StatTile
          label="Demand submissions"
          value={fmtInt(totals.submissions)}
          hint={`from ${fmtInt(totals.submissionTarget)} workshops: AI-structured through voice, photos and delivery notes`}
        />
        <StatTile
          label="Volume"
          value={fmtEUR(totals.spendEUR)}
          hint="Materials volume Body and paint Jan–Aug 2026"
          highlight
        />
      </Box>

      <Box
        sx={{
          mt: { xs: 4, md: 7 },
          display: 'grid',
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatTile
          label="Categories"
          value={fmtInt(clusters.length)}
          hint="in the paint workshop standard list"
        />
        <StatTile
          label="Line items"
          value={fmtInt(totals.positions)}
          hint="standardisiert ausgeschrieben"
        />
        <StatTile
          label="Items"
          value={fmtInt(totals.sortimentArtikel)}
          hint="in the required standard catalogue"
        />
      </Box>

      <Typography variant="body1" sx={{ mt: { xs: 4, md: 6 }, maxWidth: 860, color: DEMO_GREY }}>
        One demand view, one standard list and one process replace fragmented purchasing through
        local wholesalers and multi-stage import routes.
      </Typography>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------
// Folie 3 — Angebotslage

const TABLE_COLS = {
  xs: 'minmax(140px, 1.8fr) 1fr 1.6fr 1fr 1.2fr',
  md: 'minmax(200px, 1.8fr) 1fr 1.6fr 1fr 1.2fr',
};

function SlideAngebote({ pageNo }: SlideProps) {
  return (
    <SlideFrame
      pageNo={pageNo}
      kicker={`${fmtInt(suppliers.length)} Bidders · ${fmtInt(totals.offers)} Offers against the standard list`}
      title="Offers: the top five matches"
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 720 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: TABLE_COLS,
              gap: 2,
              pb: 1.5,
              borderBottom: `2px solid ${DEMO_GREY}`,
            }}
          >
            {['Supplier', 'Coverage', 'Match-Score', 'Price delta', 'Supply-route savings'].map(
              (h) => (
                <Typography key={h} variant="overline" sx={{ color: GREY_SOFT }}>
                  {h}
                </Typography>
              )
            )}
          </Box>

          {TOP5.map((s) => (
            <Box
              key={s.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: TABLE_COLS,
                gap: 2,
                alignItems: 'center',
                py: { xs: 1.5, md: 2.25 },
                borderBottom: `1px solid ${LINE_SOFT}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  component="img"
                  src={`/logos/${logoSlug(s.id)}.svg`}
                  alt={s.name}
                  sx={{ height: 20, width: 'auto', flexShrink: 0 }}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: DEMO_GREY }}>
                    {s.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: GREY_SOFT }}>
                    {s.type} · {fmtInt(s.offers)} Offers
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="body2" sx={{ color: DEMO_GREY }}>
                {s.clusters.length}/{clusters.length} WG · {s.countries.length}/{TOTAL_MARKETS}{' '}
                Markets
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ flexGrow: 1, height: 6, bgcolor: LINE_SOFT, borderRadius: 1 }}>
                  <Box
                    sx={{
                      width: `${s.matchScore}%`,
                      height: 1,
                      borderRadius: 1,
                      bgcolor: s.matchScore >= 85 ? DEMO_ORANGE : GREY_SOFT,
                    }}
                  />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    width: 52,
                    textAlign: 'right',
                    fontWeight: 700,
                    color: s.matchScore >= 85 ? DEMO_ORANGE : DEMO_GREY,
                  }}
                >
                  {s.matchScore} %
                </Typography>
              </Stack>

              <Typography variant="subtitle2" sx={{ color: GREEN }}>
                −{fmtPct1(Math.abs(s.priceDeltaPct))} %
              </Typography>

              <Typography variant="subtitle2" sx={{ color: GREEN }}>
                {fmtEUR(s.logisticsSavingEUR)} Jan–Aug 2026
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, color: GREY_SOFT }}>
        Match score compares the catalogue, country coverage and supply routes with identified
        demand to establish whether the offer matches. {SHORTLIST.length} bidders are on the
        Shortlist.
      </Typography>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------
// Folie 4 — Szenarienvergleich

function SlideSzenarien({ pageNo }: SlideProps) {
  return (
    <SlideFrame pageNo={pageNo} kicker="Decision options" title="Three scenarios compared">
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2.5, md: 4 },
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        {SCENARIOS.map((sc) => (
          <Box
            key={sc.key}
            sx={{
              position: 'relative',
              p: { xs: 2.5, md: 3 },
              display: 'flex',
              flexDirection: 'column',
              border: sc.recommended ? `2px solid ${DEMO_ORANGE}` : `1px solid ${LINE_SOFT}`,
            }}
          >
            {sc.recommended && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -13,
                  left: 20,
                  px: 1.25,
                  py: 0.25,
                  bgcolor: DEMO_ORANGE,
                  color: DEMO_BG,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                Platform recommendation
              </Box>
            )}

            <Typography variant="overline" sx={{ color: GREY_SOFT }}>
              Szenario {sc.key}
            </Typography>
            <Typography variant="h6" sx={{ color: DEMO_GREY, lineHeight: 1.25 }}>
              {sc.title}
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, color: GREY_SOFT }}>
              {sc.subtitle}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, minHeight: 28 }}>
              {sc.suppliers.map((s) => (
                <Box
                  key={s.id}
                  component="img"
                  src={`/logos/${logoSlug(s.id)}.svg`}
                  alt={s.name}
                  sx={{ height: 18, width: 'auto' }}
                />
              ))}
            </Stack>

            <Typography
              sx={{
                mt: 2.5,
                fontWeight: 800,
                lineHeight: 1.1,
                fontSize: { xs: 30, md: 36 },
                color: sc.recommended ? DEMO_ORANGE : DEMO_GREY,
              }}
            >
              {fmtEUR(sc.savingEUR)}
            </Typography>
            <Typography variant="caption" sx={{ color: GREY_SOFT }}>
              Savings Jan–Aug 2026 (price + supply routes)
            </Typography>

            <Stack spacing={1} sx={{ mt: 2.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: GREY_SOFT }}>
                  Categories
                </Typography>
                <Typography variant="subtitle2" sx={{ color: DEMO_GREY }}>
                  {sc.clusterCount}/{clusters.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: GREY_SOFT }}>
                  Markets
                </Typography>
                <Typography variant="subtitle2" sx={{ color: DEMO_GREY }}>
                  {sc.marketCount}/{TOTAL_MARKETS}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: GREY_SOFT }}>
                  Risk
                </Typography>
                <Typography variant="subtitle2" sx={{ color: sc.risk.color }}>
                  {sc.risk.label}
                </Typography>
              </Stack>
            </Stack>

            <Typography variant="caption" sx={{ mt: 1.5, color: GREY_SOFT }}>
              {sc.risk.reason}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="body2" sx={{ mt: { xs: 3, md: 4 }, maxWidth: 900, color: DEMO_GREY }}>
        Scenario B combines the fictional shortlisted offers. Coverage and savings are
        calculated from synthetic offers; remaining gaps are open for discussion.
      </Typography>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------
// Folie 5 — Wirkung

function SlideWirkung({ pageNo }: SlideProps) {
  return (
    <SlideFrame pageNo={pageNo} kicker="Business Case" title="Impact: Jan–Aug 2026">
      <Box
        sx={{
          height: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: GREY_SOFT }}>
              Price savings
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                color: DEMO_ORANGE,
                fontSize: { xs: 48, md: 84 },
              }}
            >
              {fmtEUR(totals.priceSavingEUR)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: GREY_SOFT }}>
              versus current purchasing, Jan–Aug 2026
            </Typography>
          </Box>

          <Typography
            sx={{
              color: GREY_SOFT,
              fontWeight: 300,
              fontSize: { xs: 40, md: 64 },
              textAlign: 'center',
            }}
          >
            +
          </Typography>

          <Box>
            <Typography variant="overline" sx={{ color: GREY_SOFT }}>
              Supply-route savings
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                color: DEMO_ORANGE,
                fontSize: { xs: 48, md: 84 },
              }}
            >
              {fmtEUR(totals.logisticsSavingEUR)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: GREY_SOFT }}>
              through consolidated supply routes instead of multi-stage imports
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 5, md: 8 }, pt: 4, borderTop: `3px solid ${DEMO_ORANGE}` }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 1, md: 3 }}
            alignItems={{ xs: 'flex-start', md: 'baseline' }}
          >
            <Typography
              sx={{ fontWeight: 800, color: DEMO_GREY, fontSize: { xs: 32, md: 44 }, lineHeight: 1 }}
            >
              = {fmtEUR(COMBINED_SAVING_EUR)} Jan–Aug 2026
            </Typography>
            <Typography variant="body1" sx={{ color: GREY_SOFT }}>
              {fmtPct1(SAVING_SHARE_PCT)} % of tender volume of {fmtEUR(totals.spendEUR)}
              in the observation period, across {fmtInt(TOTAL_MARKETS)} Markets.
            </Typography>
          </Stack>
        </Box>
      </Box>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------
// Folie 6 — Vergabe & Trainings

const STAGE_COLOR: Record<string, string> = {
  Build: GREY_SOFT,
  Negotiate: AMBER,
  Agree: GREEN,
};

function SlideVergabe({ pageNo }: SlideProps) {
  return (
    <SlideFrame
      pageNo={pageNo}
      kicker="Implementation"
      title="Awards and training: contracts and capability together"
    >
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatTile
          label="Contracts in progress"
          value={fmtInt(contracts.length)}
          hint="Framework, supply and pilot agreements"
        />
        <StatTile
          label="Award volume"
          value={fmtEUR(CONTRACT_VOLUME_EUR)}
          hint="in ongoing contract negotiations, Jan–Aug 2026"
          highlight
        />
        <StatTile
          label="Training commitments"
          value={fmtInt(TRAINING_COMMITMENTS)}
          hint="contractually agreed training packages"
        />
        <StatTile
          label="Completed training"
          value={fmtInt(TRAINING_COMPLETIONS)}
          hint={`across ${fmtInt(trainings.length)} Academy-Module`}
        />
      </Box>

      <Box sx={{ mt: { xs: 4, md: 6 } }}>
        {contracts.map((c) => (
          <Box
            key={c.id}
            sx={{
              display: 'grid',
              gap: 2,
              alignItems: 'center',
              gridTemplateColumns: {
                xs: '1fr auto',
                md: 'minmax(240px, 2fr) 1fr 1fr 1fr auto',
              },
              py: 1.75,
              borderBottom: `1px solid ${LINE_SOFT}`,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ color: DEMO_GREY }}>
                {c.title}
              </Typography>
              <Typography variant="caption" sx={{ color: GREY_SOFT }}>
                {supplierById(c.supplierId)?.name} · {c.termYears}{' '}
                {c.termYears === 1 ? 'Year' : 'years'}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: DEMO_GREY, display: { xs: 'none', md: 'block' } }}
            >
              {c.countries.length} Markets
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: DEMO_GREY, display: { xs: 'none', md: 'block' } }}
            >
              {fmtEUR(c.volumeEUR)} Jan–Aug 2026
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: GREEN, display: { xs: 'none', md: 'block' } }}
            >
              −{fmtPct1(c.negotiatedSavingPct)} % verhandelt
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ color: STAGE_COLOR[c.stage], textAlign: 'right' }}
            >
              {c.stage}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="body2" sx={{ mt: 3, maxWidth: 900, color: GREY_SOFT }}>
        Each award creates academy training requirements. Market rollout requires the
        maturity gate to be met.
      </Typography>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------


type Persona = { name: string; role?: string; initials: string };

const PERSONAS: Persona[] = [
  { name: 'Demo procurement role', role: 'Central procurement', initials: 'EK' },
  { name: 'Demo management role', role: 'Luxury car manufacturer (fictional)', initials: 'LT' },
];

function PersonaChips({ personas }: { personas: Persona[] }) {
  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
      {personas.map((p) => (
        <Stack
          key={p.name}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 5,
            border: `1px solid ${LINE_SOFT}`,
            bgcolor: DEMO_SURFACE,
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: DEMO_ORANGE,
              color: DEMO_BG,
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {p.initials}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2, color: DEMO_GREY }}>
              {p.name}
            </Typography>
            {p.role && (
              <Typography sx={{ fontSize: 10.5, lineHeight: 1.2, color: GREY_SOFT }}>
                {p.role}
              </Typography>
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

// ----------------------------------------------------------------------


const TIMELINE = [
  {
    month: 'Sep 2026',
    title: 'Start',
    text: 'Tender kick-off: issue the standard list to every market',
  },
  {
    month: 'Oct 2026',
    title: 'Intake',
    text: `Demand submissions from ${fmtInt(TOTAL_MARKETS)} markets through voice, photos and delivery notes`,
  },
  {
    month: 'Nov 2026',
    title: 'Matching and negotiation',
    text: `${fmtInt(suppliers.length)} Bidders, ${fmtInt(totals.offers)} offers assessed against demand`,
  },
  {
    month: 'Dec 2026',
    title: 'Decision and outcome',
    text: `Award to ${SHORTLIST_NAMES} — ${fmtEUR(COMBINED_SAVING_EUR)} Jan–Aug 2026 impact`,
  },
];

function SlideNaechsteSchritte({ pageNo }: SlideProps) {
  return (
    <SlideFrame pageNo={pageNo} kicker="Roadmap" title="Next steps: September to December 2026">
      <Box sx={{ mt: { xs: 1, md: 4 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          }}
        >
          {TIMELINE.map((step, i) => (
            <Box key={step.month} sx={{ position: 'relative' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: i === TIMELINE.length - 1 ? DEMO_ORANGE : DEMO_BG,
                    border: `3px solid ${DEMO_ORANGE}`,
                  }}
                />
                <Box
                  sx={{
                    flexGrow: 1,
                    height: 3,
                    bgcolor: LINE_SOFT,
                    display: { xs: 'none', md: i === TIMELINE.length - 1 ? 'none' : 'block' },
                  }}
                />
              </Stack>
              <Typography
                variant="overline"
                sx={{ mt: 2, display: 'block', color: DEMO_ORANGE, letterSpacing: 1 }}
              >
                {step.month}
              </Typography>
              <Typography variant="h6" sx={{ color: DEMO_GREY, lineHeight: 1.3 }}>
                {step.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: GREY_SOFT, pr: { md: 2 } }}>
                {step.text}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: { xs: 4, md: 8 },
            p: { xs: 2.5, md: 3.5 },
            borderLeft: `4px solid ${DEMO_ORANGE}`,
            bgcolor: 'rgba(242, 145, 0, 0.06)',
          }}
        >
          <Typography variant="overline" sx={{ color: DEMO_ORANGE }}>
            Decision required today
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.5, maxWidth: 920, color: DEMO_GREY }}>
            Approve scenario B and award to {SHORTLIST_NAMES} with{' '}
            {fmtEUR(COMBINED_SAVING_EUR)} Jan–Aug 2026 impact and start of contract signing in
            December 2026.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: GREY_SOFT }}>
            {company.claim}
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <Typography variant="caption" sx={{ color: GREY_SOFT }}>
              Decision owners:
            </Typography>
            <PersonaChips personas={PERSONAS} />
          </Stack>
        </Box>
      </Box>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------


const ROAD_OWNERS = {
  category: { label: 'Central procurement', color: DEMO_ORANGE },
  teamCore: { label: 'Core project team', color: '#2A78D6' },
  teamExt: { label: 'Extended project team', color: GREEN },
  steercoCore: { label: 'Core steering committee', color: RED },
  steercoExt: { label: 'Extended steering committee', color: '#8D5A00' },
} as const;

type RoadOwner = keyof typeof ROAD_OWNERS;

type RoadMilestone = {
  date: string; // Anzeige
  time: number; 
  title: string;
  detail: string;
  owner: RoadOwner;
  
  people?: Persona[];
  
  route?: string;
  routeLabel?: string;
};

const ROAD_MILESTONES: RoadMilestone[] = [
  {
    date: '06/2026',
    time: Date.UTC(2026, 5, 12),
    title: 'Project mandate',
    detail: 'Body and paint materials tender: mandate and scope',
    owner: 'steercoCore',
    route: paths.dashboard.root,
    routeLabel: 'Overview',
  },
  {
    date: '07/2026',
    time: Date.UTC(2026, 6, 9),
    title: 'Supplier RFI',
    detail: `Fictional RFI sent to ${suppliers.length} suppliers with sample routes for each market`,
    owner: 'category',
    route: paths.dashboard.nullmessung,
    routeLabel: 'Baseline (RFI-Matching)',
  },
  {
    date: '09/2026',
    time: Date.UTC(2026, 8, 18),
    title: 'Baseline',
    detail: `Synthetic data from ${TOTAL_MARKETS} markets with ${fmtEUR(totals.spendEUR)} Purchasing volume`,
    owner: 'teamCore',
    route: paths.dashboard.nullmessung,
    routeLabel: 'Baseline',
  },
  {
    date: '24.09.2026',
    time: Date.UTC(2026, 8, 24),
    title: 'Demo steering committee',
    detail: 'Agree the target state and milestones with divisional management (planned)',
    owner: 'steercoExt',
    people: PERSONAS,
    route: paths.dashboard.tiefenanalyse,
    routeLabel: 'Deep analysis',
  },
  {
    date: '09/2026',
    time: Date.UTC(2026, 8, 29),
    title: 'Demand intake',
    detail: `Module 1: demand from ${fmtInt(TOTAL_BODYSHOPS)} workshops across ${fmtInt(TOTAL_MARKETS)} markets`,
    owner: 'teamExt',
    route: paths.dashboard.erhebung,
    routeLabel: 'Demand intake',
  },
  {
    date: '10/2026',
    time: Date.UTC(2026, 9, 8),
    title: 'Offer analysis',
    detail: `Matching: ${fmtInt(suppliers.length)} Bidders, ${fmtInt(totals.offers)} offers against demand`,
    owner: 'teamCore',
    route: paths.dashboard.ausschreibung,
    routeLabel: 'Tender',
  },
  {
    date: '10/2026',
    time: Date.UTC(2026, 9, 23),
    title: 'Supplier pitches',
    detail: 'Fictional supplier pitches: concepts and offers',
    owner: 'steercoExt',
    route: paths.dashboard.ausschreibung,
    routeLabel: 'Tender',
  },
  {
    date: '11/2026',
    time: Date.UTC(2026, 10, 12),
    title: 'Negotiations',
    detail: 'Parallel central and local negotiations',
    owner: 'category',
    route: paths.dashboard.tiefenanalyse,
    routeLabel: 'Deep analysis (Price opportunity)',
  },
  {
    date: '11/2026',
    time: Date.UTC(2026, 10, 27),
    title: 'Steering committee before award',
    detail: 'Approve award scenario and negotiation outcome',
    owner: 'steercoCore',
  },
  {
    date: '12/2026',
    time: Date.UTC(2026, 11, 18),
    title: 'Award & Contract',
    detail: `Award to ${SHORTLIST_NAMES}, contract signing`,
    owner: 'steercoCore',
    route: paths.dashboard.vertraege,
    routeLabel: 'Contracts',
  },
  {
    date: '02–04/2027',
    time: Date.UTC(2027, 2, 12),
    title: 'Roll-out',
    detail: 'Roll out contracts, catalogues and training in every market',
    owner: 'teamExt',
    route: paths.dashboard.academy,
    routeLabel: 'Academy (Training)',
  },
];

const ROAD_GOAL = {
  date: 'Q2/2027',
  time: Date.UTC(2027, 3, 30),
  title: 'Platform in regular operation',
  route: paths.dashboard.reifegrad,
  routeLabel: 'Maturity',
};



const ROAD_PATH =
  'M -20 90 H 1020 C 1120 90 1120 270 1020 270 H 180 C 80 270 80 450 180 450 H 1220';
const ROAD_VIEW = { w: 1200, h: 540 };



const TOOLTIP_PROPS = { popper: { sx: { zIndex: 2100 } } };

function SlideRoadmap({ pageNo }: SlideProps) {
  const router = useRouter();
  const pathRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [goalPoint, setGoalPoint] = useState<{ x: number; y: number } | null>(null);
  const [todayPoint, setTodayPoint] = useState<{ x: number; y: number } | null>(null);
  const [tToday, setTToday] = useState<number | null>(null);

  
  
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const L = path.getTotalLength();
    const N = ROAD_MILESTONES.length;
    const tOf = (i: number) => 0.045 + (0.87 * i) / (N - 1);
    const at = (t: number) => {
      const p = path.getPointAtLength(L * t);
      return { x: p.x, y: p.y };
    };
    setPoints(ROAD_MILESTONES.map((_, i) => at(tOf(i))));
    setGoalPoint(at(0.955));

    
    const times = [...ROAD_MILESTONES.map((m) => m.time), ROAD_GOAL.time];
    const ts = [...ROAD_MILESTONES.map((_, i) => tOf(i)), 0.955];
    let t = 0.045;
    if (now >= times[times.length - 1]) {
      t = ts[ts.length - 1];
    } else {
      for (let i = 0; i < times.length - 1; i += 1) {
        if (now >= times[i] && now < times[i + 1]) {
          const f = (now - times[i]) / (times[i + 1] - times[i]);
          t = ts[i] + f * (ts[i + 1] - ts[i]);
          break;
        }
      }
    }
    setTodayPoint(at(t));
    setTToday(t);
  }, [now]);

  
  
  useEffect(() => {
    const path = pathRef.current;
    const car = carRef.current;
    const wrap = wrapRef.current;
    if (tToday == null || !path || !car || !wrap) return undefined;
    const L = path.getTotalLength();
    const at = (t: number) => {
      const p = path.getPointAtLength(L * t);
      return { x: p.x, y: p.y };
    };
    
    
    const place = (t: number) => {
      const tc = Math.min(Math.max(t, 0.004), 0.992);
      const p = at(tc);
      const q = at(tc + 0.004);
      const r = wrap.getBoundingClientRect();
      const dx = (q.x - p.x) * (r.width / ROAD_VIEW.w);
      const dy = (q.y - p.y) * (r.height / ROAD_VIEW.h);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      car.style.left = `${(p.x / ROAD_VIEW.w) * 100}%`;
      car.style.top = `${(p.y / ROAD_VIEW.h) * 100}%`;
      car.style.transform = `translate(-50%, -50%) rotate(${ang}deg)`;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      place(tToday);
      return undefined;
    }
    const DRIVE_MS = 2800;
    const t0 = performance.now();
    let raf = 0;
    const tick = (frameNow: number) => {
      const f = Math.min((frameNow - t0) / DRIVE_MS, 1);
      const ease = f < 0.5 ? 2 * f * f : 1 - (2 - 2 * f) ** 2 / 2;
      place(0.004 + ease * (tToday - 0.004));
      if (f < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tToday]);

  const pct = (p: { x: number; y: number }) => ({
    left: `${(p.x / ROAD_VIEW.w) * 100}%`,
    top: `${(p.y / ROAD_VIEW.h) * 100}%`,
  });

  return (
    <SlideFrame
      pageNo={pageNo}
      kicker="Synthetic roadmap with current-date marker"
      title="Roadmap — Synthetic target Q2/2027"
    >
      <Box ref={wrapRef} sx={{ position: 'relative', height: 1, minHeight: 420 }}>
        
        <Box
          component="svg"
          viewBox={`0 0 ${ROAD_VIEW.w} ${ROAD_VIEW.h}`}
          preserveAspectRatio="none"
          sx={{ position: 'absolute', inset: 0, width: 1, height: 1 }}
        >
          <path d={ROAD_PATH} fill="none" stroke="#DEDEE0" strokeWidth={30} />
          <path
            ref={pathRef}
            d={ROAD_PATH}
            fill="none"
            stroke="#FFF"
            strokeWidth={2.5}
            strokeDasharray="14 12"
          />
        </Box>

        
        {points.length === ROAD_MILESTONES.length &&
          ROAD_MILESTONES.map((m, i) => {
            const done = m.time < now;
            const color = ROAD_OWNERS[m.owner].color;
            const above = points[i].y < ROAD_VIEW.h / 2 ? i % 2 === 0 : i % 2 === 1;
            return (
              <Tooltip
                key={m.title}
                arrow
                placement={above ? 'bottom' : 'top'}
                slotProps={TOOLTIP_PROPS}
                title={`${m.date} — ${m.detail}${
                  m.people
                    ? ` · With: ${m.people
                        .map((p) => (p.role ? `${p.name} (${p.role})` : p.name))
                        .join(', ')}`
                    : ''
                }${done ? ' (erledigt)' : ''}${
                  m.route ? ` · Click: ${m.routeLabel} open` : ''
                }`}
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    if (m.route) router.push(m.route);
                  }}
                  sx={{
                    position: 'absolute',
                    ...pct(points[i]),
                    transform: 'translate(-50%, -50%)',
                    cursor: m.route ? 'pointer' : 'default',
                    zIndex: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      bgcolor: done ? color : DEMO_BG,
                      color: done ? DEMO_BG : color,
                      border: `3px solid ${color}`,
                      boxShadow: '0 1px 4px rgba(0.0.0.0.18)',
                      transition: 'transform 120ms ease',
                      '&:hover': { transform: 'scale(1.15)' },
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      ...(above ? { bottom: 40 } : { top: 40 }),
                      width: 148,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{ display: 'block', lineHeight: 1.4, color, letterSpacing: 0.6 }}
                    >
                      {m.date}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, color: DEMO_GREY }}
                    >
                      {m.title}
                    </Typography>
                    {m.people && (
                      <Typography
                        sx={{ fontSize: 10.5, lineHeight: 1.3, color: GREY_SOFT, mt: 0.25 }}
                      >
                        {m.people.map((p) => p.name).join(' · ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            );
          })}

        
        {todayPoint && (
          <>
            <Tooltip
              arrow
              placement="top"
              slotProps={TOOLTIP_PROPS}
              title={`Today, ${new Date(now).toLocaleDateString('en-GB')} · synthetic project roadmap`}
            >
              <Box
                ref={carRef}
                aria-label="Current date on the synthetic project roadmap"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  left: '-20%',
                  top: '-20%',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: DEMO_ORANGE,
                  border: '3px solid white',
                  zIndex: 4,
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 5px 8px rgba(0.0.0.0.35))',
                  cursor: 'default',
                }}
              />
            </Tooltip>
            <Typography
              sx={{
                position: 'absolute',
                ...pct(todayPoint),
                transform: 'translate(-50%, 30px)',
                fontSize: 11,
                fontWeight: 800,
                color: DEMO_ORANGE,
                whiteSpace: 'nowrap',
                letterSpacing: 0.5,
                zIndex: 3,
              }}
            >
              TODAY
            </Typography>
          </>
        )}

        
        {goalPoint && (
          <Tooltip
            arrow
            placement="top"
            slotProps={TOOLTIP_PROPS}
            title={`${ROAD_GOAL.date} — ${ROAD_GOAL.title} · Click: ${ROAD_GOAL.routeLabel} open`}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                router.push(ROAD_GOAL.route);
              }}
              sx={{
                position: 'absolute',
                ...pct(goalPoint),
                transform: 'translate(-50%, -100%)',
                zIndex: 2,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <Box component="svg" viewBox="0 0 24 30" sx={{ width: 30, height: 38 }}>
                <rect x="2" y="0" width="2.5" height="30" fill={DEMO_GREY} />
                <g>
                  {[0, 1, 2, 3].map((cx) =>
                    [0, 1, 2].map((cy) => (
                      <rect
                        key={`${cx}-${cy}`}
                        x={4.5 + cx * 4.5}
                        y={cy * 4}
                        width={4.5}
                        height={4}
                        fill={(cx + cy) % 2 === 0 ? DEMO_GREY : DEMO_BG}
                        stroke={DEMO_GREY}
                        strokeWidth={0.4}
                      />
                    ))
                  )}
                </g>
              </Box>
              <Typography
                variant="overline"
                sx={{ display: 'block', lineHeight: 1.4, color: DEMO_ORANGE }}
              >
                {ROAD_GOAL.date}
              </Typography>
              <Typography
                sx={{ fontSize: 12.5, fontWeight: 700, width: 150, color: DEMO_GREY }}
              >
                {ROAD_GOAL.title}
              </Typography>
            </Box>
          </Tooltip>
        )}

        
        <Stack
          spacing={0.75}
          sx={{ position: 'absolute', left: 0, bottom: 0, zIndex: 2 }}
        >
          {Object.entries(ROAD_OWNERS).map(([k, o]) => (
            <Stack key={k} direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: o.color }} />
              <Typography variant="caption" sx={{ color: DEMO_GREY }}>
                {o.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </SlideFrame>
  );
}

// ----------------------------------------------------------------------

export const SLIDES: { key: string; component: (props: SlideProps) => ReactElement }[] = [
  { key: 'cover', component: SlideCover },
  { key: 'bedarf', component: SlideBedarf },
  { key: 'angebote', component: SlideAngebote },
  { key: 'szenarien', component: SlideSzenarien },
  { key: 'wirkung', component: SlideWirkung },
  { key: 'vergabe', component: SlideVergabe },
  { key: 'schritte', component: SlideNaechsteSchritte },
  { key: 'roadmap', component: SlideRoadmap },
];
