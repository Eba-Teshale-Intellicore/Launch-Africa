"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import CreateProductForm from "@/components/products/CreateProductForm";
import { useCurrentUser } from "@/src/hooks/useCategory";

export default function NewProductPage() {
  const router = useRouter();

  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && (!user || isError)) {
      router.replace("/login?next=%2Fproducts%2Fnew");
    }
  }, [isLoading, user, isError, router]);

  if (isLoading || !user) {
    return (
      <main className="bg-page flex min-h-screen items-center justify-center px-4">
        <p className="text-soft text-sm">Checking your authentication...</p>
      </main>
    );
  }

  return (
    <main className="bg-page min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      <div className="w-page mx-auto">
        <CreateProductForm />
      </div>
    </main>
  );
}
