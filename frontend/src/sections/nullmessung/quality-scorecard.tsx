'use client';

import type { QualityRating } from 'src/data/nullmessung';

import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fmtEURk, nullmessungCountries } from 'src/data/nullmessung';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------



const QUALITY_LABEL: Record<QualityRating, { text: string; textEN: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' }> = {
  clean: { text: 'auswertbar', textEN: 'usable', color: 'success' },
  raw: { text: 'auswertbar (roh)', textEN: 'usable (raw)', color: 'info' },
  poor: { text: 'teilweise', textEN: 'partial', color: 'warning' },
  unusable: { text: 'unbrauchbar', textEN: 'unusable', color: 'error' },
  rejected: { text: 'abgelehnt', textEN: 'rejected', color: 'error' },
  demand_only: { text: 'demand only', textEN: 'demand only', color: 'default' },
};

const QUALITY_ORDER: QualityRating[] = ['clean', 'raw', 'poor', 'demand_only', 'unusable', 'rejected'];

export function QualityScorecard() {
  const rows = [...nullmessungCountries].sort(
    (a, b) =>
      QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality) ||
      b.totalEUR - a.totalEUR
  );

  if (!rows.length) return null;

  return (
    <TableContainer sx={{ px: 1, pb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Country</TableCell>
            <TableCell>Voice</TableCell>
            <TableCell>Format</TableCell>
            <TableCell align="right">Rows</TableCell>
            <TableCell align="right">Volume</TableCell>
            <TableCell>Quality</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((c) => {
            const q = QUALITY_LABEL[c.quality];
            return (
              <TableRow key={c.iso} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {c.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {c.files} {c.files === 1 ? 'Datei' : 'Dateien'} · {c.currency}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {c.language}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {c.granularity}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {c.rows ? c.rows.toLocaleString('en-GB') : '–'}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {c.totalEUR > 0 ? fmtEURk(c.totalEUR) : '–'}
                </TableCell>
                <TableCell>
                  <Tooltip title={c.caveats.join(' · ') || q.textEN} placement="top-start" arrow>
                    <span>
                      <Label color={q.color}>{q.text}</Label>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
