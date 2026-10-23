import api from "@/src/lib/api";

import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/src/types/category";

// GET /api/v1/categories/
export async function allCategory(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories/");
  return response.data;
}

// POST /api/v1/categories/
export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const response = await api.post<Category>("/categories/", input);

  return response.data;
}

// GET /api/v1/categories/<slug>/
export async function getCategory(slug: string): Promise<Category> {
  const response = await api.get<Category>(
    `/categories/${encodeURIComponent(slug)}/`,
  );

  return response.data;
}

// PATCH /api/v1/categories/<slug>/
export async function updateCategory(
  slug: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const response = await api.patch<Category>(
    `/categories/${encodeURIComponent(slug)}/`,
    input,
  );

  return response.data;
}
