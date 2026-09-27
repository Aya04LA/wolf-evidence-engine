import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { KiAnalyst } from 'src/components/ki-analyst';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return (
      <DashboardLayout>
        {children}
        <KiAnalyst />
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {children}
        <KiAnalyst />
      </DashboardLayout>
    </AuthGuard>
  );
}
