'use client';

import type { Contract, ContractStage } from 'src/data/platform';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  pilotRatings,
  pilotRatingAvg,
  trainingPackageFor,
  pilotRatingsContractId,
} from 'src/data/vertraege-extras';
import {
  fmtEUR,
  totals,
  contracts,
  countries,
  clusterById,
  trainingById,
  supplierById,
  maturityByIso,
  contractStages,
  maturityDimensions,
} from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const fmtPct = (v: number) =>
  v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const fmtScore = (v: number) =>
  v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const logoSlug = (supplierId: string) => supplierId.replace('sup-', '');

const stageHints: Record<ContractStage, string> = {
  Build: 'Generate a draft contract from the standard list and demand',
  Negotiate: 'Resolve terms, SLAs and open issues',
  Agree: 'Finalise, sign and start rollout',
};


const gateStatus = (contract: Contract) => {
  const meetsGate = (iso: string) => {
    const profile = maturityByIso(iso);
    return profile ? profile.scores[contract.maturityGate.dimension] >= contract.maturityGate.target : false;
  };
  const met = contract.countries.filter(meetsGate).length;
  const missing = contract.countries.filter((iso) => !meetsGate(iso));
  return { met, total: contract.countries.length, missing };
};


function StarRow({ value, size = 18 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <Stack direction="row" spacing={0.5}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Iconify
          key={star}
          icon={star <= filled ? 'eva:star-fill' : 'eva:star-outline'}
          width={size}
          sx={{ color: star <= filled ? 'primary.main' : 'text.disabled' }}
        />
      ))}
    </Stack>
  );
}

// ----------------------------------------------------------------------

const CIRCLE_STEPS = [
  { label: 'Demand', href: paths.dashboard.erhebung },
  { label: 'Tender', href: paths.dashboard.ausschreibung },
  { label: 'Contract', href: paths.dashboard.vertraege },
  { label: 'Training', href: paths.dashboard.academy },
  { label: 'Maturity', href: paths.dashboard.reifegrad },
  { label: 'Better data', href: paths.dashboard.root },
] as const;

// ----------------------------------------------------------------------

function ContractCard({ contract }: { contract: Contract }) {
  const supplier = supplierById(contract.supplierId);
  const dimension = maturityDimensions.find((d) => d.id === contract.maturityGate.dimension);
  const gate = gateStatus(contract);
  const gatePct = Math.round((gate.met / gate.total) * 100);
  const trainingPackage = trainingPackageFor(contract);
  const hasPilotRatings = contract.id === pilotRatingsContractId;
  const [ratingsOpen, setRatingsOpen] = useState(false);

  return (
    <Card sx={{ p: 2.5 }}>
      
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          component="img"
          src={`/logos/${logoSlug(contract.supplierId)}.svg`}
          alt={supplier?.name ?? contract.supplierId}
          sx={{ height: 18, flexShrink: 0 }}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
          {supplier?.name}
        </Typography>
      </Stack>

      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        {contract.title}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {contract.termYears} {contract.termYears === 1 ? 'Year' : 'years'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {fmtEUR(contract.volumeEUR)} Jan–Aug 2026
        </Typography>
      </Stack>

      
      <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }} alignItems="center">
        {contract.clusters.map((clusterId) => (
          <Label key={clusterId} variant="soft" color="default">
            {clusterById(clusterId)?.name ?? clusterId}
          </Label>
        ))}
        <Label variant="outlined">{contract.countries.length} Markets</Label>
      </Stack>

      
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
        <LinearProgress
          variant="determinate"
          value={contract.progressPct}
          sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {contract.progressPct} %
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
        <Iconify icon="eva:trending-down-fill" width={16} sx={{ color: 'success.main' }} />
        <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
          Negotiated −{fmtPct(contract.negotiatedSavingPct)} %
        </Typography>
      </Stack>

      {supplier && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
          <Iconify icon="carbon:delivery" width={16} sx={{ color: 'success.main' }} />
          <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
            Supply route −{fmtEUR(supplier.logisticsSavingEUR)} Jan–Aug 2026
          </Typography>
        </Stack>
      )}

      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

      
      {contract.openPoints.length > 0 ? (
        <Stack spacing={0.75}>
          {contract.openPoints.map((point) => (
            <Stack key={point} direction="row" spacing={1} alignItems="flex-start">
              <Box
                sx={{
                  mt: '7px',
                  width: 6,
                  height: 6,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {point}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          No open issues
        </Typography>
      )}

      
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
        <Iconify icon="solar:calendar-date-bold" width={16} sx={{ color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.primary' }}>
          {contract.nextMilestone}
        </Typography>
      </Stack>

      
      {contract.stage === 'Agree' &&
        (hasPilotRatings ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
              Workshop ratings
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
              <StarRow value={pilotRatingAvg} />
              <Typography variant="subtitle2">
                {fmtScore(pilotRatingAvg)} / 5
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                · {pilotRatings.length} Pilot markets
              </Typography>
            </Stack>
            <Button
              size="small"
              color="inherit"
              onClick={() => setRatingsOpen((open) => !open)}
              endIcon={
                <Iconify
                  icon="eva:chevron-down-fill"
                  sx={{
                    transform: ratingsOpen ? 'rotate(180deg)' : 'none',
                    transition: (theme) => theme.transitions.create('transform'),
                  }}
                />
              }
              sx={{ mt: 0.75, px: 1, borderRadius: 5 }}
            >
              {ratingsOpen ? 'Hide market assessments' : 'View all market assessments'}
            </Button>
            <Collapse in={ratingsOpen}>
              <Stack spacing={1.25} sx={{ mt: 1 }}>
                {pilotRatings.map((rating) => (
                  <Box
                    key={rating.iso}
                    sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'background.neutral' }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Label variant="outlined" sx={{ height: 20 }}>
                        {rating.iso}
                      </Label>
                      <StarRow value={rating.stars} size={14} />
                      <Label variant="soft" color="default" sx={{ ml: 'auto' }}>
                        {rating.dimension}
                      </Label>
                    </Stack>
                    <Typography
                      variant="caption"
                      component="div"
                      sx={{ mt: 0.75, fontStyle: 'italic', color: 'text.primary' }}
                    >
                      „{rating.quote}“
                    </Typography>
                    {rating.translation && (
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ mt: 0.25, color: 'text.secondary' }}
                      >
                        „{rating.translation}“
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Box>
        ) : (
          // Bewusster Pending-State bis Go-Live
          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
              Workshop ratings
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Iconify
                  key={star}
                  icon="eva:star-outline"
                  width={18}
                  sx={{ color: 'text.disabled' }}
                />
              ))}
            </Stack>
            <Typography variant="caption" component="div" sx={{ mt: 0.5, color: 'text.secondary' }}>
              After go-live, workshops rate the entire process from demand submission to
              delivery
            </Typography>
          </Box>
        ))}

      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

      
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Linked training
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {contract.trainingCommitments.map((commitment) => {
          const training = trainingById(commitment.trainingId);
          if (!training) return null;
          return (
            <Box key={commitment.trainingId}>
              <Chip
                component={RouterLink}
                href={paths.dashboard.academy}
                clickable
                size="small"
                variant="outlined"
                icon={<Iconify icon="solar:notebook-bold-duotone" width={15} />}
                label={training.title}
              />
              <Typography
                variant="caption"
                component="div"
                sx={{ mt: 0.25, color: 'text.secondary' }}
              >
                {commitment.scope}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      
      {trainingPackage.items.length > 0 && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1.5,
            border: 1,
            borderColor: 'primary.main',
            bgcolor: 'primary.lighter',
          }}
        >
          <Typography variant="overline" sx={{ color: 'primary.dark' }}>
            Training package
          </Typography>
          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
            {trainingPackage.items.map((item) => (
              <Typography
                key={item.trainingId}
                variant="caption"
                component="div"
                sx={{ color: 'grey.700' }}
              >
                {item.format} ·{' '}
                {item.ratePerParticipantEUR.toLocaleString('en-GB')} € per Participant —{' '}
                {trainingById(item.trainingId)?.title}
              </Typography>
            ))}
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 1, color: 'grey.800' }}>
            {trainingPackage.items.length}{' '}
            {trainingPackage.items.length === 1 ? 'Training' : 'Training'} ×{' '}
            {trainingPackage.participants.toLocaleString('en-GB')} Participant ×{' '}
            {trainingPackage.termYears}{' '}
            {trainingPackage.termYears === 1 ? 'Year' : 'years'}
          </Typography>
          <Typography variant="h6" sx={{ color: 'primary.dark' }}>
            = {fmtEUR(trainingPackage.totalEUR)} Training volume
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
            <Iconify icon="solar:verified-check-bold" width={16} sx={{ color: 'primary.dark' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
              funded by the supplier as part of the award
            </Typography>
          </Stack>
        </Box>
      )}

      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

      
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Maturity gate
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
        <Iconify icon="solar:shield-check-bold" width={16} sx={{ color: 'text.disabled' }} />
        <Typography variant="subtitle2">
          {dimension?.name ?? contract.maturityGate.dimension} ≥{' '}
          {fmtScore(contract.maturityGate.target)}
        </Typography>
      </Stack>
      <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
        {contract.maturityGate.note}
      </Typography>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={gatePct}
          color={gatePct === 100 ? 'success' : 'warning'}
          sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {gate.met}/{gate.total} markets meet the gate
        </Typography>
      </Stack>

      {gatePct < 100 && (
        <Stack
          direction="row"
          spacing={0.5}
          useFlexGap
          alignItems="center"
          sx={{ mt: 1, flexWrap: 'wrap' }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.25 }}>
            Open:
          </Typography>
          {(gate.missing.length > 5 ? gate.missing.slice(0, 3) : gate.missing).map((iso) => (
            <Chip
              key={iso}
              component={RouterLink}
              href={`${paths.dashboard.reifegrad}?markt=${iso}`}
              clickable
              size="small"
              variant="outlined"
              label={iso}
              sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
            />
          ))}
          {gate.missing.length > 5 && (
            <Label variant="outlined" sx={{ height: 20 }}>
              +{gate.missing.length - 3}
            </Label>
          )}
        </Stack>
      )}

      {gatePct < 100 && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
          <Iconify icon="solar:danger-triangle-bold" width={14} sx={{ color: 'warning.main' }} />
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            Gap is addressed through{' '}
            <Box
              component={RouterLink}
              href={paths.dashboard.reifegrad}
              sx={{ color: 'inherit', fontWeight: 600 }}
            >
              Training
            </Box>{' '}
            closed
          </Typography>
        </Stack>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

export function VertraegeView() {
  const volumeTotal = contracts.reduce((s, c) => s + c.volumeEUR, 0);
  const weightedSaving =
    contracts.reduce((s, c) => s + c.volumeEUR * c.negotiatedSavingPct, 0) / volumeTotal;
  const priceSavingEUR = (volumeTotal * weightedSaving) / 100;
  const logisticsTotal = contracts.reduce(
    (s, c) => s + (supplierById(c.supplierId)?.logisticsSavingEUR ?? 0),
    0
  );
  const commitmentsTotal = contracts.reduce((s, c) => s + c.trainingCommitments.length, 0);
  const trainingVolumeTotal = contracts.reduce((s, c) => s + trainingPackageFor(c).totalEUR, 0);

  const byStage = (stage: ContractStage) => contracts.filter((c) => c.stage === stage);

  const kpis = [
    {
      label: 'Contract value Jan–Aug 2026',
      value: fmtEUR(volumeTotal),
      hint: `across ${contracts.length} Contracts · Fictional negotiation setting`,
      icon: 'solar:wad-of-money-bold',
      valueColor: 'primary.main',
      extra: null,
    },
    {
      label: 'Average negotiated savings',
      value: `−${fmtPct(weightedSaving)} %`,
      hint: `volume-weighted ≈ ${fmtEUR(priceSavingEUR)} Jan–Aug 2026`,
      icon: 'eva:trending-down-fill',
      valueColor: 'success.main',
      extra: null,
    },
    {
      label: 'Supply-route savings',
      value: fmtEUR(logisticsTotal),
      hint: 'through consolidated supply routes, Jan–Aug 2026',
      icon: 'carbon:delivery',
      valueColor: 'success.main',
      extra: null,
    },
    {
      label: 'Training commitments',
      value: commitmentsTotal.toLocaleString('en-GB'),
      hint: 'contractually agreed',
      icon: 'solar:notebook-bold-duotone',
      valueColor: 'text.primary',
      extra: null,
    },
    {
      label: 'Total training volume',
      value: fmtEUR(trainingVolumeTotal),
      hint: 'funded by suppliers as part of the award',
      icon: 'solar:verified-check-bold',
      valueColor: 'primary.main',
      extra: null,
    },
    {
      label: 'Maturity target',
      value: `Ø ${fmtScore(totals.avgMaturity)} → 3.5`,
      hint: 'through training packages and contract maturity gates',
      icon: 'solar:cup-star-bold',
      valueColor: 'text.primary',
      extra: null,
    },
  ] as const;

  const renderHero = () => (
    <Card sx={{ p: { xs: 3, md: 5 } }}>
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Contracts
      </Typography>
      <Typography
        variant="h3"
        sx={{
          mt: 1,
          maxWidth: 720,
          fontWeight: 800,
          color: 'primary.main',
          textTransform: 'uppercase',
        }}
      >
        Build. Negotiate. Agree.
      </Typography>
      <Box sx={{ mt: 2, height: 4, width: 1, bgcolor: 'primary.main' }} />
      <Typography variant="body1" sx={{ mt: 2.5, maxWidth: 640, color: 'text.secondary' }}>
        Every contract links to the learning platform: training commitments and
        maturity gates form part of the contract. The demo scenario models central negotiation
        and rollout in up to {countries.length} markets.
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap' }} useFlexGap>
        <Button
          component={RouterLink}
          href={paths.dashboard.academy}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 5 }}
          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
        >
          View training
        </Button>
        <Button
          component={RouterLink}
          href={paths.dashboard.reifegrad}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 5 }}
        >
          View maturity
        </Button>
      </Stack>
    </Card>
  );

  const renderKpis = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
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
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="h3" sx={{ color: kpi.valueColor }}>
              {kpi.value}
            </Typography>
            {kpi.extra}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {kpi.hint}
          </Typography>
        </Card>
      ))}
    </Box>
  );

  const renderSectionTitle = (title: string) => (
    <Box>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase' }}
      >
        {title}
      </Typography>
      <Box sx={{ mt: 1, height: 3, width: 1, bgcolor: 'primary.main' }} />
    </Box>
  );

  const renderKanban = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
      }}
    >
      {contractStages.map((stage, index) => (
        <Stack key={stage} spacing={2}>
          <Box
            sx={{
              pb: 1,
              borderBottom: 3,
              borderColor: byStage(stage).length > 0 ? 'primary.main' : 'grey.300',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>
                {stage}
              </Typography>
              <Label variant="soft" color={byStage(stage).length > 0 ? 'primary' : 'default'}>
                {byStage(stage).length}
              </Label>
              {index < contractStages.length - 1 && (
                <Iconify
                  icon="eva:arrow-forward-fill"
                  width={18}
                  sx={{
                    ml: 'auto',
                    color: 'text.disabled',
                    display: { xs: 'none', md: 'inline-flex' },
                  }}
                />
              )}
            </Stack>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
              {stageHints[stage]}
            </Typography>
          </Box>
          {byStage(stage).map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </Stack>
      ))}
    </Box>
  );

  const renderCircle = () => (
    <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, bgcolor: 'grey.100' }}>
      <Typography variant="h5" sx={{ textTransform: 'uppercase', color: 'text.primary' }}>
        The feedback loop
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
        Every contract feeds the learning platform. Better data and five-star workshop feedback
        improve the next tender.
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        alignItems="center"
        sx={{ mt: 2.5, flexWrap: 'wrap' }}
      >
        {CIRCLE_STEPS.map((step, index) => {
          const isCurrent = step.label === 'Contract';
          return (
            <Box key={step.label} sx={{ display: 'contents' }}>
              <Chip
                component={RouterLink}
                href={step.href}
                clickable
                variant={isCurrent ? 'filled' : 'outlined'}
                color={isCurrent ? 'primary' : 'default'}
                label={step.label}
                sx={{ borderRadius: 5 }}
              />
              {index < CIRCLE_STEPS.length - 1 && (
                <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
              )}
            </Box>
          );
        })}
        <Iconify icon="solar:restart-bold" width={18} sx={{ color: 'text.disabled' }} />
      </Stack>
    </Box>
  );

  const renderFooter = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 10, height: 10, flexShrink: 0, bgcolor: 'primary.main' }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Synthetic hackathon demo · Luxury car manufacturer (fictional) — Materials tender Body and paint
      </Typography>
    </Stack>
  );

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        {renderHero()}
        {renderKpis()}
        {renderSectionTitle('Contract pipeline')}
        {renderKanban()}
        {renderCircle()}
        {renderFooter()}
      </Stack>
    </DashboardContent>
  );
}
