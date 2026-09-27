'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SLIDES, DEMO_ORANGE } from './slides';

// ----------------------------------------------------------------------



const TOTAL = SLIDES.length;

export function EntscheidungView() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, TOTAL - 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        router.push(paths.dashboard.ausschreibung);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [next, prev, router]);

  const slide = SLIDES[index];
  const SlideComponent = slide.component;
  const onDark = index === 0; // Cover-Folie: dunkler Hintergrund

  return (
    <Box
      onClick={next}
      role="presentation"
      aria-label={`Decision brief: slide ${index + 1} from ${TOTAL}`}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        bgcolor: '#0E1E1D',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      
      <Box
        key={slide.key}
        sx={{
          height: 1,
          animation: 'demoSlideIn 360ms ease-out',
          '@keyframes demoSlideIn': {
            from: { opacity: 0, transform: 'translateX(24px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <SlideComponent pageNo={index + 1} />
      </Box>

      
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          right: { xs: 24, md: 56 },
          bottom: { xs: 20, md: 32 },
          cursor: 'default',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {SLIDES.map((s, i) => (
            <Box
              key={s.key}
              component="button"
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              sx={{
                width: 10,
                height: 10,
                p: 0,
                border: 0,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor:
                  i === index
                    ? DEMO_ORANGE
                    : onDark
                      ? 'rgba(255, 255, 255, 0.4)'
                      : 'rgba(185, 196, 192, 0.28)',
              }}
            />
          ))}
        </Stack>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: onDark ? 'rgba(255,255,255,0.85)' : '#B9C4C0',
          }}
        >
          Slide {index + 1}/{TOTAL}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            whiteSpace: 'nowrap',
            display: { xs: 'none', md: 'block' },
            color: onDark ? 'rgba(255,255,255,0.55)' : 'rgba(185,196,192,0.62)',
          }}
        >
          ← → navigate · ESC exit
        </Typography>
      </Stack>
    </Box>
  );
}
