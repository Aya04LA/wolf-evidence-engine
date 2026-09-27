'use client';

import type { LocalizedVariant } from './localized-player';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { totals, countries } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { LocalizedPlayer } from './localized-player';

// ----------------------------------------------------------------------



const PIPELINE = [
  {
    icon: 'solar:file-text-bold',
    title: 'Script from tender data',
    caption: `Standard catalogue (${totals.sortimentArtikel} items), categories and processes provide the content`,
  },
  {
    icon: 'solar:microphone-bold',
    title: 'AI voice-over',
    caption: 'Natural voice generated for the target language',
  },
  {
    icon: 'solar:videocamera-record-bold',
    title: 'Scene rendering',
    caption: 'Product and process scenes, automatically edited',
  },
  {
    icon: 'solar:play-circle-bold',
    title: 'English video',
    caption: `${countries.length} markets, localised without extra effort`,
  },
] as const;



const VIDEOS: { title: string; variants: LocalizedVariant[] }[] = [
  {
    title: 'Standard catalogue: structure and correct use',
    variants: [
      {
        code: 'EN',
        label: 'EN · Demo',
        src: '',
      },
      ],
  },
  {
    title: 'Paint workshop safety',
    variants: [
      {
        code: 'EN',
        label: 'EN · Demo',
        src: '',
      },
      ],
  },
];

// ----------------------------------------------------------------------

export function VideoStudio() {
  return (
    <Card id="video-studio">
      <CardHeader
        title="AI video studio"
        subheader="Planned content-to-video pipeline. No videos or voice tracks have been generated for the workshop; the language selector displays placeholders."
      />

      
      <Box
        sx={{
          px: 3,
          pt: 3,
          gap: 1,
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {PIPELINE.map((step, idx) => (
          <Box key={step.title} sx={{ display: 'contents' }}>
            <Box
              sx={(theme) => ({
                p: 2,
                flex: 1,
                width: { xs: 1, md: 'auto' },
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
                borderRadius: 1.5,
                bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
                border: `1px solid ${theme.vars.palette.divider}`,
              })}
            >
              <Box
                sx={(theme) => ({
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'primary.main',
                  bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                })}
              >
                <Iconify icon={step.icon} width={20} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                  Step {idx + 1}
                </Typography>
                <Typography variant="subtitle2">{step.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {step.caption}
                </Typography>
              </Box>
            </Box>

            {idx < PIPELINE.length - 1 && (
              <Iconify
                icon="eva:arrow-forward-fill"
                width={20}
                sx={{
                  color: 'text.disabled',
                  flexShrink: 0,
                  alignSelf: 'center',
                  transform: { xs: 'rotate(90deg)', md: 'none' },
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      
      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        }}
      >
        {VIDEOS.map((video) => (
          <Box key={video.title}>
            <LocalizedPlayer title={video.title} variants={video.variants} />

            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                {video.title}
              </Typography>
              <Label variant="soft" color="info" startIcon={<Iconify icon="solar:videocamera-record-bold" />}>
                AI-generated
              </Label>
            </Box>

            <Typography
              variant="caption"
              sx={{ mt: 0.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <Iconify icon="solar:volume-loud-bold" width={14} />
              AI localisation: voice-over and subtitles for each market
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
