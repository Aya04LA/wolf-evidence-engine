'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { monitorRows } from 'src/data/tiefenanalyse';

// ----------------------------------------------------------------------




export function Monitor() {
  return (
    <Box sx={{ pb: 3 }}>
      <Typography variant="body2" sx={{ px: 3, mb: 0.5 }}>
        The baseline is a snapshot. These alert rules are illustrative requirements for a future implementation with live data.
      </Typography>
      <Typography
        variant="caption"
        sx={{ px: 3, mb: 2, display: 'block', color: 'text.disabled' }}
      >
        The baseline is a synthetic snapshot. These alert rules illustrate requirements for a future implementation.
      </Typography>

      <TableContainer sx={{ px: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Alarm</TableCell>
              <TableCell>Metric / threshold</TableCell>
              <TableCell>Data source</TableCell>
              <TableCell align="right">Start</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monitorRows.map((r) => (
              <TableRow key={r.alarm}>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.alarm}</TableCell>
                <TableCell>{r.metrik}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{r.quelle}</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    variant="soft"
                    color={r.sofort ? 'success' : 'default'}
                    label={r.sofort ? 'sofort' : 'after award'}
                    sx={{ height: 22, fontSize: 11 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
