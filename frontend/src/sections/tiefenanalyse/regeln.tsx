'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { regeln } from 'src/data/tiefenanalyse';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------




const KIND_CFG = {
  lever: { icon: 'solar:verified-check-bold', color: 'success.main', label: 'Opportunity' },
  gap: { icon: 'solar:danger-triangle-bold', color: 'warning.main', label: 'Gap' },
} as const;

export function Regeln() {
  return (
    <Grid container spacing={2} sx={{ px: 3, pb: 3 }}>
      {regeln.map((r, i) => {
        const cfg = KIND_CFG[r.kind];
        return (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 2,
                height: 1,
                borderRadius: 1.5,
                bgcolor: 'background.neutral',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Iconify
                  icon={cfg.icon}
                  width={20}
                  sx={{ mt: '2px', flexShrink: 0, color: cfg.color }}
                />
                <Box>
                  <Typography variant="body2">
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      IF{' '}
                    </Box>
                    {r.wenn}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      THEN{' '}
                    </Box>
                    {r.dann}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.75, display: 'block', color: 'text.disabled' }}
                  >
                    {cfg.label}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}
