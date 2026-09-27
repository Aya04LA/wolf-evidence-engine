'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------



const TRACK_LABEL: Record<string, string> = {
  DE: 'German',
  EN: 'English',
  ES: 'Spanish',
  FR: 'French',
};

export type LocalizedVariant = {
  /** Sprachcode, z. B. 'DE' */
  code: string;
  
  label: string;
  /** Video-Quelle dieser Variante */
  src: string;
  /** Optionaler WebVTT-Untertitel (relativ zu /public) */
  vtt?: string;
  /** true = eigene Tonspur (KI-Voice-Over) statt Untertitel */
  voiceOver?: boolean;
};

type LocalizedPlayerProps = {
  title: string;
  variants: LocalizedVariant[];
};

export function LocalizedPlayer({ title, variants }: LocalizedPlayerProps) {
  const [activeCode, setActiveCode] = useState(variants.find(v => v.code === 'EN')?.code ?? 'EN');

  const active = variants.find((v) => v.code === activeCode) ?? variants[0];

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: 'grey.100',
          aspectRatio: '16 / 9',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        
        <Typography variant="caption" sx={{ color: 'text.disabled', position: 'absolute' }}>
          Demo placeholder · No video generated
        </Typography>

        
        {active.src && <Box
          key={`${active.code}-${active.src}`}
          component="video"
          controls
          preload="metadata"
          src={active.src}
          aria-label={`${title} (${TRACK_LABEL[active.code] ?? active.code})`}
          sx={{ position: 'absolute', inset: 0, width: 1, height: 1, objectFit: 'cover' }}
        >
          {active.vtt && (
            <track
              default
              kind="subtitles"
              src={active.vtt}
              srcLang={active.code.toLowerCase()}
              label={TRACK_LABEL[active.code] ?? active.code}
            />
          )}
        </Box>}
      </Box>

      
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        {variants.map((variant) => {
          const selected = variant.code === active.code;
          return (
            <Chip
              key={variant.code}
              clickable
              size="small"
              label={variant.label}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => setActiveCode(variant.code)}
              icon={
                variant.voiceOver ? (
                  <Iconify icon="solar:volume-loud-bold" width={15} />
                ) : undefined
              }
            />
          );
        })}
      </Box>
    </Box>
  );
}
