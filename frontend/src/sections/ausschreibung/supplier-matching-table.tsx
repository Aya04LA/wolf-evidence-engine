'use client';

import type { Supplier } from 'src/data/platform';

import { useState, Fragment } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { fmtEUR, countries, suppliers, clusterById, countryByIso } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const TOTAL_COUNTRIES = countries.length;

const logoSlug = (id: string) => id.replace('sup-', '');

const CLUSTER_SHORT: Record<string, string> = {
  lack: 'Paint',
  schleif: 'Sanding',
  kleb: 'Masking',
  polier: 'Polishing',
  kabine: 'Booth',
  psa: 'PPE',
  werkstatt: 'Workshop',
};


const fmtDelta = (v: number) =>
  `−${Math.abs(v).toLocaleString('en-GB', { maximumFractionDigits: 1 })} %`;

// Demo-Folienlogik: Highlight in Orange, Referenz in Grau, Mittelfeld in Warning
const scoreColor = (score: number): 'primary' | 'warning' | 'inherit' =>
  score >= 85 ? 'primary' : score >= 70 ? 'warning' : 'inherit';

const statusLabel = (status: Supplier['status']): { color: 'primary' | 'warning' | 'default'; text: string } => {
  if (status === 'shortlist') return { color: 'primary', text: 'Shortlist' };
  if (status === 'under review') return { color: 'warning', text: 'Under review' };
  return { color: 'default', text: 'Submitted' };
};

const matchReason = (supplier: Supplier): string => {
  const clusterNames = supplier.clusters
    .map((id) => clusterById(id)?.name)
    .filter(Boolean)
    .join(', ');
  const covered = supplier.countries.length;
  const missing = TOTAL_COUNTRIES - covered;
  const priceTxt = `${Math.abs(supplier.priceDeltaPct).toLocaleString('en-GB', { maximumFractionDigits: 1 })} %`;

  if (missing === 0) {
    return `Full coverage of all ${TOTAL_COUNTRIES} markets for ${clusterNames}, ${supplier.offers} offers against the standard list, price ${priceTxt} below current purchasing, plus ${fmtEUR(supplier.logisticsSavingEUR)} supply-route savings: a match.`;
  }
  if (supplier.matchScore >= 70) {
    return `Covers ${clusterNames} in ${covered} from ${TOTAL_COUNTRIES} markets, price ${priceTxt} below current purchasing: ${missing} ${missing === 1 ? 'market remains' : 'markets remain'} uncovered and ${missing === 1 ? 'needs' : 'need'} an additional supplier.`;
  }
  return `Only ${covered} from ${TOTAL_COUNTRIES} markets for ${clusterNames} covered, price advantage ${priceTxt} : this does not meet the identified demand as a sole-source award.`;
};

// ----------------------------------------------------------------------

export function SupplierMatchingTable() {
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = [...suppliers].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <Card>
      <CardHeader
        title="Supplier matching"
        subheader={`${suppliers.length} bidders assessed against demand from ${TOTAL_COUNTRIES} markets, ranked by match score`}
      />

      <TableContainer sx={{ mt: 2, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell>Supplier</TableCell>
              <TableCell>Categories</TableCell>
              <TableCell>Country coverage</TableCell>
              <TableCell align="right">Offers</TableCell>
              <TableCell>Match-Score</TableCell>
              <TableCell align="right">Price delta</TableCell>
              <TableCell align="right">Logistics savings</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sorted.map((supplier) => {
              const open = openId === supplier.id;
              const status = statusLabel(supplier.status);
              const coverage = supplier.countries.length;
              const covered = supplier.countries
                .map((iso) => countryByIso(iso))
                .filter((c) => !!c);
              const missing = countries.filter((c) => !supplier.countries.includes(c.iso));
              
              const rerouted = covered.filter((c) => c!.supplyDependency !== 'Direct supply Manufacturer');
              const targetRoute = supplier.type === 'Manufacturer' ? 'Direct supply' : 'Consolidated supply';

              return (
                <Fragment key={supplier.id}>
                  <TableRow
                    hover
                    onClick={() => setOpenId(open ? null : supplier.id)}
                    sx={{
                      cursor: 'pointer',
                      ...(open && {
                        bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.06),
                      }),
                      '& > td': { whiteSpace: 'nowrap' },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Iconify
                          icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                          width={16}
                          sx={{ color: 'text.disabled', flexShrink: 0 }}
                        />
                        <Box
                          component="img"
                          src={`/logos/${logoSlug(supplier.id)}.svg`}
                          alt={supplier.name}
                          sx={{ height: 18, width: 'auto', flexShrink: 0 }}
                        />
                        <Box>
                          <Typography variant="subtitle2">{supplier.name}</Typography>
                          <Label variant="soft" color={supplier.type === 'Manufacturer' ? 'info' : 'default'} sx={{ mt: 0.25 }}>
                            {supplier.type}
                          </Label>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {supplier.clusters.map((id) => (
                          <Label key={id} variant="soft" color="default">
                            {CLUSTER_SHORT[id] ?? clusterById(id)?.name}
                          </Label>
                        ))}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5} sx={{ minWidth: 96 }}>
                        <Typography variant="body2">
                          {coverage}/{TOTAL_COUNTRIES}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(coverage / TOTAL_COUNTRIES) * 100}
                          color="inherit"
                          sx={{ height: 4, borderRadius: 1, color: 'text.secondary' }}
                        />
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2">{supplier.offers.toLocaleString('en-GB')}</Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 160 }}>
                        <LinearProgress
                          variant="determinate"
                          value={supplier.matchScore}
                          color={scoreColor(supplier.matchScore)}
                          sx={{ height: 6, borderRadius: 1, flexGrow: 1 }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            width: 48,
                            textAlign: 'right',
                            color:
                              supplier.matchScore >= 85
                                ? 'primary.main'
                                : supplier.matchScore >= 70
                                  ? 'warning.main'
                                  : 'text.secondary',
                          }}
                        >
                          {supplier.matchScore} %
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
                        {fmtDelta(supplier.priceDeltaPct)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
                        {fmtEUR(supplier.logisticsSavingEUR)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Label variant="soft" color={status.color}>
                        {status.text}
                      </Label>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 0, border: 'none' }}>
                      <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            my: 1.5,
                            p: 2.5,
                            borderRadius: 1.5,
                            bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.06),
                          }}
                        >
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                                Covered countries ({covered.length})
                              </Typography>
                              <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                                {covered.map((c) => (
                                  <Label key={c!.iso} variant="soft" color="primary">
                                    {c!.name}
                                  </Label>
                                ))}
                              </Stack>
                            </Box>

                            {missing.length > 0 && (
                              <Box>
                                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                                  Missing countries ({missing.length})
                                </Typography>
                                <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                                  {missing.map((c) => (
                                    <Label key={c.iso} variant="soft" color="error">
                                      {c.name}
                                    </Label>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {rerouted.length > 0 && (
                              <Box>
                                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                                  Replaced supply routes ({rerouted.length})
                                </Typography>
                                <Box
                                  sx={{
                                    mt: 0.75,
                                    display: 'grid',
                                    columnGap: 2,
                                    rowGap: 0.5,
                                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                                  }}
                                >
                                  {rerouted.map((c) => (
                                    <Stack key={c!.iso} direction="row" spacing={0.75} alignItems="center">
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {c!.name}: {c!.supplyDependency}
                                      </Typography>
                                      <Iconify
                                        icon="eva:arrow-forward-fill"
                                        width={14}
                                        sx={{ color: 'text.disabled', flexShrink: 0 }}
                                      />
                                      <Typography variant="caption" sx={{ color: 'success.main' }}>
                                        {targetRoute}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Box>
                              </Box>
                            )}

                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Iconify
                                icon={supplier.matchScore >= 70 ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                                width={18}
                                sx={{
                                  mt: 0.25,
                                  flexShrink: 0,
                                  color: supplier.matchScore >= 70 ? 'success.main' : 'error.main',
                                }}
                              />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {matchReason(supplier)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
