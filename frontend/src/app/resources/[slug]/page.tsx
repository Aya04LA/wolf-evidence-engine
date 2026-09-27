import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { resourceContent } from '../resource-content';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
const fileRoutes: Record<string, string> = {
  'README.md': 'setup', 'CHALLENGE.md': 'brief', 'DATASET.md': 'dataset',
  'COMPONENTS.md': 'components', 'VALIDATION.md': 'validation', 'BRIEFING.md': 'briefing',
};

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, target] = link;
      const href = fileRoutes[target] ? `/resources/${fileRoutes[target]}/` : target;
      if (/^(https?:\/\/|\/resources\/)/.test(href)) return <a key={i} href={href}>{label}</a>;
      return <span key={i}>{label} <code>{target}</code></span>;
    }
    return part;
  });
}

// Render only the small, trusted Markdown subset used in bundled workshop docs.
// No raw HTML or user-supplied Markdown is evaluated.
function content(markdown: string): ReactNode[] {
  const lines = markdown.split('\n');
  const nodes: ReactNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith('```')) {
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      nodes.push(<pre key={i}><code>{code.join('\n')}</code></pre>);
    } else if (line.startsWith('|')) {
      const rows: string[][] = [];
      do {
        if (!/^\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim()));
        i += 1;
      } while (i < lines.length && lines[i].startsWith('|'));
      i -= 1;
      nodes.push(<div className="wolf-resource-table" key={i}><table><thead><tr>{rows[0]?.map((c,j) => <th key={j}>{inline(c)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r,j) => <tr key={j}>{r.map((c,k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody></table></div>);
    } else if (line.startsWith('# ')) nodes.push(<h1 key={i}>{inline(line.slice(2))}</h1>);
    else if (line.startsWith('## ')) nodes.push(<h2 key={i}>{inline(line.slice(3))}</h2>);
    else if (line.startsWith('### ')) nodes.push(<h3 key={i}>{inline(line.slice(4))}</h3>);
    else if (/^(\d+\. |- )/.test(line)) {
      const ordered = /^\d+\./.test(line); const items: ReactNode[] = [];
      do { items.push(<li key={i}>{inline(lines[i].replace(/^(\d+\. |- )/, ''))}</li>); i += 1; }
      while (i < lines.length && (ordered ? /^\d+\. / : /^- /).test(lines[i]));
      i -= 1; nodes.push(ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>);
    } else nodes.push(<p key={i}>{inline(line)}</p>);
  }
  return nodes;
}

export function generateStaticParams() { return Object.keys(resourceContent).map(slug => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = resourceContent[slug];
  return { title: resource ? `${resource.title} | Wolf Materials Lab` : 'Resource not found' };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = resourceContent[slug];
  if (!resource) notFound();
  return <main className="wolf-hub" lang="en"><div className="wolf-shell wolf-resource">
    <nav aria-label="Workshop resources"><Link href="/">Wolf day hub</Link><Link href="/dashboard/">Open frontend</Link><a href={`/downloads/docs/${resource.file}`} download>Download this document</a></nav>
    <article>{content(resource.markdown)}</article>
    <footer><Link href="/">Back to the workshop</Link></footer>
  </div></main>;
}
