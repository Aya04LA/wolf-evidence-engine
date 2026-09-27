'use client';

import type { AuditDto, RecordDto, ReplayDto, LineageDto, FindingDetailDto } from 'src/data/evidence';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useEvidence } from 'src/hooks/use-evidence';

import { DashboardContent } from 'src/layouts/dashboard';
import { evidenceApi, EvidenceApiError } from 'src/data/evidence';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { shortId } from './labels';
import { EventQueue } from './event-queue';
import { FindingDrawer } from './finding-drawer';
import { FindingsTable } from './findings-table';
import { ApproveDialog, CorrectDialog } from './decision-dialogs';

// ----------------------------------------------------------------------

const titleSx = { color: 'primary.main', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' } as const;
const ruleSx = { mx: 3, mt: 2, mb: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' } as const;

const AUDIT_COLOR = { ok: 'success', duplicate: 'info', abstain: 'warning', conflict: 'error', rejected: 'error' } as const;

export function EvidenzView() {
  const { state, loading, notice, clearNotice, justChanged, run, setState } = useEvidence();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<FindingDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approving, setApproving] = useState<FindingDetailDto | null>(null);
  const [correcting, setCorrecting] = useState<RecordDto | null>(null);
  const [reviewer, setReviewer] = useState('');
  const [replayResult, setReplayResult] = useState<ReplayDto | null>(null);
  const [busy, setBusy] = useState(false);

  const [detailError, setDetailError] = useState<string | null>(null);

  const loadDetail = useCallback(async (key: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      setDetail(await evidenceApi.finding(key));
    } catch (e) {
      setDetail(null);
      setDetailError(e instanceof Error ? e.message : 'Evidence could not be loaded.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const open = (key: string) => {
    setOpenKey(key);
    loadDetail(key);
  };

  /** Runs a command, then refreshes the open evidence panel so it never shows a stale version. */
  const command = async (fn: Parameters<typeof run>[0]) => {
    setBusy(true);
    await run(fn);
    if (openKey) await loadDetail(openKey);
    setBusy(false);
  };

  const deliver = (lineageId: string, asMode?: LineageDto['mode']) => {
    setReplayResult(null);
    command(() => evidenceApi.ingest(lineageId, asMode));
  };

  const proveReplay = async () => {
    setBusy(true);
    try {
      setReplayResult(await evidenceApi.replay());
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      setState(await evidenceApi.reset());
      setReplayResult(null);
      clearNotice();
      setOpenKey(null);
      setDetail(null);
    } catch (e) {
      if (e instanceof EvidenceApiError && e.httpStatus === 404) alert('Reset is disabled on this deployment.');
    } finally {
      setBusy(false);
    }
  };

  const stale = state?.findings.filter((f) => f.approvals.at(-1)?.status === 'stale') ?? [];

  return (
    <DashboardContent maxWidth="xl">
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={<Typography sx={titleSx}>Evidence engine: late files and defensible decisions</Typography>}
          subheader="Track 1 · every finding is versioned, traced to source rows, and approved per version"
          sx={{
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            '& .MuiCardHeader-action': { m: 0, mt: { xs: 2, sm: 0 }, alignSelf: { xs: 'flex-start', sm: 'center' } },
          }}
          action={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:shield-check-bold" />}
                disabled={busy || !state}
                onClick={proveReplay}
              >
                Prove replay
              </Button>
              <Button color="inherit" startIcon={<Iconify icon="solar:restart-bold" />} disabled={busy} onClick={reset}>
                Reset demo
              </Button>
            </Stack>
          }
        />
        <Box sx={ruleSx} />
        <Stack direction="row" spacing={1} sx={{ px: 3, pb: 2 }} flexWrap="wrap" useFlexGap>
          <Label color="info">Synthetic data</Label>
          <Label color="warning">Simulated event queue (local, polled every 5 s)</Label>
          <Label color="warning">In-memory state: resets on server restart</Label>
          <Label>Reviewer identity not authenticated</Label>
          {state && (
            <Label variant="outlined" sx={{ fontFamily: 'monospace', textTransform: 'none' }}>
              state {shortId(state.stateHash)} · {state.recordCount} records
            </Label>
          )}
        </Stack>
        {(loading || busy) && <LinearProgress />}
      </Card>

      {stale.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<Iconify icon="solar:danger-triangle-bold" />}>
          <Typography variant="subtitle2">
            {stale.length} approval{stale.length > 1 ? 's are' : ' is'} no longer safe to rely on
          </Typography>
          {stale.map((f) => (
            <Typography key={f.key} variant="body2">
              {f.key}: approved version was superseded. Now “{f.headline}”.{' '}
              <Button size="small" onClick={() => open(f.key)}>
                Review evidence
              </Button>
            </Typography>
          ))}
        </Alert>
      )}

      {notice && (
        <Alert
          sx={{ mb: 3 }}
          onClose={clearNotice}
          severity={
            notice.kind === 'error'
              ? 'error'
              : notice.result.status === 'ok'
                ? 'success'
                : notice.result.status === 'duplicate'
                  ? 'info'
                  : 'warning'
          }
        >
          {notice.kind === 'error' ? (
            <>
              <Typography variant="subtitle2">{notice.message}</Typography>
              {notice.issues.map((i) => (
                <Typography key={i} variant="caption" component="div">
                  {i}
                </Typography>
              ))}
            </>
          ) : (
            <NoticeText result={notice.result} />
          )}
        </Alert>
      )}

      {replayResult && (
        <Alert severity={replayResult.identical && replayResult.findingVersionsIdentical ? 'success' : 'error'} sx={{ mb: 3 }} onClose={() => setReplayResult(null)}>
          <Typography variant="subtitle2">
            {replayResult.identical && replayResult.findingVersionsIdentical
              ? `Replay safe: rebuilding all ${replayResult.commands} commands once and twice gives the identical state`
              : 'Replay produced a different state. This is a defect.'}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }} component="div">
            live {shortId(replayResult.liveStateHash)} · replayed {shortId(replayResult.replayedStateHash)} · replayed twice{' '}
            {shortId(replayResult.replayedTwiceStateHash)}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={<Typography sx={titleSx}>Incoming source files</Typography>}
              subheader="Late deliveries waiting in the local queue"
            />
            <Box sx={ruleSx} />
            <Box sx={{ px: 3, pb: 3 }}>
              {state && <EventQueue lineage={state.lineage} disabled={busy} onDeliver={deliver} />}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={<Typography sx={titleSx}>Findings</Typography>}
              subheader="Recomputed by code from canonical records. The model never computes totals."
            />
            <Box sx={ruleSx} />
            {state && <FindingsTable findings={state.findings} justChanged={justChanged} onOpen={open} />}
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardHeader title={<Typography sx={titleSx}>Audit trail</Typography>} subheader="Every command, including refusals" />
            <Box sx={ruleSx} />
            <Stack spacing={1} sx={{ px: 3, pb: 3, maxHeight: 320, overflow: 'auto' }}>
              {[...(state?.audit ?? [])].reverse().map((a) => (
                <Stack key={a.seq} direction="row" spacing={1.5} alignItems="baseline" flexWrap="wrap" useFlexGap sx={{ wordBreak: 'break-word' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                    #{a.seq}
                  </Typography>
                  <Label color={AUDIT_COLOR[a.status]}>{a.status}</Label>
                  <Typography variant="body2" sx={{ minWidth: 70 }}>
                    {a.command}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {a.subject}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {a.detail}
                    {a.changedFindings.length > 0 && ` → ${a.changedFindings.length} finding(s) re-versioned`}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <FindingDrawer
        open={!!openKey}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onRetry={() => openKey && loadDetail(openKey)}
        onClose={() => {
          setOpenKey(null);
          setDetail(null);
        }}
        onApprove={setApproving}
        onCorrect={setCorrecting}
      />

      <ApproveDialog
        detail={approving}
        reviewer={reviewer}
        onReviewer={setReviewer}
        onClose={() => setApproving(null)}
        onSubmit={(body) => {
          setApproving(null);
          command(() => evidenceApi.approve(body));
        }}
      />

      <CorrectDialog
        record={correcting}
        reviewer={reviewer}
        onReviewer={setReviewer}
        onClose={() => setCorrecting(null)}
        onSubmit={(body) => {
          setCorrecting(null);
          command(() => evidenceApi.correct(body));
        }}
      />
    </DashboardContent>
  );
}

function NoticeText({ result }: { result: AuditDto }) {
  const lead =
    result.status === 'ok'
      ? `${result.command} ${result.subject}: done`
      : result.status === 'duplicate'
        ? `${result.command} ${result.subject}: already applied — nothing changed (no double count)`
        : `${result.command} ${result.subject}: refused (${result.status})`;
  return (
    <>
      <Typography variant="subtitle2">{lead}</Typography>
      <Typography variant="body2">{result.detail}</Typography>
      {result.changedFindings.length > 0 && (
        <Typography variant="caption" component="div">
          New versions: {result.changedFindings.join(', ')}
        </Typography>
      )}
    </>
  );
}
