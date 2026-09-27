import { CONFIG } from 'src/global-config';

import { EvidenzView } from 'src/sections/evidenz/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Evidence - ${CONFIG.appName}` };

export default function Page() {
  return <EvidenzView />;
}
