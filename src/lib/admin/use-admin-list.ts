'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/admin/fetcher';

type ListState<T> = { key: string | null; data: T[] | null; error: boolean };

// Загрузка списков в админке с состояниями Loading / Error и перезапросом.
// setState — только в колбэках промиса и обработчиках (react-hooks/set-state-in-effect).
export function useAdminList<T>(url: string | null) {
  const [state, setState] = useState<ListState<T>>({ key: null, data: null, error: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void apiFetch<{ data: T[] }>(url)
      .then((body) => {
        if (!cancelled) setState({ key: url, data: body.data, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key: url, data: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  const reload = useCallback(() => {
    setState({ key: null, data: null, error: false });
    setTick((t) => t + 1);
  }, []);

  const fresh = state.key === url;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : false,
    loading: url !== null && (!fresh || (state.data === null && !state.error)),
    reload,
  };
}
