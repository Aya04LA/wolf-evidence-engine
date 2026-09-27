'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fmtEURk } from 'src/data/nullmessung';
import { routeRows } from 'src/data/tiefenanalyse';

// ----------------------------------------------------------------------




const BAR_HEIGHT = 20;
const DIST = '#8f8b83';

export function Rechnungsweg() {
  const rows = routeRows.filter((r) => r.totalEUR > 0);
  const max = Math.max(...rows.map((r) => r.totalEUR));

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Synthetic invoice routes illustrate manufacturer and distributor purchasing shares. They support discussion of hypothetical direct-supply options.
      </Typography>
      <Typography variant="caption" sx={{ mb: 2.5, display: 'block', color: 'text.disabled' }}>
        Synthetic invoicing routes illustrate manufacturer and distributor shares and hypothetical direct-sourcing options.
      </Typography>

      <Stack spacing={1}>
        {rows.map((r) => {
          const width = (r.totalEUR / max) * 100;
          const distributors = r.topDistributors.map((d) => d.name).join(', ');
          return (
            <Stack key={r.iso} direction="row" alignItems="center" spacing={1.5}>
              <Typography
                variant="caption"
                sx={{ width: 92, flexShrink: 0, textAlign: 'right', color: 'text.secondary' }}
                noWrap
              >
                {r.name}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Tooltip
                  title={
                    `${r.name}: ${r.directPct.toLocaleString('en-GB')} % Manufacturer entity` +
                    (r.directBrands.length ? ` (${r.directBrands.join(', ')})` : '') +
                    (distributors ? ` · Distributors: ${distributors}` : '')
                  }
                  placement="top"
                  arrow
                >
                  <Box
                    sx={{
                      width: `${width}%`,
                      minWidth: 8,
                      height: BAR_HEIGHT,
                      display: 'flex',
                      borderRadius: 0.5,
                      overflow: 'hidden',
                      bgcolor: DIST,
                    }}
                  >
                    <Box sx={{ width: `${r.directPct}%`, bgcolor: 'primary.main' }} />
                  </Box>
                </Tooltip>
              </Box>
              <Typography variant="caption" sx={{ width: 130, flexShrink: 0 }} noWrap>
                <strong>{r.directPct.toLocaleString('en-GB')} %</strong>
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {' '}
                  direct · {fmtEURk(r.totalEUR)}
                </Box>
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={{ mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.25, bgcolor: 'primary.main' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Invoiced by manufacturer entity
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.25, bgcolor: DIST }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Invoiced by distributor
          </Typography>
        </Stack>
        <Chip
          size="small"
          variant="outlined"
          label="synthetic routes"
          sx={{ height: 22, fontSize: 11 }}
        />
      </Stack>
    </Box>
  );
}
