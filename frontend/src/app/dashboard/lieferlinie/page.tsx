import { CONFIG } from 'src/global-config';

import { LieferlinieView } from 'src/sections/lieferlinie/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Supply chain - ${CONFIG.appName}` };

export default function Page() {
  return <LieferlinieView />;
}
