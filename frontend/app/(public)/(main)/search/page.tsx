import { Suspense } from "react";
import SearchResults from "./SearchResults";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-12">Loading search...</div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
