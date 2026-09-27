'use client';

import type { RoleplayScenario } from 'src/data/platform';
import type { VoiceLine } from 'src/components/voice-session';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { VoiceSession } from 'src/components/voice-session';

// ----------------------------------------------------------------------



const SCRIPTS: Record<string, VoiceLine[]> = {
  'rp-bedarf': [
    { role: 'ai', text: "Welcome to demand intake for South demo workshop. How many people work in body and paint?" },
    { role: 'user', text: "Eight people: five in painting and three in body repair." },
    { role: 'ai', text: "Thank you. Which materials do you use most each month?" },
    { role: 'user', text: "Sanding discs 150 mm P600, around 720 pieces, and mixing cups 400 ml with 125 micron cup liners." },
    { role: 'ai', text: "Recorded: 720 sanding discs 150 mm P600 and 18 packs of mixing cups. How do you buy them today?" },
    { role: 'user', text: "We buy through a regional distributor with a two-week lead time." },
    { role: 'ai', text: "Understood. I will record that challenge. What would you like from the tender?" },
    { role: 'user', text: "A standard abrasive catalogue and reliable lead times. We currently use three different tape brands." },
  ],
  'rp-reklamation': [
    { role: 'ai', text: "Hello, this is your paint supplier representative. You called about a delivery?" },
    { role: 'user', text: "Yes, a batch of clearcoat dried unevenly on three vehicles in succession." },
    { role: 'ai', text: "I am sorry to hear that. Could you give me the batch number on the container?" },
    { role: 'user', text: "Batch DEMO-2026-0208, HS clearcoat 5 litres, delivered on 8 February." },
    { role: 'ai', text: "Thank you. How many containers in this batch are affected?" },
    { role: 'user', text: "Six containers, two already opened. We request replacements and coverage of rework costs." },
    { role: 'ai', text: "I will open a complaint case. Please photograph the label and the defect so the replacement can be reviewed." },
    { role: 'user', text: "The photos are ready. I will upload them to the case in the portal." },
  ],
  'rp-unterweisung': [
    { role: 'user', text: "Welcome to the team. Before entering the booth, we will review the safety instructions, starting with respiratory protection." },
    { role: 'ai', text: "I have seen different masks. Which one do I need for painting?" },
    { role: 'user', text: "For this exercise, we first review the approved operating instructions and safety data sheet. The responsible specialist determines suitable respiratory protection." },
    { role: 'ai', text: "Is a simple dust mask enough for sanding?" },
    { role: 'user', text: "That depends on the material and process. A qualified specialist must confirm the required protection before work starts." },
    { role: 'ai', text: "How often should the filters be changed?" },
    { role: 'user', text: "We follow the approved replacement schedule and manufacturer instructions. The specialist will also show you correct storage." },
    { role: 'ai', text: "Understood: review operating instructions, confirm protective measures and follow the replacement schedule. I am ready for the demo knowledge check." },
  ],
};


const AGENT_KEYS: Record<string, string> = {
  'rp-bedarf': 'erhebung',
  'rp-reklamation': 'roleplay-lack',
  'rp-unterweisung': 'roleplay-psa',
};

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  scenario: RoleplayScenario | null;
  onClose: () => void;
};

export function RoleplayDialog({ open, scenario, onClose }: Props) {
  if (!scenario) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h6" component="span" sx={{ display: 'block' }}>
            {scenario.title}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <Label variant="soft" color="default">
              {scenario.language}
            </Label>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Goal: {scenario.goal}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <VoiceSession
          key={scenario.id}
          title={scenario.title}
          persona={scenario.persona}
          phases={scenario.phases}
          script={SCRIPTS[scenario.id] ?? []}
          agentKey={AGENT_KEYS[scenario.id]}
        />
      </DialogContent>
    </Dialog>
  );
}
