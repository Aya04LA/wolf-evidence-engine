import type { FindingSummaryDto } from 'src/data/evidence';

import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { VersionTag, ApprovalLabel, FindingStatusLabel } from './labels';

// ----------------------------------------------------------------------

type Props = {
  findings: FindingSummaryDto[];
  justChanged: ReadonlySet<string>;
  onOpen: (key: string) => void;
};

const title = (f: FindingSummaryDto) =>
  f.kind === 'spend_total' ? `${f.market} · net spend` : `${f.market} · ${f.productCode} · supplier decision`;

export function FindingsTable({ findings, justChanged, onOpen }: Props) {
  const markets = useMemo(() => [...new Set(findings.map((f) => f.market))].sort(), [findings]);
  const [market, setMarket] = useState<string>('all');
  const visible = findings.filter((f) => market === 'all' || f.market === market);

  return (
    <>
      <Tabs
        value={market}
        onChange={(_, v) => setMarket(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ px: 3 }}
      >
        <Tab value="all" label="All markets" />
        {markets.map((m) => (
          <Tab key={m} value={m} label={m} />
        ))}
      </Tabs>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableCell>Finding</TableCell>
              <TableCell>Current result</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Approval</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((f) => (
              <TableRow
                key={f.key}
                hover
                sx={
                  justChanged.has(f.key)
                    ? { bgcolor: (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.16) }
                    : undefined
                }
              >
                <TableCell>
                  <Typography variant="subtitle2">{title(f)}</Typography>
                  {justChanged.has(f.key) && (
                    <Typography variant="caption" color="warning.main">
                      Changed by the last command
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{f.headline}</Typography>
                </TableCell>
                <TableCell>
                  <FindingStatusLabel status={f.status} />
                </TableCell>
                <TableCell>
                  <VersionTag id={f.versionId} count={f.versionCount} />
                </TableCell>
                <TableCell>
                  <ApprovalLabel approvals={f.approvals} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<Iconify icon="solar:eye-bold" />} onClick={() => onOpen(f.key)}>
                    Evidence
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
