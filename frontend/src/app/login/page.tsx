import type { Metadata } from 'next';

import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { AccessView } from 'src/auth/view/access-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Sign in - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Suspense>
      <AccessView />
    </Suspense>
  );
}
