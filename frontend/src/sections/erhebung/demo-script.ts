import type { VoiceLine } from 'src/components/voice-session';

// ----------------------------------------------------------------------

// Schleifscheiben P600 720 Stk, Konturenband 12 mm 32 Rollen (drei Marken





export const DEMO_SCRIPT: VoiceLine[] = [
  { role: 'ai', text: "Hello and welcome to demand intake. I will guide you through four short phases in English. First, which workshop is this, and how many colleagues work in body and paint?" },
  { role: 'user', text: "South demo workshop. We have eight people in body repair and painting." },
  { role: 'ai', text: "Thank you. Let us discuss materials. What do you use each month for paint mixing?" },
  { role: 'user', text: "Mixing cups 400 ml and cup liners with 125 micron filters, around 18 packs per month." },
  { role: 'ai', text: "Recorded: mixing cups 400 ml and a 125 micron cup system, 18 packs per month. What about abrasives?" },
  { role: 'user', text: "Sanding discs P600, 150 mm, around 720 pieces per month." },
  { role: 'ai', text: "Noted. What do you use for masking and covering?" },
  { role: 'user', text: "Fine-line tape 12 mm, about 32 rolls per month. We currently use three different brands." },
  { role: 'ai', text: "Understood: 32 rolls and three parallel brands. I will record a standardisation opportunity. How do you purchase and receive supplies?" },
  { role: 'user', text: "Almost everything comes through the regional distributor, with a two-week lead time. We have no standard abrasive catalogue." },
  { role: 'ai', text: "Both challenges recorded. Finally, what would you like from the tender?" },
  { role: 'user', text: "A standard catalogue and predictable lead times without delivery delays would be ideal." },
  { role: 'ai', text: "Thank you. Your submission is structured into 3 items and 3 challenges. It feeds the standard list." },
];
