'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { fmtEURk } from 'src/data/nullmessung';

// ----------------------------------------------------------------------





export type DrillTarget = {
  iso: string;
  country: string;
  segment: string;
  drillKey: string;
  valueEUR: number;
  color: string;
};

type DrillLine = {
  code: string;
  desc: string;
  supplier: string;
  qty: number | null;
  unit: string;
  eur: number;
  local: number;
  cur: string;
  note?: string;
};

type DrillBucket = { totalEUR: number; count: number; lines: DrillLine[] };

type DrillData = Record<string, Record<string, DrillBucket>>;

let cache: DrillData | null = null;

const fmtNum = (v: number, digits = 2) =>
  v.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function SpendDrilldown({
  target,
  onClose,
}: {
  target: DrillTarget | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<DrillData | null>(cache);

  useEffect(() => {
    if (!target || cache) return;
    fetch('/data/nullmessung-lines.json')
      .then((r) => r.json())
      .then((d: DrillData) => {
        cache = d;
        setData(d);
      });
  }, [target]);

  if (!target) return null;

  const bucket = data?.[target.iso]?.[target.drillKey];

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: target.color }} />
          {target.country} — {target.segment}
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {bucket
            ? `${bucket.count.toLocaleString('en-GB')} Invoice lines, ${fmtEURk(bucket.totalEUR)} : sorted by value ${bucket.count.toLocaleString('en-GB')} invoice lines, sorted by value`
            : `${fmtEURk(target.valueEUR)} according to the country file`}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {!data && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {data && !bucket && (
          <Typography variant="body2" sx={{ py: 4, color: 'text.secondary' }}>
            No item-level lines exist for this segment. Its value comes from
            a summary-only or unusable source file. This is the gap
            that intake module 1 addresses. For this
            segment, no detailed comparison is possible. Intake is the
            gap module 1 closes.
          </Typography>
        )}

        {bucket && (
          <>
            <Table size="small" stickyHeader sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell sx={{ minWidth: 260 }}>Description</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bucket.lines.map((l, i) => (
                  <TableRow key={`${l.code}-${i}`} hover>
                    <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {l.code}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.desc}
                      {l.note && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: 'text.disabled', display: 'block' }}
                        >
                          {l.note}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{l.supplier || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {l.qty != null ? `${l.qty.toLocaleString('en-GB')}${l.unit ? ` ${l.unit}` : ''}` : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmtNum(l.eur)} €
                      {l.cur !== 'EUR' && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: 'text.disabled', display: 'block' }}
                        >
                          {fmtNum(l.local)} {l.cur}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {bucket.count > bucket.lines.length && (
              <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.disabled' }}>
                Showing the {bucket.lines.length} largest of{' '}
                {bucket.count.toLocaleString('en-GB')} rows. Showing the top{' '}
                {bucket.lines.length} of {bucket.count.toLocaleString('en-GB')} lines.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
