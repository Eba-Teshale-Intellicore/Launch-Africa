import { apiGet } from "./api";
import type { Category } from "@/types/category";

export function getCategories() {
  return apiGet<Category[]>("/categories/");
}
