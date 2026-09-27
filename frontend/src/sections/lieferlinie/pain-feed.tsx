'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { painPointHighlights } from 'src/data/lieferlinie';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------
// KI-Erkenntnisse-Feed nach dem Push-Prinzip (Muster: nullmessung/agent-feed):



export function PainFeed() {
  if (!painPointHighlights.length) return null;

  return (
    <Stack spacing={0} sx={{ px: 3, pb: 2 }}>
      {painPointHighlights.map((pp, i) => (
        <Stack
          key={i}
          direction="row"
          spacing={2}
          sx={{
            py: 1.75,
            borderBottom: i < painPointHighlights.length - 1 ? '1px dashed' : 'none',
            borderColor: 'divider',
          }}
        >
          <Stack alignItems="center" spacing={0.5} sx={{ width: 64, flexShrink: 0 }}>
            <Iconify icon="solar:monitor-bold" width={20} sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              AI
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
              <Label color="info" variant="soft">
                Insight
              </Label>
              <Typography variant="subtitle2">{pp.title}</Typography>
            </Stack>
            <Typography variant="body2">{pp.detail}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
              Source: {pp.source}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
