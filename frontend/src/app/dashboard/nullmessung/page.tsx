import { CONFIG } from 'src/global-config';

import { NullmessungView } from 'src/sections/nullmessung/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Baseline - ${CONFIG.appName}` };

export default function Page() {
  return <NullmessungView />;
}
