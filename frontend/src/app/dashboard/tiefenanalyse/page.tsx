import { CONFIG } from 'src/global-config';

import { TiefenanalyseView } from 'src/sections/tiefenanalyse/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Deep analysis - ${CONFIG.appName}` };

export default function Page() {
  return <TiefenanalyseView />;
}
