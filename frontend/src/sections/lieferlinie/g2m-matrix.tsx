'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { brandColor } from 'src/data/nullmessung';
import { countryName, supplierG2M } from 'src/data/lieferlinie';

// ----------------------------------------------------------------------




function CountryChips({ codes }: { codes: string[] }) {
  if (!codes.length) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Not recorded
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {codes.map((iso) => (
        <Tooltip key={iso} arrow title={countryName(iso)}>
          <Chip size="small" variant="outlined" label={iso} sx={{ fontWeight: 600 }} />
        </Tooltip>
      ))}
    </Stack>
  );
}

export function G2mMatrix() {
  return (
    <TableContainer sx={{ px: 1, pb: 2 }}>
      <Table size="small" sx={{ minWidth: 980 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 160 }}>Supplier</TableCell>
            <TableCell sx={{ minWidth: 120 }}>Direct markets</TableCell>
            <TableCell sx={{ minWidth: 150 }}>via manufacturer warehouses or hubs</TableCell>
            <TableCell sx={{ minWidth: 120 }}>via distributors</TableCell>
            <TableCell sx={{ minWidth: 260 }}>Logistics contract option</TableCell>
            <TableCell sx={{ minWidth: 260 }}>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {supplierG2M.map((row) => (
            <TableRow key={row.supplier} hover sx={{ verticalAlign: 'top' }}>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      flexShrink: 0,
                      borderRadius: '3px',
                      bgcolor: brandColor(row.supplier.split(' ')[0]),
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2" noWrap>
                      {row.supplier}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {row.date ? `RFI ${row.date}` : 'RFI 07/2026'}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell>
                <CountryChips codes={row.directMarkets} />
              </TableCell>
              <TableCell>
                <CountryChips codes={row.viaWarehouse} />
              </TableCell>
              <TableCell>
                <CountryChips codes={row.viaDistributor} />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.logisticsContractOption}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.notes}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
