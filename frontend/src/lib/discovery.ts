import api from "@/src/lib/api";

import type { GlobalSearchResponse } from "@/src/types/discovery";

export async function globalSearch(
  query: string,
): Promise<GlobalSearchResponse> {
  const { data } = await api.get<GlobalSearchResponse>("/search/", {
    params: { q: query },
  });

  return data;
}
