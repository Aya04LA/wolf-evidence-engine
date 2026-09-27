'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

export default function ComponentsPage() {
  const [threshold, setThreshold] = useState(90);
  const [approved, setApproved] = useState(false);
  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline">Wolf starter · Component examples</Typography>
          <Typography variant="h3" color="primary.main">Theme and components</Typography>
          <Typography color="text.secondary">Existing theme and layouts. These examples use fictional values and local state.</Typography>
        </Box>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Evidence and review</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Label color="info">Synthetic source</Label><Label color="warning">Needs review</Label><Label color="success">Verified arithmetic</Label>
          </Stack>
          <TextField fullWidth label="Evidence reference" defaultValue="synthetic-invoice / line 3" size="small" />
          <Table size="small"><TableBody>
            <TableRow><TableCell>Quantity</TableCell><TableCell align="right">40 pieces</TableCell></TableRow>
            <TableRow><TableCell>Unit price</TableCell><TableCell align="right">€2.50</TableCell></TableRow>
            <TableRow><TableCell>Net amount</TableCell><TableCell align="right">€100.00</TableCell></TableRow>
          </TableBody></Table>
        </Card>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6">Human approval</Typography>
          <Typography color="text.secondary">Illustrative review threshold: {threshold}%</Typography>
          <Slider value={threshold} min={50} max={100} onChange={(_,v) => setThreshold(v as number)} aria-label="Review confidence threshold" />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" startIcon={<Iconify icon="solar:check-circle-bold" />} onClick={() => setApproved(true)} disabled={approved}>{approved ? 'Approved locally' : 'Approve demo proposal'}</Button>
            <Button variant="outlined" onClick={() => setApproved(false)}>Reset</Button>
          </Stack>
          <Typography variant="caption">No purchase, message or database write occurs.</Typography>
        </Card>
        <Typography variant="body2">Reuse src/theme for tokens and overrides; src/components for shared controls; src/layouts/dashboard for the shell; src/sections for the domain screens. See COMPONENTS.md for the map.</Typography>
      </Stack>
    </DashboardContent>
  );
}
