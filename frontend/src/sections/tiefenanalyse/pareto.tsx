'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { paretoRows } from 'src/data/tiefenanalyse';

// ----------------------------------------------------------------------




const BAR_HEIGHT = 16;
const REST = '#e3e1db';

export function Pareto() {
  const rows = [...paretoRows].sort((a, b) => b.nCodes - a.nCodes);
  const max = Math.max(...rows.map((r) => r.nCodes));

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        The synthetic dataset shows purchasing concentration in a core set of items. Basket size remains an illustrative planning assumption.
      </Typography>
      <Typography variant="caption" sx={{ mb: 2.5, display: 'block', color: 'text.disabled' }}>
        The synthetic dataset illustrates spend concentration. Tender basket size is an illustrative planning assumption.
      </Typography>

      <Stack spacing={1}>
        {rows.map((r) => (
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
                title={`${r.name}: ${r.n80} from ${r.nCodes.toLocaleString('en-GB')} items account for 80% of spend; the top 10 alone ${r.top10Pct.toLocaleString('en-GB')} %`}
                placement="top"
                arrow
              >
                <Box
                  sx={{
                    width: `${(r.nCodes / max) * 100}%`,
                    minWidth: 12,
                    height: BAR_HEIGHT,
                    display: 'flex',
                    borderRadius: 0.5,
                    overflow: 'hidden',
                    bgcolor: REST,
                  }}
                >
                  <Box sx={{ width: `${(r.n80 / r.nCodes) * 100}%`, bgcolor: 'primary.main' }} />
                </Box>
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ width: 110, flexShrink: 0 }}>
              <strong>{r.n80}</strong>
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {' '}
                / {r.nCodes.toLocaleString('en-GB')} Items
              </Box>
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.disabled' }}>
        Orange: items accounting for 80% of spend. Grey: all other ordered
        items in the long tail.
      </Typography>
    </Box>
  );
}
