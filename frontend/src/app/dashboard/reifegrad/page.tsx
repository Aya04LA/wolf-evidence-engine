import { CONFIG } from 'src/global-config';

import { ReifegradView } from 'src/sections/reifegrad/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Maturity - ${CONFIG.appName}` };

export default function Page() {
  return <ReifegradView />;
}
