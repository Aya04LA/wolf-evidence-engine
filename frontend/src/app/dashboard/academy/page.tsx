import { CONFIG } from 'src/global-config';

import { AcademyView } from 'src/sections/academy/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Academy - ${CONFIG.appName}` };

export default function Page() {
  return <AcademyView />;
}
