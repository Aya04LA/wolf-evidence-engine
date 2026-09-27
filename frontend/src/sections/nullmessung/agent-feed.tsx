'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { agentFeed } from 'src/data/nullmessung';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------




const CHANNEL = {
  teams: { icon: 'solar:chat-round-dots-bold', label: 'Teams' },
  email: { icon: 'solar:inbox-in-bold', label: 'Email' },
  dashboard: { icon: 'solar:monitor-bold', label: 'Dashboard' },
} as const;

const KIND_COLOR: Record<string, 'info' | 'warning' | 'error' | 'success'> = {
  'new-data': 'info',
  anomaly: 'warning',
  quality: 'error',
  decision: 'success',
};

const KIND_TEXT: Record<string, string> = {
  'new-data': 'Neue Daten',
  anomaly: 'Anomaly',
  quality: 'Data quality',
  decision: 'Decision required',
};

export function AgentFeed() {
  if (!agentFeed.length) return null;

  return (
    <Stack spacing={0} sx={{ px: 3, pb: 2 }}>
      {agentFeed.map((ev, i) => {
        const ch = CHANNEL[ev.channel];
        return (
          <Stack
            key={i}
            direction="row"
            spacing={2}
            sx={{
              py: 1.75,
              borderBottom: i < agentFeed.length - 1 ? '1px dashed' : 'none',
              borderColor: 'divider',
            }}
          >
            <Stack alignItems="center" spacing={0.5} sx={{ width: 64, flexShrink: 0 }}>
              <Iconify icon={ch.icon} width={20} sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {ch.label}
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                <Label color={KIND_COLOR[ev.kind]} variant="soft">
                  {KIND_TEXT[ev.kind]}
                </Label>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ev.ts}
                </Typography>
              </Stack>
              <Typography variant="body2">{ev.de}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                {ev.en}
              </Typography>
            </Box>

            {ev.action && (
              <Button
                size="small"
                variant="outlined"
                sx={{ alignSelf: 'center', borderRadius: 5, flexShrink: 0 }}
              >
                {ev.action}
              </Button>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
