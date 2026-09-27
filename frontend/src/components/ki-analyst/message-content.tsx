'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { ChartBlock, tryParseChart } from './chart-block';

// ----------------------------------------------------------------------



// EN: Renders an analyst answer: chart fences as diagrams, the rest as
//     markdown-light text (paragraphs, bold, lists) without extra deps.
// ----------------------------------------------------------------------

type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'chart'; json: string }
  | { kind: 'chart-pending' };

const CHART_FENCE = /```chart\s*([\s\S]*?)```/g;

function splitSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  CHART_FENCE.lastIndex = 0;
  while ((m = CHART_FENCE.exec(content)) !== null) {
    if (m.index > last) segments.push({ kind: 'text', text: content.slice(last, m.index) });
    segments.push({ kind: 'chart', json: m[1] });
    last = m.index + m[0].length;
  }
  let tail = content.slice(last);
  
  const open = tail.search(/```chart/);
  if (open >= 0) {
    if (open > 0) segments.push({ kind: 'text', text: tail.slice(0, open) });
    segments.push({ kind: 'chart-pending' });
    tail = '';
  }
  if (tail) segments.push({ kind: 'text', text: tail });
  return segments;
}

// Inline: **fett** hervorheben.
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <Box key={i} component="strong" sx={{ fontWeight: 700 }}>
        {p}
      </Box>
    ) : (
      p
    )
  );
}

function TextBlock({ text }: { text: string }) {
  
  const lines = text.split('\n');
  const blocks: { kind: 'p' | 'ul' | 'h'; lines: string[] }[] = [];

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ kind: 'p', lines: [] });
      return;
    }
    const isLi = /^[-*•]\s+/.test(trimmed);
    const isH = /^#{1,4}\s+/.test(trimmed);
    const prev = blocks[blocks.length - 1];
    if (isLi) {
      if (prev && prev.kind === 'ul') prev.lines.push(trimmed.replace(/^[-*•]\s+/, ''));
      else blocks.push({ kind: 'ul', lines: [trimmed.replace(/^[-*•]\s+/, '')] });
    } else if (isH) {
      blocks.push({ kind: 'h', lines: [trimmed.replace(/^#{1,4}\s+/, '')] });
    } else if (prev && prev.kind === 'p' && prev.lines.length > 0) {
      prev.lines.push(trimmed);
    } else {
      blocks.push({ kind: 'p', lines: [trimmed] });
    }
  });

  return (
    <>
      {blocks
        .filter((b) => b.lines.length > 0)
        .map((b, i) => {
          if (b.kind === 'ul') {
            return (
              <Box key={i} component="ul" sx={{ my: 0.5, pl: 2.25, listStyle: 'disc' }}>
                {b.lines.map((li, j) => (
                  <Typography key={j} component="li" variant="body2" sx={{ mb: 0.25 }}>
                    {renderInline(li)}
                  </Typography>
                ))}
              </Box>
            );
          }
          if (b.kind === 'h') {
            return (
              <Typography key={i} variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
                {renderInline(b.lines[0])}
              </Typography>
            );
          }
          return (
            <Typography key={i} variant="body2" sx={{ my: 0.5, whiteSpace: 'pre-wrap' }}>
              {renderInline(b.lines.join('\n'))}
            </Typography>
          );
        })}
    </>
  );
}

// ----------------------------------------------------------------------

export function MessageContent({ content }: { content: string }) {
  const segments = splitSegments(content);

  return (
    <Box sx={{ minWidth: 0, '& > :first-of-type': { mt: 0 }, '& > :last-child': { mb: 0 } }}>
      {segments.map((seg, i) => {
        if (seg.kind === 'chart') {
          const spec = tryParseChart(seg.json);
          return spec ? (
            <ChartBlock key={i} spec={spec} />
          ) : (
            <Typography key={i} variant="caption" sx={{ color: 'text.disabled' }}>
              [Chart could not be read]
            </Typography>
          );
        }
        if (seg.kind === 'chart-pending') {
          return (
            <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
              <CircularProgress size={14} sx={{ color: '#F29100' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Diagramm is erstellt …
              </Typography>
            </Stack>
          );
        }
        return <TextBlock key={i} text={seg.text} />;
      })}
    </Box>
  );
}
