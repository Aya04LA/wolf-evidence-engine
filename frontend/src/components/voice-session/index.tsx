'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useConversation, ConversationProvider } from '@elevenlabs/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export interface VoiceLine {
  role: 'ai' | 'user';
  text: string;
}

export interface VoiceSessionProps {
  title: string;
  persona: string;
  phases: string[];
  
  script: VoiceLine[];
  
  agentKey?: string;
  onLine?: (line: VoiceLine, index: number) => void;
  onEnded?: () => void;
}

const LAB_ORANGE = '#F29100';

function Orb({ active, speaking }: { active: boolean; speaking: boolean }) {
  return (
    <Box sx={{ position: 'relative', width: 132, height: 132, display: 'grid', placeItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={(theme) => ({
            position: 'absolute',
            inset: i * 14,
            borderRadius: '50%',
            border: `1px solid ${active ? LAB_ORANGE : theme.vars.palette.divider}`,
            opacity: active ? 0.9 - i * 0.28 : 0.6 - i * 0.15,
            animation: speaking ? `voicePulse 1.4s ease-in-out ${i * 0.18}s infinite` : 'none',
            '@keyframes voicePulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.9 - i * 0.28 },
              '50%': { transform: 'scale(1.07)', opacity: 0.35 },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          })}
        />
      ))}
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: active ? LAB_ORANGE : theme.vars.palette.grey[200],
          transition: 'background-color 200ms',
        })}
      >
        <Iconify
          icon="solar:microphone-bold"
          width={26}
          sx={(theme) => ({ color: active ? '#fff' : theme.vars.palette.text.disabled })}
        />
      </Box>
    </Box>
  );
}

export function VoiceSession(props: VoiceSessionProps) {
  
  return (
    <ConversationProvider>
      <VoiceSessionInner {...props} />
    </ConversationProvider>
  );
}

function VoiceSessionInner({
  title,
  persona,
  phases,
  script,
  agentKey = 'erhebung',
  onLine,
  onEnded,
}: VoiceSessionProps) {
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<VoiceLine[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onMessage: ({ message, source }: { message: string; source: string }) => {
      const line: VoiceLine = { role: source === 'ai' ? 'ai' : 'user', text: message };
      setLines((prev) => {
        onLine?.(line, prev.length);
        return [...prev, line];
      });
    },
    onDisconnect: () => setRunning(false),
  });

  const pushDemoLine = useCallback(
    (idx: number) => {
      if (idx >= script.length) {
        setRunning(false);
        setSpeaking(false);
        onEnded?.();
        return;
      }
      const line = script[idx];
      setSpeaking(line.role === 'ai');
      setLines((prev) => {
        onLine?.(line, prev.length);
        return [...prev, line];
      });
      setPhaseIdx(Math.min(phases.length - 1, Math.floor(((idx + 1) / script.length) * phases.length)));
      timerRef.current = setTimeout(() => pushDemoLine(idx + 1), 2400 + Math.min(line.text.length * 26, 3200));
    },
    [script, phases.length, onLine, onEnded]
  );

  const [liveMode, setLiveMode] = useState(false);

  const start = async () => {
    setLines([]);
    setPhaseIdx(0);
    setRunning(true);

    type StartOptions = Parameters<typeof conversation.startSession>[0];

    
    //    (Muster: bp-learningplattform /api/signed-url :  echter Betrieb per ELEVENLABS_API_KEY)
    try {
      const res = await fetch(`/api/voice/signed-url?agentKey=${encodeURIComponent(agentKey)}`);
      const data = (await res.json()) as { signedUrl?: string; demo?: boolean };
      if (data.signedUrl) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        conversation.startSession({ signedUrl: data.signedUrl } as StartOptions);
        setLiveMode(true);
        return;
      }
    } catch {
      // Fall back to scripted demo mode when the route is unavailable.
    }

    // 2) Scripted demo mode
    setLiveMode(false);
    pushDemoLine(0);
  };

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (liveMode) {
      try {
        conversation.endSession();
      } catch {
        // Session war ggf. nie verbunden
      }
    }
    setRunning(false);
    setSpeaking(false);
    onEnded?.();
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const isSpeaking = liveMode ? conversation.isSpeaking : speaking;

  return (
    <Card sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, overflow: 'hidden' }}>
      
      <Box
        sx={(theme) => ({
          p: 4,
          gap: 2,
          display: 'flex',
          width: { lg: 320 },
          flexShrink: 0,
          alignItems: 'center',
          flexDirection: 'column',
          bgcolor: theme.vars.palette.grey[100],
          borderRight: { lg: `1px solid ${theme.vars.palette.divider}` },
          borderBottom: { xs: `1px solid ${theme.vars.palette.divider}`, lg: 'none' },
        })}
      >
        <Chip
          size="small"
          variant="outlined"
          color={liveMode ? 'success' : 'default'}
          icon={<Iconify icon={liveMode ? 'solar:check-circle-bold' : 'solar:play-circle-bold'} width={16} />}
          label={liveMode ? 'Live-Agent verbunden' : 'Demo-Session'}
        />
        <Orb active={running} speaking={isSpeaking} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {persona}
          </Typography>
        </Box>
        {!running ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Iconify icon="solar:microphone-bold" />}
            onClick={start}
          >
            Session starten
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            startIcon={<Iconify icon="solar:stop-circle-bold" />}
            onClick={stop}
          >
            End
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
          {phases.map((p, i) => (
            <Chip
              key={p}
              size="small"
              label={p}
              variant={i <= phaseIdx && running ? 'filled' : 'outlined'}
              color={i <= phaseIdx && running ? 'primary' : 'default'}
              sx={{ fontSize: 11 }}
            />
          ))}
        </Box>
      </Box>

      
      <Box ref={scrollRef} sx={{ flex: 1, minWidth: 0, p: 3, maxHeight: 420, overflowY: 'auto' }}>
        {lines.length === 0 ? (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', minHeight: 220 }}>
            <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center' }}>
              Start a session: the assistant guides you through the intake in English.
              <br />
              Gesprochenes is live structured.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {lines.map((l, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: l.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Box
                  sx={(theme) => ({
                    maxWidth: '82%',
                    px: 2,
                    py: 1.25,
                    borderRadius: 1.5,
                    typography: 'body2',
                    bgcolor:
                      l.role === 'user' ? theme.vars.palette.grey[200] : 'rgba(213, 0, 28, 0.06)',
                    border: `1px solid ${
                      l.role === 'user' ? theme.vars.palette.divider : 'rgba(213, 0, 28, 0.24)'
                    }`,
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mb: 0.25,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: l.role === 'user' ? 'text.disabled' : LAB_ORANGE,
                    }}
                  >
                    {l.role === 'user' ? 'Betrieb' : 'Wolf Voice'}
                  </Typography>
                  {l.text}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}
