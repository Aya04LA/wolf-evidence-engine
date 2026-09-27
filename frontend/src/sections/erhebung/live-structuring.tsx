'use client';

import type { StructuredItem } from './structurer';

import { useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { clusterById } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------




type Props = {
  items: StructuredItem[];
  painPoints: string[];
  ended: boolean;
};


const rowInSx = {
  '@keyframes rowIn': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'none' },
  },
  animation: 'rowIn 360ms ease-out',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
} as const;

export function LiveStructuring({ items, painPoints, ended }: Props) {
  const live = items.length > 0 || painPoints.length > 0;
  const empty = !live && !ended;

  
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!ended) setRating(0);
  }, [ended]);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: 1 }}>
      <CardHeader
        title="Live structuring"
        subheader="AI extracts line items from the conversation"
        action={
          <Label variant="soft" color={ended ? 'success' : live ? 'info' : 'default'}>
            {ended ? 'abclosed' : live ? 'live' : 'bereit'}
          </Label>
        }
      />

      <Box sx={{ p: 3, pt: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {empty ? (
          <Box
            sx={(theme) => ({
              flex: 1,
              gap: 1,
              display: 'flex',
              minHeight: 260,
              borderRadius: 2,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              border: `dashed 1px ${theme.vars.palette.divider}`,
              bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
            })}
          >
            <Iconify icon="solar:microphone-bold" width={32} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Waiting for input…
            </Typography>
          </Box>
        ) : (
          <>
            {items.map((item) => {
              const cluster = clusterById(item.cluster);
              return (
                <Box
                  key={`${item.nr ?? item.cluster}-${item.item}`}
                  sx={(theme) => ({
                    p: 2,
                    gap: 0.5,
                    display: 'flex',
                    borderRadius: 2,
                    flexDirection: 'column',
                    border: `solid 1px ${theme.vars.palette.divider}`,
                    ...rowInSx,
                  })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Label variant="soft" color="default">
                      {cluster?.name ?? item.cluster}
                    </Label>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                      {item.qty}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2">{item.item}</Typography>
                  {item.nr !== undefined && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Standard catalogue No. {item.nr}
                    </Typography>
                  )}
                  {item.note && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Iconify icon="solar:danger-triangle-bold" width={14} />
                      {item.note}
                    </Typography>
                  )}
                </Box>
              );
            })}

            {(painPoints.length > 0 || ended) && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {ended && (
                  <Label
                    variant="soft"
                    color="success"
                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                    sx={{ alignSelf: 'flex-start', height: 'auto', py: 0.75, whiteSpace: 'normal' }}
                  >
                    Submission structured — {items.length}{' '}
                    {items.length === 1 ? 'Line item' : 'Line items'}, {painPoints.length}{' '}
                    {painPoints.length === 1 ? 'Challenge' : 'Challenges'}
                  </Label>
                )}
                {ended && (
                  <Box
                    sx={(theme) => ({
                      p: 2,
                      gap: 0.5,
                      display: 'flex',
                      borderRadius: 2,
                      flexDirection: 'column',
                      border: `dashed 1px ${theme.vars.palette.divider}`,
                    })}
                  >
                    <Typography variant="subtitle2">How was the intake process?</Typography>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconButton
                          key={star}
                          size="small"
                          aria-label={`${star} out of 5 stars`}
                          onClick={() => setRating(star)}
                          sx={{ p: 0.5 }}
                        >
                          <Iconify
                            icon={star <= rating ? 'eva:star-fill' : 'eva:star-outline'}
                            width={22}
                            sx={{ color: star <= rating ? 'warning.main' : 'text.disabled' }}
                          />
                        </IconButton>
                      ))}
                    </Box>
                    {rating > 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Thank you. Your rating helps assess process quality.
                      </Typography>
                    )}
                  </Box>
                )}
                {painPoints.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Challenges
                    </Typography>
                    {painPoints.map((point) => (
                      <Box
                        key={point}
                        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, ...rowInSx }}
                      >
                        <Box
                          sx={{
                            mt: '7px',
                            width: 7,
                            height: 7,
                            flexShrink: 0,
                            borderRadius: '50%',
                            bgcolor: 'warning.main',
                          }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Card>
  );
}
