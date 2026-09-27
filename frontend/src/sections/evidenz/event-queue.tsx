import type { LineageDto } from 'src/data/evidence';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const MODE_TEXT: Record<LineageDto['mode'], string> = {
  replace_market: 'replaces the whole market',
  add_supplier: 'adds a supplier',
  replace_supplier_subset: "replaces one supplier's rows",
};

const WRONG_LABELS: LineageDto['mode'][] = ['replace_market', 'add_supplier', 'replace_supplier_subset'];

type Props = {
  lineage: LineageDto[];
  disabled: boolean;
  onDeliver: (lineageId: string, asMode?: LineageDto['mode']) => void;
};

export function EventQueue({ lineage, disabled, onDeliver }: Props) {
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: LineageDto } | null>(null);

  return (
    <Stack spacing={1.5}>
      {lineage.map((l) => (
        <Box
          key={l.id}
          sx={{ p: 1.5, borderRadius: 1.5, border: (t) => `1px solid ${t.vars.palette.divider}` }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2">{l.id}</Typography>
            {l.status === 'applied' && <Label color="success">Applied</Label>}
            {l.status === 'pending' && <Label color="info">Waiting</Label>}
            {l.status === 'refused' && <Label color="error">Refused</Label>}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {l.incoming} {MODE_TEXT[l.mode]}
            {l.scopeSupplierId ? ` (${l.scopeSupplierId})` : ''} · supersedes {l.previous}
          </Typography>
          {l.status === 'refused' && l.lastDetail && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
              {l.lastDetail}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              variant={l.status === 'applied' ? 'outlined' : 'contained'}
              startIcon={<Iconify icon={l.status === 'applied' ? 'solar:restart-bold' : 'solar:inbox-in-bold'} />}
              disabled={disabled}
              onClick={() => onDeliver(l.id)}
            >
              {l.status === 'applied' ? 'Replay file' : 'Deliver file'}
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<Iconify icon="solar:danger-triangle-bold" />}
              disabled={disabled}
              onClick={(e) => setMenu({ anchor: e.currentTarget, item: l })}
            >
              Mislabel
            </Button>
          </Stack>
        </Box>
      ))}

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem disabled sx={{ typography: 'caption' }}>
          Adversarial test: deliver as…
        </MenuItem>
        {menu &&
          WRONG_LABELS.filter((m) => m !== menu.item.mode).map((m) => (
            <MenuItem
              key={m}
              onClick={() => {
                onDeliver(menu.item.id, m);
                setMenu(null);
              }}
            >
              {m}
            </MenuItem>
          ))}
      </Menu>
    </Stack>
  );
}
