import type { BoxProps } from '@mui/material/Box';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { clusters, countries } from 'src/data/platform';


// ----------------------------------------------------------------------

export function NavUpgrade({ sx, ...other }: BoxProps) {
  return (
    <Box
      sx={[{ px: 2.5, py: 4, textAlign: 'left' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Typography
        variant="overline"
        sx={{ display: 'block', color: 'var(--layout-nav-text-disabled-color)', letterSpacing: '0.12em' }}
      >
        Wolf Materials Lab
      </Typography>
      <Typography
        variant="body2"
        sx={{ mt: 0.75, color: 'var(--layout-nav-text-primary-color)', fontWeight: 600 }}
      >
        Synthetic workshop scenario
      </Typography>
      <Typography variant="caption" sx={{ mt: 0.25, display: 'block', color: 'var(--layout-nav-text-disabled-color)' }}>
        {countries.length} Markets · {countries.reduce((sum, c) => sum + c.dealers, 0)} Locations · {clusters.length} Categories
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function UpgradeBlock({ sx, ...other }: BoxProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(135deg, ${varAlpha(theme.vars.palette.error.lightChannel, 0.92)}, ${varAlpha(theme.vars.palette.secondary.darkChannel, 0.92)})`,
              `url(${CONFIG.assetsDir}/assets/background/background-7.webp)`,
            ],
          }),
          px: 3,
          py: 4,
          borderRadius: 2,
          position: 'relative',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={(theme) => ({
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          borderRadius: 2,
          position: 'absolute',
          border: `solid 3px ${varAlpha(theme.vars.palette.common.whiteChannel, 0.16)}`,
        })}
      />

      <Box
        component={m.img}
        animate={{ y: [12, -12, 12] }}
        transition={{
          duration: 8,
          ease: 'linear',
          repeat: Infinity,
          repeatDelay: 0,
        }}
        alt="Small Rocket"
        src={`${CONFIG.assetsDir}/assets/illustrations/illustration-rocket-small.webp`}
        sx={{
          right: 0,
          width: 112,
          height: 112,
          position: 'absolute',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Box component="span" sx={{ typography: 'h5', color: 'common.white' }}>
          35% OFF
        </Box>

        <Box
          component="span"
          sx={{
            mb: 2,
            mt: 0.5,
            color: 'common.white',
            typography: 'subtitle2',
          }}
        >
          Power up Productivity!
        </Box>

        <Button variant="contained" size="small" color="warning">
          Upgrade to Pro
        </Button>
      </Box>
    </Box>
  );
}
