'use client';

import type { AuditDto, StateDto, CommandResultDto } from 'src/data/evidence';

import { useRef, useState, useEffect, useCallback } from 'react';

import { evidenceApi, EvidenceApiError } from 'src/data/evidence';

// ----------------------------------------------------------------------

/** Simulated push: the screen polls the local event queue. No real source system is watched. */
const POLL_MS = 5000;

export type EvidenceNotice =
  | { kind: 'result'; result: AuditDto }
  | { kind: 'error'; message: string; issues: string[] };

export type UseEvidenceReturn = {
  state: StateDto | null;
  loading: boolean;
  notice: EvidenceNotice | null;
  clearNotice: () => void;
  /** Keys of findings that received a new version in the last command. */
  justChanged: ReadonlySet<string>;
  run: (command: () => Promise<CommandResultDto>) => Promise<CommandResultDto | null>;
  refresh: () => Promise<void>;
  setState: (s: StateDto) => void;
};

export function useEvidence(): UseEvidenceReturn {
  const [state, setState] = useState<StateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<EvidenceNotice | null>(null);
  const [justChanged, setJustChanged] = useState<ReadonlySet<string>>(new Set());
  const busy = useRef(false);

  const fail = useCallback((e: unknown) => {
    setNotice(
      e instanceof EvidenceApiError
        ? { kind: 'error', message: e.message, issues: e.issues }
        : { kind: 'error', message: 'The evidence service is unreachable.', issues: [] }
    );
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    try {
      setState(await evidenceApi.state());
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }, [fail]);

  const run = useCallback(
    async (command: () => Promise<CommandResultDto>) => {
      busy.current = true;
      try {
        const out = await command();
        setState(out.state);
        setJustChanged(new Set(out.result.changedFindings));
        setNotice({ kind: 'result', result: out.result });
        return out;
      } catch (e) {
        fail(e);
        return null;
      } finally {
        busy.current = false;
      }
    },
    [fail]
  );

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    state,
    loading,
    notice,
    clearNotice: () => setNotice(null),
    justChanged,
    run,
    refresh,
    setState,
  };
}
