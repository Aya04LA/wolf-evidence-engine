import { CONFIG } from 'src/global-config';

import { EntscheidungView } from 'src/sections/entscheidung/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Decision - ${CONFIG.appName}` };

export default function Page() {
  return <EntscheidungView />;
}
