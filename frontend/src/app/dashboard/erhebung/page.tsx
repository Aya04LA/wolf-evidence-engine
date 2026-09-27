import { CONFIG } from 'src/global-config';

import { ErhebungView } from 'src/sections/erhebung/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Intake - ${CONFIG.appName}` };

export default function Page() {
  return <ErhebungView />;
}
