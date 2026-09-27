'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { scoreRows, matrixRows, matrixSums, bewertungMeta } from 'src/data/bewertung';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------





const ROUTE_CFG = {
  direct: { color: 'primary.main', label: 'Direct supply offered' },
  indirect: { color: '#8f8b83', label: 'indirect (distributor/intermediate route)' },
  none: { color: 'transparent', label: 'no offer' },
} as const;

const pctColor = (v: number) => (v >= 90 ? 'success.main' : v >= 60 ? 'warning.main' : 'error.main');

function PctBar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="caption" sx={{ width: 118, flexShrink: 0, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'background.neutral' }}>
        <Box
          sx={{ width: `${pct}%`, height: 1, borderRadius: 3, bgcolor: pctColor(pct) }}
        />
      </Box>
      <Tooltip title={detail} placement="top" arrow>
        <Typography
          variant="caption"
          sx={{ width: 44, flexShrink: 0, textAlign: 'right', fontWeight: 700, color: pctColor(pct), cursor: 'default' }}
        >
          {pct} %
        </Typography>
      </Tooltip>
    </Stack>
  );
}

export function Bewertung() {
  return (
    <Box sx={{ pb: 3 }}>
      
      <Typography variant="body2" sx={{ px: 3, mb: 0.5 }}>
        Illustrative offer overview: which supplier serves which market and through
        which route. Solid dot = direct supply offered in the RFI; hollow dot = indirect
        supply through a distributor or intermediate route; blank = no offer.
      </Typography>
      <Typography variant="caption" sx={{ px: 3, mb: 2, display: 'block', color: 'text.disabled' }}>
        Synthetic offer overview: which supplier offers in which market, and via which route. Full
        dot = direct supply offered in the RFI, hollow dot = indirect via distributor, empty = no
        offer. Hover any cell for the verbatim RFI answer.
      </Typography>

      <TableContainer sx={{ px: 3, mb: 4 }}>
        <Table size="small" sx={{ '& td, & th': { px: 0.75, py: 0.4, whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow>
              <TableCell>Market</TableCell>
              {bewertungMeta.suppliers.map((s) => (
                <TableCell key={s} align="center" sx={{ fontSize: 11 }}>
                  {s}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrixRows.map((r) => (
              <TableRow key={r.iso} hover>
                <TableCell sx={{ fontWeight: 600 }}>
                  {r.iso}
                  <Typography component="span" variant="caption" sx={{ ml: 0.75, color: 'text.disabled' }}>
                    {r.name}
                  </Typography>
                </TableCell>
                {r.cells.map((c) => (
                  <TableCell key={c.supplier} align="center">
                    {c.route === 'none' ? (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        –
                      </Typography>
                    ) : (
                      <Tooltip
                        title={`${c.supplier} · ${r.iso}: „${c.verbatim}“ (today: ${c.current})`}
                        placement="top"
                        arrow
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            mx: 'auto',
                            borderRadius: '50%',
                            cursor: 'default',
                            ...(c.route === 'direct'
                              ? { bgcolor: ROUTE_CFG.direct.color }
                              : { border: '2px solid', borderColor: ROUTE_CFG.indirect.color }),
                          }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' } }}>
              <TableCell>Total Markets with Offer</TableCell>
              {bewertungMeta.suppliers.map((s) => (
                <TableCell key={s} align="center" sx={{ color: 'primary.main' }}>
                  {matrixSums[s]}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      
      <Typography variant="body2" sx={{ px: 3, mb: 0.5 }}>
        Supplier fulfilment calculated from RFI responses: catalogue (
        {bewertungMeta.nCategories} Tender categories), market coverage ({bewertungMeta.nMarkets}{' '}
        markets), direct supply and price transparency ({bewertungMeta.nRefPrices}{' '}
        reference items). Unweighted average; procurement determines the weights.
      </Typography>
      <Typography variant="caption" sx={{ px: 3, mb: 2, display: 'block', color: 'text.disabled' }}>
        Fulfillment per supplier, derived mechanically from the RFI returns; the average is
        unweighted — weighting is a procurement decision, configurable later.
      </Typography>

      <Grid container spacing={2} sx={{ px: 3 }}>
        {scoreRows.map((r) => (
          <Grid key={r.name} size={{ xs: 12, md: 6, xl: 4 }}>
            <Box sx={{ p: 2, height: 1, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.25 }}>
                <Typography variant="subtitle2">{r.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', flex: 1 }} noWrap>
                  {r.legalName}
                </Typography>
                <Chip
                  size="small"
                  variant="soft"
                  color={r.avgPct >= 90 ? 'success' : r.avgPct >= 60 ? 'warning' : 'error'}
                  label={`Ø ${r.avgPct} %`}
                  sx={{ height: 22, fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="caption" sx={{ mb: 1.5, display: 'block', color: 'text.disabled' }}>
                Warehouse: {r.warehouses}
              </Typography>

              <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                <PctBar
                  label="Catalogue"
                  pct={r.categoriesPct}
                  detail={`${r.categoriesN} from ${bewertungMeta.nCategories} Tender categories offered`}
                />
                <PctBar
                  label="Market coverage"
                  pct={r.coveragePct}
                  detail={`Offer (direct or indirect) for ${r.coverageN} from ${bewertungMeta.nMarkets} markets`}
                />
                <PctBar
                  label="Direct supply"
                  pct={r.directPct}
                  detail={`Direct supply for ${r.directN} from ${bewertungMeta.nMarkets} markets offered`}
                />
                <PctBar
                  label="Price transparency"
                  pct={r.pricePct}
                  detail={`${r.priceN} from ${r.priceTotal} reference prices provided in the RFI`}
                />
              </Stack>

              {r.plus.map((p, i) => (
                <Stack key={`p${i}`} direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 0.25 }}>
                  <Iconify icon="solar:verified-check-bold" width={14} sx={{ mt: '2px', flexShrink: 0, color: 'success.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {p}
                  </Typography>
                </Stack>
              ))}
              {r.minus.map((m, i) => (
                <Stack key={`m${i}`} direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 0.25 }}>
                  <Iconify icon="solar:danger-triangle-bold" width={14} sx={{ mt: '2px', flexShrink: 0, color: 'warning.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {m}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
