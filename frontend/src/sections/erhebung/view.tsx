'use client';

import type { ChannelId } from './channel-cards';
import type { VoiceLine } from 'src/components/voice-session';
import type { TranscriptLine, StructuredResult } from './structurer';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { totals, countries, roleplayScenarios, intakeSubmissions } from 'src/data/platform';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { VoiceSession } from 'src/components/voice-session';

import { DEMO_SCRIPT } from './demo-script';
import { ChannelCards } from './channel-cards';
import { structureTranscript } from './structurer';
import { SubmissionCard } from './submission-card';
import { LiveStructuring } from './live-structuring';

// ----------------------------------------------------------------------

const bedarfScenario = roleplayScenarios.find((s) => s.id === 'rp-bedarf');


const languageCount = new Set(countries.flatMap((c) => c.language.split(' / '))).size;

const HERO_FACTS = [
  `${countries.length} Markets`,
  `${languageCount} Languages`,
  '3 channels',
  'AI structuring',
];


const pillSx = { px: 2.5, borderRadius: 5 } as const;


const CHANNEL_SUBMISSION: Record<ChannelId, string> = {
  foto: 'sub-wolf-002',
  lieferschein: 'sub-wolf-003',
  whatsapp: 'sub-wolf-004',
};

const pendingMarkets = countries.filter((c) => c.intakeStatus === 'pending');

const EMPTY_RESULT: StructuredResult = { items: [], painPoints: [] };


const STRUCTURE_DEBOUNCE_MS = 500;

// Demo-Foliensprache: Titel BOLD UPPERCASE in Orange + orangefarbene Linie
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="h5"
        sx={{ color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {title}
      </Typography>
      <Box sx={{ height: 3, width: 1, bgcolor: 'primary.main' }} />
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export function ErhebungView() {
  const [structured, setStructured] = useState<StructuredResult>(EMPTY_RESULT);
  const [ended, setEnded] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const sessionRef = useRef<HTMLDivElement>(null);
  const submissionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  const linesRef = useRef<TranscriptLine[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);
  
  const apiUnavailable = useRef(false);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    []
  );

  
  
  const runStructuring = useCallback(async () => {
    const lines = [...linesRef.current];
    if (lines.length === 0) return;
    const seq = ++requestSeq.current;

    if (!apiUnavailable.current) {
      try {
        const res = await fetch('/api/erhebung/structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines }),
        });
        if (res.status === 503) {
          apiUnavailable.current = true;
        } else if (res.ok) {
          const data = (await res.json()) as Partial<StructuredResult>;
          if (seq === requestSeq.current) {
            setStructured({ items: data.items ?? [], painPoints: data.painPoints ?? [] });
          }
          return;
        }
      } catch {
        // Netzwerk-/Serverfehler → lokaler Fallback
      }
    }

    if (seq === requestSeq.current) {
      setStructured(structureTranscript(lines));
    }
  }, []);

  const handleLine = useCallback(
    (line: VoiceLine, index: number) => {
      if (index === 0) {
        
        linesRef.current = [];
        requestSeq.current += 1;
        setStructured(EMPTY_RESULT);
        setEnded(false);
      }
      linesRef.current = [...linesRef.current, { role: line.role, text: line.text }];
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(runStructuring, STRUCTURE_DEBOUNCE_MS);
    },
    [runStructuring]
  );

  const handleEnded = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    runStructuring();
    setEnded(true);
  }, [runStructuring]);

  const handleSelectChannel = useCallback((channel: ChannelId) => {
    const submissionId = CHANNEL_SUBMISSION[channel];
    submissionRefs.current[submissionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(submissionId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightedId(null), 2000);
  }, []);

  const scrollToSession = useCallback(() => {
    sessionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  
  const renderHero = () => (
    <Card sx={{ p: { xs: 4, md: 6 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ color: 'primary.main', textTransform: 'uppercase' }}
          >
            Report demand as easily as sending a voice message
          </Typography>
        </Box>
        <Box sx={{ height: 4, width: 1, bgcolor: 'primary.main' }} />
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
          Voice, photos or delivery notes: each of the {countries.length} Demo retail markets
          reports in English. The demo structures the intake into the standard list
          with {totals.sortimentArtikel.toLocaleString('en-GB')} items.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {HERO_FACTS.map((fact) => (
            <Label key={fact} variant="soft" color="default">
              {fact}
            </Label>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={scrollToSession}
            startIcon={<Iconify icon="solar:play-circle-bold" />}
            sx={pillSx}
          >
            Start live demo
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.root}
            variant="outlined"
            color="inherit"
            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
            sx={pillSx}
          >
            View results in the overview
          </Button>
        </Box>
      </Box>
    </Card>
  );

  
  const renderFooter = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 10, height: 10, flexShrink: 0, bgcolor: 'primary.main' }} />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Synthetic hackathon demo · Luxury car manufacturer (fictional) — Materials tender Body and paint
      </Typography>
    </Box>
  );

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {renderHero()}

        
        <Box
          ref={sessionRef}
          sx={{
            gap: 3,
            display: 'grid',
            alignItems: 'stretch',
            scrollMarginTop: 88,
            gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          }}
        >
          <Box sx={{ minWidth: 0, gap: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', '& > *': { flex: 1 } }}>
              <VoiceSession
                title="Intake: South demo workshop"
                persona="Lab Voice: English demonstration conversation"
                phases={bedarfScenario?.phases ?? []}
                script={DEMO_SCRIPT}
                onLine={handleLine}
                onEnded={handleEnded}
              />
            </Box>
            <Label
              variant="soft"
              color="default"
              startIcon={<Iconify icon="solar:chat-round-dots-bold" />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Demo script and display: English
            </Label>
          </Box>
          <LiveStructuring
            items={structured.items}
            painPoints={structured.painPoints}
            ended={ended}
          />
        </Box>

        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SectionTitle
            title="Other channels"
            subtitle="Every channel feeds the same standard list, with no forms or spreadsheets."
          />
          <ChannelCards onSelectChannel={handleSelectChannel} />
        </Box>

        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <SectionTitle title="Received submissions" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Label variant="soft" color="primary">
                {totals.submissions.toLocaleString('en-GB')} from{' '}
                {totals.submissionTarget.toLocaleString('en-GB')} submissions worldwide
              </Label>
              {pendingMarkets.map((market) => (
                <Label key={market.iso} variant="soft" color="warning">
                  {market.name} pending
                </Label>
              ))}
              <Link
                component={RouterLink}
                href={paths.dashboard.root}
                variant="caption"
                underline="always"
                sx={{ color: 'text.secondary' }}
              >
                View all markets
              </Link>
            </Box>
            <LinearProgress
              variant="determinate"
              color="primary"
              value={(totals.submissions / totals.submissionTarget) * 100}
              sx={{ height: 6, maxWidth: 360, borderRadius: 1, bgcolor: 'grey.300' }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {intakeSubmissions.map((submission) => (
              <Box
                key={submission.id}
                ref={(node: HTMLDivElement | null) => {
                  submissionRefs.current[submission.id] = node;
                }}
                sx={{ scrollMarginTop: 88 }}
              >
                <SubmissionCard
                  submission={submission}
                  highlighted={highlightedId === submission.id}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {renderFooter()}
      </Box>
    </DashboardContent>
  );
}
