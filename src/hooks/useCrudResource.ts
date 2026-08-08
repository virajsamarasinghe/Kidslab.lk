"use client";

import { useCallback, useEffect, useState } from "react";

interface UseListResourceOptions {
  /** Key in the JSON response holding the array of items. */
  itemsKey: string;
  /** Key in the JSON response holding the total count. Defaults to "total". */
  totalKey?: string;
  /** Enables `page`/`limit` query params and paginated state. Defaults to true. */
  paginated?: boolean;
  limit?: number;
  debounceMs?: number;
}

/**
 * Shared list-fetching state for admin resource pages: search (debounced),
 * pagination, loading, and error handling in one place instead of each page
 * hand-rolling its own fetch/loading/error boilerplate.
 */
export function useListResource<T>(endpoint: string, options: UseListResourceOptions) {
  const { itemsKey, totalKey = "total", paginated = true, limit = 20, debounceMs = 350 } = options;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [search, debounceMs]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (paginated) {
        params.set("page", String(page));
        params.set("limit", String(limit));
      }
      const qs = params.toString();
      const res = await fetch(`${endpoint}${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setItems(data[itemsKey] ?? []);
      setTotal(data[totalKey] ?? (data[itemsKey]?.length ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, debouncedSearch, page, limit, paginated, itemsKey, totalKey]);

  useEffect(() => { load(); }, [load]);

  return {
    items, setItems, total, page, setPage, search, setSearch, loading, error, reload: load,
    totalPages: paginated ? Math.max(1, Math.ceil(total / limit)) : 1,
  };
}
