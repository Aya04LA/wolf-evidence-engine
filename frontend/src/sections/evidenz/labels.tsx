import type { LabelColor } from 'src/components/label';
import type { ApprovalDto, FindingSummaryDto } from 'src/data/evidence';

import Tooltip from '@mui/material/Tooltip';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

/** First 8 hex chars: enough to tell versions apart on screen; the full id is in the tooltip. */
export const shortId = (id: string | null) => (id ? id.slice(0, 8) : '—');

const FINDING: Record<FindingSummaryDto['status'], { color: LabelColor; text: string }> = {
  ok: { color: 'success', text: 'Ready for review' },
  abstain: { color: 'warning', text: 'Abstains' },
  conflict: { color: 'error', text: 'Conflict' },
  rejected: { color: 'error', text: 'Rejected' },
};

export function FindingStatusLabel({ status }: { status: FindingSummaryDto['status'] }) {
  const s = FINDING[status];
  return <Label color={s.color}>{s.text}</Label>;
}

export function ApprovalLabel({ approvals }: { approvals: ApprovalDto[] }) {
  const latest = approvals.at(-1);
  if (!latest) return <Label variant="outlined">Not approved</Label>;
  return (
    <Tooltip title={`${latest.reviewer} approved version ${shortId(latest.versionId)} at ${latest.at}`}>
      {latest.status === 'current' ? (
        <Label color="success">Approved</Label>
      ) : (
        <Label color="error">Stale approval</Label>
      )}
    </Tooltip>
  );
}

export function VersionTag({ id, count }: { id: string; count?: number }) {
  return (
    <Tooltip title={`Version ${id}`}>
      <Label variant="outlined" sx={{ fontFamily: 'monospace', textTransform: 'none' }}>
        v{count ?? ''} · {shortId(id)}
      </Label>
    </Tooltip>
  );
}

const ORIGIN: Record<string, { color: LabelColor; text: string }> = {
  event_scope: { color: 'info', text: 'from event scope' },
  derived: { color: 'warning', text: 'derived' },
  reference: { color: 'default', text: 'catalogue' },
  baseline_fixture: { color: 'default', text: 'v1 fixture' },
  buyer_correction: { color: 'secondary', text: 'buyer correction' },
};

/** Marks fields that were not read directly from the source sheet. */
export function OriginLabel({ origin }: { origin: string | undefined }) {
  if (!origin || origin === 'sheet') return null;
  const o = ORIGIN[origin] ?? { color: 'default' as const, text: origin };
  return (
    <Label color={o.color} variant="soft" sx={{ ml: 0.5, textTransform: 'none' }}>
      {o.text}
    </Label>
  );
}
