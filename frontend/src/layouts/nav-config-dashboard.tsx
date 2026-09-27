import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  /**
   * Ausschreibung 2026
   */
  {
    subheader: 'Tender 2026',
    items: [
      {
        title: 'Overview',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        info: <Label color="error">Demo</Label>,
      },
      { title: 'Demand intake', path: paths.dashboard.erhebung, icon: ICONS.chat },
      { title: 'Baseline', path: paths.dashboard.nullmessung, icon: ICONS.analytics },
      { title: 'Deep analysis', path: paths.dashboard.tiefenanalyse, icon: ICONS.analytics },
      { title: 'Products', path: paths.dashboard.produkte, icon: ICONS.product },
      { title: 'Abrasives test', path: paths.dashboard.systemvergleich, icon: ICONS.label },
      {
        title: 'Supply chain',
        path: paths.dashboard.lieferlinie,
        icon: ICONS.banking,
        info: <Label color="warning">New</Label>,
      },
      { title: 'Tender', path: paths.dashboard.ausschreibung, icon: ICONS.invoice },
      { title: 'Contracts', path: paths.dashboard.vertraege, icon: ICONS.order },
      { title: 'Decision', path: paths.dashboard.entscheidung, icon: ICONS.tour },
    ],
  },
  
  {
    subheader: 'Enablement',
    items: [
      { title: 'Maturity', path: paths.dashboard.reifegrad, icon: ICONS.analytics },
      { title: 'Components', path: '/dashboard/components', icon: ICONS.menuItem },
      { title: 'Training', path: paths.dashboard.academy, icon: ICONS.course },
    ],
  },
];
