'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fmtEURk } from 'src/data/nullmessung';
import { taMeta, basketRows } from 'src/data/tiefenanalyse';

// ----------------------------------------------------------------------




const BAR_HEIGHT = 20;
const UNMATCHED = '#c7c4bd';

export function Artikelsprache() {
  const rows = basketRows.filter((r) => r.totalEUR > 0);
  const max = Math.max(...rows.map((r) => r.totalEUR));

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        In the synthetic dataset, <strong>{taMeta.matchedSharePct.toLocaleString('en-GB')} %</strong> of purchasing volume ({fmtEURk(taMeta.matchedEUR)} from {fmtEURk(taMeta.totalEUR)}) is linked to a shared item key. Other lines simulate local item identifiers.
      </Typography>
      <Typography variant="caption" sx={{ mb: 2.5, display: 'block', color: 'text.disabled' }}>
        In the synthetic dataset, {taMeta.matchedSharePct.toLocaleString('en-US')}% of spend maps to a shared article key. Other records simulate local numbering.
      </Typography>

      <Stack spacing={1}>
        {rows.map((r) => {
          const width = (r.totalEUR / max) * 100;
          const matchedPct = r.totalEUR ? (r.matchedEUR / r.totalEUR) * 100 : 0;
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
                  title={`${r.name}: ${fmtEURk(r.matchedEUR)} zuordenbar (${r.sharePct.toLocaleString('en-GB')} %, ${r.matchedLines.toLocaleString('en-GB')} Rows) from ${fmtEURk(r.totalEUR)}`}
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
                      bgcolor: UNMATCHED,
                    }}
                  >
                    <Box sx={{ width: `${matchedPct}%`, bgcolor: 'primary.main' }} />
                  </Box>
                </Tooltip>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  width: 56,
                  flexShrink: 0,
                  fontWeight: r.sharePct >= 50 ? 700 : 400,
                  color: r.sharePct > 0 ? 'text.primary' : 'text.disabled',
                }}
              >
                {r.sharePct.toLocaleString('en-GB')} %
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.25, bgcolor: 'primary.main' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>mappable to basket
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.25, bgcolor: UNMATCHED }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>no shared article key
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
