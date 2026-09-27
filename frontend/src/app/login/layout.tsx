import Box from '@mui/material/Box';

import { AuthSplitLayout } from 'src/layouts/auth-split';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <AuthSplitLayout
      slotProps={{
        header: { slots: { rightArea: <Box /> } },
        section: {
          method: '',
          title: 'Luxury Automotive Materials Intelligence',
          subtitle: 'Materials tender Body and paint · Tender 08-11/2026',
          imgUrl: '/demo-cover.svg',
        },
      }}
    >
      {children}
    </AuthSplitLayout>
  );
}
