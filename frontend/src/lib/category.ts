import api from "@/src/lib/api";

import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/src/types/category";

// Get All Categories
export async function getProduct(): Promise<Category> {
  const res = await api.get<Category>("/categories/");
}

// Create
export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const res = await api.post<Category>("/categories/", input);
  return res.data;
}

// Read only one

export async function getProduct(slug: string): Promise<Category> {
  const res = await api.get<Category>("/categories/${slug}/");
}

// Update
export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
): Promise<Category> {
  const res = await api.put<Category>("categories/${slug}", input);
  return res.data;
}
