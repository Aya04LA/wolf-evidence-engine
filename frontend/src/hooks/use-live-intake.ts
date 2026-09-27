'use client';





import type { LiveIntakeEntry } from 'src/data/live-intake';

import { useState, useEffect } from 'react';

import { liveIntakeQueue } from 'src/data/live-intake';

// ----------------------------------------------------------------------

export type LiveFeedStatus = 'eingegangen' | 'structured';

export type LiveFeedEntry = LiveIntakeEntry & {
  /** Eindeutiger React-Key (id + Durchlauf) */
  key: string;
  status: LiveFeedStatus;
};

export type UseLiveIntakeReturn = {
  feed: LiveFeedEntry[];
  extraSubmissions: number;
  latestIso: string | null;
};

const STRUCTURE_DELAY_MS = 3500;
const MAX_FEED_LENGTH = 5;

export function useLiveIntake(): UseLiveIntakeReturn {
  const [feed, setFeed] = useState<LiveFeedEntry[]>([]);
  const [extraSubmissions, setExtraSubmissions] = useState(0);
  const [latestIso, setLatestIso] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window) || !liveIntakeQueue.length) {
      return undefined;
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    let timers: ReturnType<typeof setTimeout>[] = [];
    let running = false;
    let index = 0;
    let cycle = 0;

    const clearTimers = () => {
      timers.forEach((t) => clearTimeout(t));
      timers = [];
    };

    const scheduleNext = () => {
      const entry = liveIntakeQueue[index % liveIntakeQueue.length];
      const key = `${entry.id}-${cycle}`;

      timers.push(
        setTimeout(() => {
          setFeed((prev) =>
            [{ ...entry, key, status: 'eingegangen' as const }, ...prev].slice(0, MAX_FEED_LENGTH)
          );
          setExtraSubmissions((n) => n + 1);
          setLatestIso(entry.iso);

          timers.push(
            setTimeout(() => {
              setFeed((prev) =>
                prev.map((f) => (f.key === key ? { ...f, status: 'structured' as const } : f))
              );
            }, STRUCTURE_DELAY_MS)
          );

          index += 1;
          if (index % liveIntakeQueue.length === 0) cycle += 1;
          scheduleNext();
        }, entry.delayMs)
      );
    };

    const start = () => {
      if (running) return;
      running = true;
      scheduleNext();
    };

    const stop = () => {
      running = false;
      clearTimers();
    };

    const sync = () => {
      if (mql.matches) stop();
      else start();
    };

    sync();
    mql.addEventListener('change', sync);

    return () => {
      stop();
      mql.removeEventListener('change', sync);
    };
  }, []);

  return { feed, extraSubmissions, latestIso };
}
