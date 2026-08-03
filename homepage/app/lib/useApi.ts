"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiEnvelope } from "./api-types";

const STALE_AFTER_MS = 60_000;

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  lastUpdated: number | null;
  stale: boolean;
  refetch: () => void;
};

export function useApi<T>(path: string, pollMs?: number): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState<number | null>(null);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<ApiEnvelope<T>>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json.data);
        setDegraded(Boolean(json.meta.degraded));
        setLastUpdated(Date.now());
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [pollMs, refetch]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const stale = lastUpdated !== null && (now ?? Date.now()) - lastUpdated > STALE_AFTER_MS;

  return { data, loading, error, degraded, lastUpdated, stale, refetch };
}

export function timeAgo(timestamp: number | null): string {
  if (!timestamp) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
