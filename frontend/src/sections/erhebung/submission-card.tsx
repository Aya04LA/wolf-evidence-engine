'use client';

import type { IntakeSubmission } from 'src/data/platform';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { clusterById, countryByIso } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CHANNEL_ICONS = {
  Voice: 'solar:microphone-bold',
  Photo: 'solar:camera-add-bold',
  'Delivery note': 'solar:file-text-bold',
  'Voice + Photo': 'solar:microphone-bold',
} as const satisfies Record<IntakeSubmission['channel'], string>;

const fmtTimestamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  });

type Props = {
  submission: IntakeSubmission;
  highlighted?: boolean;
};

export function SubmissionCard({ submission, highlighted = false }: Props) {
  const country = countryByIso(submission.iso);
  const structured = submission.status === 'structured';

  return (
    <Card
      sx={(theme) => ({
        transition: theme.transitions.create(['box-shadow'], { duration: 300 }),
        ...(highlighted && {
          boxShadow: `0 0 0 2px ${theme.vars.palette.primary.main}`,
        }),
      })}
    >
      <Box sx={{ p: 3, pb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="subtitle1">{submission.site}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {country?.name ?? submission.iso} · {fmtTimestamp(submission.timestamp)} 
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Label variant="outlined" color="default" startIcon={<Iconify icon={CHANNEL_ICONS[submission.channel]} />}>
            {submission.channel}
          </Label>
          <Label variant="outlined" color="default" startIcon={<Iconify icon="solar:chat-round-dots-bold" />}>
            {submission.language}
          </Label>
          <Label variant="soft" color={structured ? 'success' : 'warning'}>
            {submission.status}
          </Label>
        </Box>
      </Box>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Cluster</TableCell>
              <TableCell>Line item</TableCell>
              <TableCell align="right">Quantity / Month</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submission.items.map((item) => (
              <TableRow key={item.item}>
                <TableCell sx={{ width: 200 }}>
                  <Label variant="soft" color="default">
                    {clusterById(item.cluster)?.name ?? item.cluster}
                  </Label>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{item.item}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                    {item.qtyPerMonth}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{item.note ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Challenges
        </Typography>
        {submission.painPoints.map((point) => (
          <Box key={point} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box
              sx={{
                mt: '7px',
                width: 7,
                height: 7,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: 'warning.main',
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {point}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ px: 3, py: 1.75, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Feeds into the{' '}
          <Link component={RouterLink} href={paths.dashboard.ausschreibung} color="inherit" underline="always">
            Tender
          </Link>{' '}
          and updates the{' '}
          <Link component={RouterLink} href={paths.dashboard.reifegrad} color="inherit" underline="always">
            Maturity
          </Link>{' '}
          for the country.
        </Typography>
      </Box>
    </Card>
  );
}
