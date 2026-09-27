import { CONFIG } from 'src/global-config';

import { VertraegeView } from 'src/sections/vertraege/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Vertraege - ${CONFIG.appName}` };

export default function Page() {
  return <VertraegeView />;
}
