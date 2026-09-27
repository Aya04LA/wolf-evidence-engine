import { CONFIG } from 'src/global-config';

import { UebersichtView } from 'src/sections/uebersicht/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Overview - ${CONFIG.appName}` };

export default function Page() {
  return <UebersichtView />;
}
