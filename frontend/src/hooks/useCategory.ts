"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { getAccessToken } from "@/src/lib/auth-session";
import { getCurrentUser } from "@/src/lib/auth";
import {
  allCategory,
  createCategory,
  getCategory,
  updateCategory,
} from "@/src/lib/category";

import type { AuthUser } from "@/src/types/auth";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/src/types/category";

// React Query keys.
export const categoryKeys = {
  all: ["categories"] as const,

  list: (isAdmin: boolean) =>
    ["categories", "list", isAdmin ? "admin" : "public"] as const,

  detail: (slug: string, isAdmin: boolean) =>
    ["categories", "detail", isAdmin ? "admin" : "public", slug] as const,
};

export const authKeys = {
  me: ["auth", "me"] as const,
};

// Fetch the authenticated user from Django.
export function useCurrentUser() {
  return useQuery<AuthUser, Error>({
    queryKey: authKeys.me,

    queryFn: async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("Please sign in.");
      }

      return getCurrentUser();
    },

    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

// Call after login or when the authenticated user changes.
export async function refreshCurrentUser(
  queryClient: QueryClient,
  user?: AuthUser,
) {
  if (user) {
    queryClient.setQueryData(authKeys.me, user);
  } else if (getAccessToken()) {
    await queryClient.invalidateQueries({
      queryKey: authKeys.me,
    });
  } else {
    queryClient.setQueryData(authKeys.me, undefined);
  }

  await queryClient.invalidateQueries({
    queryKey: categoryKeys.all,
  });
}
export async function clearFrontendAuthState(queryClient: QueryClient) {
  queryClient.setQueryData(authKeys.me, undefined);

  await queryClient.cancelQueries({
    queryKey: categoryKeys.all,
  });

  queryClient.removeQueries({
    queryKey: categoryKeys.all,
  });
}
// Fetch categories.
// Django remains responsible for deciding which categories
// the authenticated user is allowed to access.
export function useCategories(isAdmin = false) {
  return useQuery({
    queryKey: categoryKeys.list(isAdmin),
    queryFn: allCategory,
  });
}

// Fetch one category.
export function useCategory(slug: string, isAdmin = false) {
  return useQuery({
    queryKey: categoryKeys.detail(slug, isAdmin),
    queryFn: () => getCategory(slug),
    enabled: Boolean(slug),
  });
}

// Create a category.
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),

    onSuccess: async (category) => {
      queryClient.setQueryData(
        categoryKeys.detail(category.slug, true),
        category,
      );

      await queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
    },
  });
}

// Update a category, including its active status.
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      input,
    }: {
      slug: string;
      input: UpdateCategoryInput;
    }) => updateCategory(slug, input),

    onSuccess: async (category) => {
      queryClient.setQueryData(
        categoryKeys.detail(category.slug, true),
        category,
      );

      queryClient.setQueryData(
        categoryKeys.detail(category.slug, false),
        category,
      );

      await queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
    },
  });
}
