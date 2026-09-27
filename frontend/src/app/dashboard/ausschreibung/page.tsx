import { CONFIG } from 'src/global-config';

import { AusschreibungView } from 'src/sections/ausschreibung/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Tender - ${CONFIG.appName}` };

export default function Page() {
  return <AusschreibungView />;
}
