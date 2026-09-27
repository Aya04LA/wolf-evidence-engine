'use client';

import type { ThemeOptions } from './types';

import { createPaletteChannel } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FDE1C7',
          light: '#F5B463',
          main: '#FF7900',
          dark: '#C85F00',
          darker: '#7A3A00',
          contrastText: '#0E1E1D',
        }),
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FDE1C7',
          light: '#F5B463',
          main: '#FF7900',
          dark: '#C85F00',
          darker: '#7A3A00',
          contrastText: '#0E1E1D',
        }),
      },
    },
  },
};
