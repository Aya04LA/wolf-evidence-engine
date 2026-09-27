import { CONFIG } from 'src/global-config';

import { ProdukteView } from 'src/sections/produkte/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Products - ${CONFIG.appName}` };

export default function Page() {
  return <ProdukteView />;
}
