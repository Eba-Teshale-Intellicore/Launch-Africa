"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { globalSearch } from "@/src/lib/discovery";

export const searchKeys = {
  all: ["discovery"] as const,
  global: (query: string) => ["discovery", "global", query] as const,
};

export function useGlobalSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return useQuery({
    queryKey: searchKeys.global(debouncedQuery),
    queryFn: () => globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
    retry: false,
  });
}
