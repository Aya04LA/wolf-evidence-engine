import { CONFIG } from 'src/global-config';

import { SystemvergleichView } from 'src/sections/systemvergleich/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Abrasives test - ${CONFIG.appName}` };

export default function Page() {
  return <SystemvergleichView />;
}
