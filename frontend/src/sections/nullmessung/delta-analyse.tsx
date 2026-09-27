'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fmtEURk, bonusRows, bonusNote, deltaRows, deltaSummary } from 'src/data/nullmessung';

// ----------------------------------------------------------------------





const fmtPrice = (v: number) =>
  `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function DeltaAnalyse() {
  if (!deltaRows.length && !bonusRows.length) return null;

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={0} sx={{ px: 1, pb: 2 }}>
      {deltaRows.length > 0 && (
        <TableContainer sx={{ flex: 7, minWidth: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>reference items</TableCell>
                <TableCell align="right">highest price</TableCell>
                <TableCell align="right">best price</TableCell>
                <TableCell align="right">Potential Jan–Aug 2026</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deltaRows.map((r) => (
                <TableRow key={r.code} hover>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" noWrap>
                      {r.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      #{r.code}
                      {r.qtyYear
                        ? ` · ${r.qtyYear.toLocaleString('en-GB')} pieces in the period`
                        : ' · Quantity offen'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPrice(r.worstEUR)}{' '}
                    <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
                      {r.worstIso}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPrice(r.bestEUR)}{' '}
                    <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
                      {r.bestIso}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {r.potentialEUR ? (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.darker' }}>
                        {fmtEURk(r.potentialEUR)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        –
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Harmonisation potential (supported items only)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {deltaSummary.note}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6" sx={{ color: 'success.darker' }}>
                    {fmtEURk(deltaSummary.totalEUR)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {bonusRows.length > 0 && (
        <Box sx={{ flex: 5, minWidth: 0, px: 2, pt: { xs: 3, lg: 0 } }}>
          <Typography variant="subtitle2" sx={{ px: 1, mb: 1 }}>
            Continuous tracking: rebate example
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Country</TableCell>
                  <TableCell align="right">Satz</TableCell>
                  <TableCell align="right">Spend (ident.)</TableCell>
                  <TableCell align="right">Bonus Jan–Aug 2026</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bonusRows.map((b) => (
                  <TableRow key={b.iso}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell align="right">{b.ratePct} %</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmtEURk(b.spendEUR)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {fmtEURk(b.bonusEUR)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" sx={{ px: 1, mt: 1, display: 'block', color: 'text.disabled' }}>
            {bonusNote}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
