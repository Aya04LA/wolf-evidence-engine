import type { RecordDto, VersionDto, FindingDetailDto } from 'src/data/evidence';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { eur } from 'src/data/evidence';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { shortId, VersionTag, OriginLabel, ApprovalLabel, FindingStatusLabel } from './labels';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  detail: FindingDetailDto | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
  onApprove: (detail: FindingDetailDto) => void;
  onCorrect: (record: RecordDto) => void;
};

const ref = (s: { file: string; sheet?: string; row: number }) =>
  `${s.file.replace('input-sheets/', '')}${s.sheet ? ` [${s.sheet}]` : ''} · row ${s.row}`;

export function FindingDrawer({ open, detail, loading, error, onRetry, onClose, onApprove, onCorrect }: Props) {
  const current = detail?.current;
  const approvable = current?.status === 'ok';
  const hasCurrentApproval = detail?.approvals.some((a) => a.status === 'current');

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 1, md: 860 } } }}>
      {loading && <LinearProgress />}
      {error && !loading && (
        <Alert
          severity="error"
          sx={{ m: 3 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
              <Button color="inherit" size="small" onClick={onClose}>
                Close
              </Button>
            </Stack>
          }
        >
          Evidence could not be loaded: {error}
        </Alert>
      )}
      {detail && current && (
        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="overline" color="text.secondary">
                {detail.key}
              </Typography>
              <Typography variant="h5">{current.headline}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                <FindingStatusLabel status={current.status} />
                <VersionTag id={current.versionId} count={detail.versions.length} />
                <ApprovalLabel approvals={detail.approvals} />
              </Stack>
            </Box>
            <IconButton onClick={onClose} aria-label="Close evidence">
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>

          {current.status !== 'ok' && (
            <Alert severity={current.status === 'abstain' ? 'warning' : 'error'}>
              <Typography variant="subtitle2">Why no recommendation: {current.reason}</Typography>
              <Typography variant="body2">{current.detail}</Typography>
              {current.evidence.length > 0 && (
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                  Evidence: {current.evidence.map(ref).join('; ')}
                </Typography>
              )}
            </Alert>
          )}

          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip
              title={
                approvable
                  ? `Pins version ${shortId(current.versionId)}`
                  : 'Nothing to approve: the finding abstains or conflicts. Correct a record first.'
              }
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
                  disabled={!approvable || hasCurrentApproval}
                  onClick={() => onApprove(detail)}
                >
                  {hasCurrentApproval ? 'Current version approved' : 'Approve this version'}
                </Button>
              </span>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              Approval is a local record only. No order, message or contract change is sent.
            </Typography>
          </Stack>

          <Facts version={current} />

          <Section title="What changed since the previous version">
            {detail.diff.from === null ? (
              <Typography variant="body2" color="text.secondary">
                First version of this finding.
              </Typography>
            ) : (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Label color="success">+{detail.diff.addedRecords.length} added</Label>
                  <Label color="error">−{detail.diff.removedRecords.length} removed</Label>
                  <Label color="warning">{detail.diff.changedRecords.length} changed</Label>
                  <Label>{detail.diff.unchangedRecords} unchanged</Label>
                </Stack>
                <IdList label="Removed" ids={detail.diff.removedRecords} />
                <IdList label="Added" ids={detail.diff.addedRecords} />
                <IdList label="Changed" ids={detail.diff.changedRecords} />
              </Stack>
            )}
          </Section>

          <Section title="Version history (newest first)">
            <Stack spacing={1}>
              {[...detail.versions].reverse().map((v, i) => (
                <Stack key={v.versionId} direction="row" spacing={1.5} alignItems="center">
                  <VersionTag id={v.versionId} count={detail.versions.length - i} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {v.headline}
                  </Typography>
                  {i === 0 ? <Label color="primary">current</Label> : <Label variant="outlined">superseded</Label>}
                  <Typography variant="caption" color="text.secondary">
                    audit #{v.producedAt}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Section>

          <Section title={`Contributing source rows (${detail.records.length})`}>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Record</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit €</TableCell>
                    <TableCell align="right">Net €</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.records.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {r.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.productCode} {r.kind === 'credit_note' && <Label color="error">credit</Label>}
                          {r.corrected && <OriginLabel origin="buyer_correction" />}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {r.brand}
                        <OriginLabel origin={r.origins.supplierId} />
                      </TableCell>
                      <TableCell align="right">{r.qty}</TableCell>
                      <TableCell align="right">{eur(r.unitPriceEURCents)}</TableCell>
                      <TableCell align="right">{eur(r.valueEURCents)}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{ref(r.source)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Button size="small" color="inherit" onClick={() => onCorrect(r)}>
                          Correct
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          {detail.approvals.length > 0 && (
            <Section title="Approvals">
              <Stack spacing={1}>
                {detail.approvals.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1.5} alignItems="center">
                    {a.status === 'current' ? <Label color="success">current</Label> : <Label color="error">stale</Label>}
                    <Typography variant="body2">
                      {a.reviewer} approved v·{shortId(a.versionId)} at {a.at}
                      {a.note ? ` — “${a.note}”` : ''}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Section>
          )}
        </Stack>
      )}
    </Drawer>
  );
}

// ----------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      {children}
    </Box>
  );
}

function IdList({ label, ids }: { label: string; ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
      {label}: {ids.join(', ')}
    </Typography>
  );
}

const CANDIDATE = {
  eligible: { color: 'success', text: 'eligible' },
  unstable_price: { color: 'warning', text: 'unstable price' },
  too_few_lines: { color: 'default', text: 'too few lines' },
} as const;

function Facts({ version }: { version: VersionDto }) {
  const f = version.facts;
  if (f.kind === 'spend_total') {
    return (
      <Section title="Computed from the rows below">
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Invoice lines</TableCell>
              <TableCell align="right">{eur(f.invoiceEURCents)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Credit notes (netted, never dropped)</TableCell>
              <TableCell align="right">{eur(f.creditEURCents)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>Net spend over {f.rows} rows</strong>
              </TableCell>
              <TableCell align="right">
                <strong>{eur(f.totalEURCents)}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>
    );
  }
  return (
    <Section title="Supplier candidates">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Supplier</TableCell>
            <TableCell align="right">Invoice lines</TableCell>
            <TableCell align="right">Weighted avg €/pc</TableCell>
            <TableCell align="right">Range €/pc</TableCell>
            <TableCell>Evidence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {f.candidates.map((c) => (
            <TableRow key={c.supplierId}>
              <TableCell>{c.supplierId}</TableCell>
              <TableCell align="right">{c.invoiceLines}</TableCell>
              <TableCell align="right">{eur(c.avgUnitPriceEURCents)}</TableCell>
              <TableCell align="right">
                {eur(c.minUnitPriceEURCents)} – {eur(c.maxUnitPriceEURCents)}
              </TableCell>
              <TableCell>
                <Label color={CANDIDATE[c.status].color}>{CANDIDATE[c.status].text}</Label>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Rule: cheapest supplier with ≥ 3 invoice lines and ≤ 25% price spread. Credits count in spend, not in price.
        {f.referencePriceEURCents !== null && ` Catalogue base price for context: ${eur(f.referencePriceEURCents)}.`}
      </Typography>
    </Section>
  );
}
