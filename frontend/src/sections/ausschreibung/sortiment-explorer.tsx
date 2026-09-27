'use client';

import type { SortimentItem } from 'src/data/platform';

import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { totals, clusters, clusterById, standardsortiment } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------




const CLUSTER_SHORT: Record<string, string> = {
  lack: 'Paint',
  schleif: 'Sanding',
  kleb: 'Masking',
  polier: 'Polishing',
  kabine: 'Booth',
  psa: 'PPE',
  werkstatt: 'Workshop',
};

const PRIORITY_FILTERS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 3, label: 'Required ★★★' },
  { value: 2, label: 'Recommended ★★☆' },
  { value: 1, label: 'Optional ★☆☆' },
];


const BRAND_LOGOS: [string, string][] = [
  ['3M', '/logos/aster.svg'],
  ['Mirka', '/logos/novex.svg'],
  ['Finixa', '/logos/lumen.svg'],
  ['SATA', '/logos/arcus.svg'],
  ['tesa', '/logos/cobalt.svg'],
  ['PPG / Nexa', '/logos/solis.svg'],
  ['Würth', '/logos/orbit.svg'],
  ['Glasurit (BASF)', '/logos/velora.svg'],
  ['Kovax', '/logos/helio.svg'],
  ['Starcke', '/logos/vanta.svg'],
];

const brandLogo = (brand: string) =>
  BRAND_LOGOS.find(([name]) => brand.toLowerCase().startsWith(name.toLowerCase()))?.[1];

const matchesQuery = (item: SortimentItem, q: string) =>
  !q ||
  [item.artikel, item.spezifikation, item.marken, item.anmerkung ?? '', item.kategorie].some(
    (field) => field.toLowerCase().includes(q)
  );


function PriorityStars({ value }: { value: 1 | 2 | 3 }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {[1, 2, 3].map((i) => (
        <Iconify
          key={i}
          icon={i <= value ? 'eva:star-fill' : 'eva:star-outline'}
          width={16}
          sx={{ color: i <= value ? 'primary.main' : 'text.disabled' }}
        />
      ))}
    </Stack>
  );
}

function BrandChips({ marken }: { marken: string }) {
  const brands = marken
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {brands.map((brand) => {
        const logo = brandLogo(brand);
        return (
          <Chip
            key={brand}
            size="small"
            variant="outlined"
            label={brand}
            icon={
              logo ? (
                <Box
                  component="img"
                  src={logo}
                  alt={brand}
                  sx={{ height: 12, width: 'auto', maxWidth: 32 }}
                />
              ) : undefined
            }
            sx={{ height: 22, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
          />
        );
      })}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function SortimentExplorer() {
  const [query, setQuery] = useState('');
  const [clusterIds, setClusterIds] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<(1 | 2 | 3)[]>([]);

  const q = query.trim().toLowerCase();

  const sorted = useMemo(() => [...standardsortiment].sort((a, b) => a.nr - b.nr), []);

  
  const preFiltered = useMemo(
    () =>
      sorted.filter(
        (item) =>
          matchesQuery(item, q) &&
          (priorities.length === 0 || priorities.includes(item.prioritaet))
      ),
    [sorted, q, priorities]
  );

  const filtered = useMemo(
    () =>
      preFiltered.filter((item) => clusterIds.length === 0 || clusterIds.includes(item.cluster)),
    [preFiltered, clusterIds]
  );

  const countByCluster = useMemo(() => {
    const counts: Record<string, number> = {};
    preFiltered.forEach((item) => {
      counts[item.cluster] = (counts[item.cluster] ?? 0) + 1;
    });
    return counts;
  }, [preFiltered]);

  const toggleCluster = (id: string) =>
    setClusterIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const togglePriority = (value: 1 | 2 | 3) =>
    setPriorities((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );

  const hasFilter = q.length > 0 || clusterIds.length > 0 || priorities.length > 0;

  const resetFilters = () => {
    setQuery('');
    setClusterIds([]);
    setPriorities([]);
  };

  
  const rows = useMemo(() => {
    const out: { headerFor?: SortimentItem; item?: SortimentItem }[] = [];
    let lastKategorie: string | null = null;
    filtered.forEach((item) => {
      if (item.kategorie !== lastKategorie) {
        out.push({ headerFor: item });
        lastKategorie = item.kategorie;
      }
      out.push({ item });
    });
    return out;
  }, [filtered]);

  return (
    <Card>
      <CardHeader
        title="Catalogue explorer"
        subheader={`The complete standard catalogue: ${totals.sortimentArtikel} Items, ${clusters.length} categories. Priority: ★★★ Required · ★★☆ Recommended · ★☆☆ Optional`}
      />

      <Stack spacing={2} sx={{ p: 2.5, pb: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search items, specifications, brands and notes, for example fine-line tape or silicone-free"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')} aria-label="Clear search">
                    <Iconify icon="mingcute:close-line" width={16} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <Stack direction="row" spacing={0.75} useFlexGap alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ mr: 0.5, color: 'text.secondary' }}>
            Categories:
          </Typography>
          {clusters.map((cluster) => {
            const selected = clusterIds.includes(cluster.id);
            const count = countByCluster[cluster.id] ?? 0;
            return (
              <Chip
                key={cluster.id}
                clickable
                size="small"
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => toggleCluster(cluster.id)}
                label={`${CLUSTER_SHORT[cluster.id] ?? cluster.name} (${count.toLocaleString('en-GB')})`}
              />
            );
          })}
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ mr: 0.5, color: 'text.secondary' }}>
            Priority:
          </Typography>
          {PRIORITY_FILTERS.map((prio) => {
            const selected = priorities.includes(prio.value);
            return (
              <Chip
                key={prio.value}
                clickable
                size="small"
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => togglePriority(prio.value)}
                label={prio.label}
              />
            );
          })}

          <Box sx={{ flexGrow: 1 }} />

          {hasFilter && (
            <Chip
              clickable
              size="small"
              variant="outlined"
              onClick={resetFilters}
              onDelete={resetFilters}
              deleteIcon={<Iconify icon="mingcute:close-line" width={14} />}
              label="Reset filters"
            />
          )}

          <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
            {filtered.length.toLocaleString('en-GB')} from{' '}
            {totals.sortimentArtikel.toLocaleString('en-GB')} items
          </Typography>
        </Stack>
      </Stack>

      <TableContainer sx={{ maxHeight: 620, overflowX: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell align="right" sx={{ width: 56 }}>
                No.
              </TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Specification</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Typical brands</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) =>
              row.headerFor ? (
                <TableRow key={`kat-${row.headerFor.nr}`}>
                  <TableCell
                    colSpan={6}
                    sx={{
                      py: 1,
                      bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="overline"
                        sx={{ color: 'secondary.main', letterSpacing: 0.5 }}
                      >
                        {row.headerFor.kategorie}
                      </Typography>
                      <Label variant="soft" color="primary">
                        {CLUSTER_SHORT[row.headerFor.cluster] ??
                          clusterById(row.headerFor.cluster)?.name}
                      </Label>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={row.item!.nr} hover>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {row.item!.nr}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Typography variant="subtitle2">{row.item!.artikel}</Typography>
                    {row.item!.anmerkung && (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {row.item!.anmerkung}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {row.item!.spezifikation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                    >
                      {row.item!.einheit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <PriorityStars value={row.item!.prioritaet} />
                  </TableCell>
                  <TableCell sx={{ minWidth: 240 }}>
                    <BrandChips marken={row.item!.marken} />
                  </TableCell>
                </TableRow>
              )
            )}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
                    <Iconify icon="eva:search-fill" width={28} sx={{ color: 'text.disabled' }} />
                    <Typography variant="subtitle2">No items found</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Adjust your search or filters. All filters can be combined.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" sx={{ display: 'block', p: 2.5, color: 'text.disabled' }}>
        Synthetic paint workshop standard catalogue —{' '}
        {totals.sortimentArtikel.toLocaleString('en-GB')} Items
      </Typography>
    </Card>
  );
}
