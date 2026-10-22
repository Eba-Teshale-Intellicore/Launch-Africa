export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon_name?: string;
  display_order?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
