'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CHANNELS = [
  {
    id: 'foto',
    icon: 'solar:camera-add-bold',
    title: 'Photo upload',
    description: 'Photograph a shelf or stockroom. The planned AI workflow identifies products, packs and quantities from the image.',
    hint: 'Storage and stock',
  },
  {
    id: 'lieferschein',
    icon: 'solar:file-text-bold',
    title: 'Delivery note',
    description: 'Upload a delivery-note PDF or photo. The planned workflow maps its lines to the standard list.',
    hint: 'PDF / Photo → Standard list',
  },
  {
    id: 'whatsapp',
    icon: 'solar:smartphone-2-bold',
    title: 'Mobile voice message',
    description: 'Send a voice message as you would to a colleague. This demo uses English.',
    hint: 'English workshop language',
  },
] as const;

export type ChannelId = (typeof CHANNELS)[number]['id'];

type Props = {
  onSelectChannel: (channel: ChannelId) => void;
};

export function ChannelCards({ onSelectChannel }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      }}
    >
      {CHANNELS.map((channel) => (
        <Card key={channel.id}>
          <CardActionArea onClick={() => onSelectChannel(channel.id)} sx={{ height: 1, p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: 1 }}>
              <Iconify icon={channel.icon} width={40} sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle1">{channel.title}</Typography>
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                  {channel.hint}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {channel.description}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'fontWeightSemiBold' }}>
                  View sample submission
                </Typography>
                <Iconify icon="eva:arrow-forward-fill" width={14} sx={{ color: 'primary.main' }} />
              </Box>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
