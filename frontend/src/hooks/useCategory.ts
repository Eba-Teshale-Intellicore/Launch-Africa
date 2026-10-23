"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  allCategory,
  createCategory,
  getCategory,
  updateCategory,
} from "@/src/lib/category";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/src/types/category";

import api from "@/src/lib/api";
import { getAccessToken } from "@/src/lib/auth-session";
import type { AuthUser } from "@/src/types/auth";

// React Query keys.
export const categoryKeys = {
  all: ["categories"] as const,

  list: (isAdmin: boolean) =>
    ["categories", isAdmin ? "admin" : "public"] as const,

  detail: (slug: string) => ["categories", "detail", slug] as const,
};

export const authKeys = {
  me: ["auth", "me"] as const,
};

// Fetch the authenticated user.
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,

    queryFn: async (): Promise<AuthUser> => {
      const token = getAccessToken();

      if (!token) {
        throw new Error("No access token found. Please log in.");
      }

      const response = await api.get<AuthUser>("/auth/me/");
      return response.data;
    },

    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// Call after successfully saving login tokens.
// Pass the user object returned by the login API.
export async function refreshCurrentUser(
  queryClient: ReturnType<typeof useQueryClient>,
  user?: AuthUser,
) {
  if (user) {
    queryClient.setQueryData(authKeys.me, user);
  } else {
    await queryClient.invalidateQueries({
      queryKey: authKeys.me,
    });
  }

  await queryClient.invalidateQueries({
    queryKey: categoryKeys.all,
  });
}

// Fetch categories.
// Backend permissions determine which categories are returned.
export function useCategories(isAdmin = false) {
  return useQuery({
    queryKey: categoryKeys.list(isAdmin),
    queryFn: allCategory,
  });
}

// Fetch one category.
export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => getCategory(slug),
    enabled: Boolean(slug),
  });
}

// Create a category.
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),

    onSuccess: (category) => {
      queryClient.setQueryData(categoryKeys.detail(category.slug), category);

      return queryClient.invalidateQueries({
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

    onSuccess: (category, variables) => {
      queryClient.setQueryData(categoryKeys.detail(variables.slug), category);

      queryClient.setQueryData(categoryKeys.detail(category.slug), category);

      return queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
    },
  });
}
