'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { MessageContent } from './message-content';

// ----------------------------------------------------------------------


// EN: AI analyst :  FAB + chat drawer streaming Gemini analysis over the
//     platform data via /api/analyse.
// ----------------------------------------------------------------------

const LAB_ORANGE = '#F29100';
const DRAWER_WIDTH = 420;

const SUGGESTIONS = [
  'Where is the largest price spread?',
  'Is internal supply worthwhile for Slovenia?',
  'Which suppliers can deliver directly?',
  'Summarise the pain points from the RFI conversations',
];

type ChatMessage = { role: 'user' | 'model'; text: string };

function SparkleIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5c.35 0 .66.22.77.55l1.52 4.42a3.5 3.5 0 0 0 2.17 2.17l4.42 1.52a.81.81 0 0 1 0 1.54l-4.42 1.52a3.5 3.5 0 0 0-2.17 2.17l-1.52 4.42a.81.81 0 0 1-1.54 0l-1.52-4.42a3.5 3.5 0 0 0-2.17-2.17L3.12 12.7a.81.81 0 0 1 0-1.54l4.42-1.52a3.5 3.5 0 0 0 2.17-2.17l1.52-4.42a.81.81 0 0 1 .77-.55Z" />
      <path d="M19.5 1.75c.16 0 .3.1.35.25l.5 1.45c.14.4.45.71.85.85l1.45.5a.37.37 0 0 1 0 .7l-1.45.5c-.4.14-.71.45-.85.85l-.5 1.45a.37.37 0 0 1-.7 0l-.5-1.45a1.6 1.6 0 0 0-.85-.85l-1.45-.5a.37.37 0 0 1 0-.7l1.45-.5c.4-.14.71-.45.85-.85l.5-1.45a.37.37 0 0 1 .35-.25Z" />
    </svg>
  );
}

// ----------------------------------------------------------------------

export function KiAnalyst() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || streaming) return;

      setError(null);
      setInput('');
      const history: ChatMessage[] = [...messages, { role: 'user', text: q }];
      setMessages([...history, { role: 'model', text: '' }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const appendToLast = (text: string) =>
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          next[lastIdx] = { ...next[lastIdx], text: next[lastIdx].text + text };
          return next;
        });

      try {
        const res = await fetch('/api/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => '');
          throw new Error(detail || `Error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          if (text) appendToLast(text);
        }
        const rest = decoder.decode();
        if (rest) appendToLast(rest);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Unbekannter Error.');
          // Leere Modell-Blase wieder entfernen.
          setMessages((prev) =>
            prev.length && prev[prev.length - 1].role === 'model' && !prev[prev.length - 1].text
              ? prev.slice(0, -1)
              : prev
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming]
  );

  const empty = messages.length === 0;

  return (
    <>
      <Tooltip title="AI-Analyst" placement="left">
        <Fab
          onClick={() => setOpen(true)}
          aria-label="Open AI analyst"
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: (theme) => theme.zIndex.drawer - 1,
            color: '#fff',
            bgcolor: LAB_ORANGE,
            '&:hover': { bgcolor: '#d47f00' },
          }}
        >
          <SparkleIcon />
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: DRAWER_WIDTH }, display: 'flex' },
          },
        }}
      >
        
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ px: 2.5, py: 2, borderBottom: (theme) => `1px dashed ${theme.palette.divider}` }}
        >
          <Box sx={{ color: LAB_ORANGE, display: 'inline-flex' }}>
            <SparkleIcon size={22} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              AI-Analyst
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              Live analysis of baseline, products and supply routes
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} aria-label="Close" size="small">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z" />
            </svg>
          </IconButton>
        </Stack>

        
        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          {empty && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ask the platform data directly: the analyst uses figures from
                baseline, deep analysis, product aggregation and system comparison.
              </Typography>
              <Stack spacing={1} alignItems="flex-start">
                {SUGGESTIONS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    variant="outlined"
                    onClick={() => ask(s)}
                    sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          <Stack spacing={1.5}>
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              const isStreamingBubble = !isUser && streaming && i === messages.length - 1;
              return (
                <Box
                  key={i}
                  sx={{
                    maxWidth: isUser ? '85%' : '100%',
                    alignSelf: isUser ? 'flex-end' : 'stretch',
                    px: isUser ? 1.5 : 0,
                    py: isUser ? 1 : 0,
                    borderRadius: 1.5,
                    bgcolor: isUser ? 'rgba(242,145,0.0.12)' : 'transparent',
                  }}
                >
                  {isUser ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {m.text}
                    </Typography>
                  ) : (
                    <>
                      <MessageContent content={m.text} />
                      {isStreamingBubble && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                          <CircularProgress size={13} sx={{ color: LAB_ORANGE }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            analysiert …
                          </Typography>
                        </Stack>
                      )}
                    </>
                  )}
                </Box>
              );
            })}
          </Stack>

          {error && (
            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'error.main' }}>
              {error}
            </Typography>
          )}
        </Box>

        
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          sx={{ px: 2, py: 1.5, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              size="small"
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Ask a question about the data…"
              disabled={streaming}
            />
            <IconButton
              type="submit"
              aria-label="Send"
              disabled={streaming || !input.trim()}
              sx={{
                color: '#fff',
                bgcolor: LAB_ORANGE,
                '&:hover': { bgcolor: '#d47f00' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3.4 20.4 20.85 12.9a1 1 0 0 0 0-1.8L3.4 3.6a.9.9 0 0 0-1.25 1.06L4 11l9 1-9 1-1.85 6.34a.9.9 0 0 0 1.25 1.06Z" />
              </svg>
            </IconButton>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
