import type { RecordDto, FindingDetailDto } from 'src/data/evidence';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { eur } from 'src/data/evidence';

import { shortId } from './labels';

// ----------------------------------------------------------------------

type ApproveProps = {
  detail: FindingDetailDto | null;
  reviewer: string;
  onReviewer: (name: string) => void;
  onClose: () => void;
  onSubmit: (body: { findingKey: string; versionId: string; reviewer: string; note?: string }) => void;
};

/** Approval pins the exact version shown. If it changes before submit, the server refuses it. */
export function ApproveDialog({ detail, reviewer, onReviewer, onClose, onSubmit }: ApproveProps) {
  const [note, setNote] = useState('');
  useEffect(() => setNote(''), [detail]);
  if (!detail) return null;
  const valid = reviewer.trim().length >= 2;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Approve finding version</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            You are approving version <strong>{shortId(detail.current.versionId)}</strong> of {detail.key}:{' '}
            <strong>{detail.current.headline}</strong>. If a later file changes this finding, your approval becomes stale
            automatically.
          </Alert>
          <TextField
            label="Reviewer"
            value={reviewer}
            onChange={(e) => onReviewer(e.target.value)}
            helperText="Free text in this demo: not an authenticated identity"
            inputProps={{ maxLength: 80 }}
            required
          />
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 500 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!valid}
          onClick={() =>
            onSubmit({
              findingKey: detail.key,
              versionId: detail.current.versionId,
              reviewer: reviewer.trim(),
              ...(note.trim() ? { note: note.trim() } : {}),
            })
          }
        >
          Approve {shortId(detail.current.versionId)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type Field = 'qty' | 'unitPriceEURCents' | 'supplierId';

type CorrectProps = {
  record: RecordDto | null;
  reviewer: string;
  onReviewer: (name: string) => void;
  onClose: () => void;
  onSubmit: (body: {
    recordId: string;
    recordContentId: string;
    field: Field;
    to: number | string;
    reason: string;
    reviewer: string;
  }) => void;
};

const EURO = /^\d+(?:[.,]\d{1,2})?$/;

/** Parses "49.5" / "49,50" into cents without floating point. Null if not a plain amount. */
const toCents = (raw: string): number | null => {
  const s = raw.trim();
  if (!EURO.test(s)) return null;
  const [whole, frac = ''] = s.replace(',', '.').split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
};

export function CorrectDialog({ record, reviewer, onReviewer, onClose, onSubmit }: CorrectProps) {
  const [field, setField] = useState<Field>('qty');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  useEffect(() => {
    setField('qty');
    setValue('');
    setReason('');
  }, [record]);
  if (!record) return null;

  const to: number | string | null =
    field === 'qty'
      ? /^-?\d+$/.test(value.trim()) ? Number(value.trim()) : null
      : field === 'unitPriceEURCents'
        ? toCents(value)
        : value.trim() || null;
  const valid = to !== null && reason.trim().length >= 5 && reviewer.trim().length >= 2;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Correct record {record.id}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {record.brand} · {record.productCode} · {record.qty} pcs at {eur(record.unitPriceEURCents)} ={' '}
            {eur(record.valueEURCents)} · {record.source.file} row {record.source.row}
          </Typography>
          <Alert severity="warning">
            The source row is kept. Your correction is layered on top, creates new finding versions and makes approvals of
            the old versions stale. If a later file replaces this row, the correction is reported as stale, not applied.
          </Alert>
          <TextField select label="Field" value={field} onChange={(e) => setField(e.target.value as Field)}>
            <MenuItem value="qty">Quantity (pieces)</MenuItem>
            <MenuItem value="unitPriceEURCents">Unit price (€)</MenuItem>
            <MenuItem value="supplierId">Supplier id</MenuItem>
          </TextField>
          <TextField
            label="New value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={value !== '' && to === null}
            helperText={
              field === 'qty'
                ? `Whole number${record.qty < 0 ? ', negative for a credit note' : ''}`
                : field === 'unitPriceEURCents'
                  ? 'Euro amount, e.g. 49.50'
                  : 'e.g. sup-aster'
            }
          />
          <TextField
            label="Reason (evidence for the change)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 500 }}
            required
          />
          <TextField
            label="Reviewer"
            value={reviewer}
            onChange={(e) => onReviewer(e.target.value)}
            inputProps={{ maxLength: 80 }}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="warning"
          disabled={!valid}
          onClick={() =>
            to !== null &&
            onSubmit({
              recordId: record.id,
              recordContentId: record.contentId,
              field,
              to,
              reason: reason.trim(),
              reviewer: reviewer.trim(),
            })
          }
        >
          Record correction
        </Button>
      </DialogActions>
    </Dialog>
  );
}
