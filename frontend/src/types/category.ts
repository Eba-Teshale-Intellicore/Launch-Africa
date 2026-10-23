export interface Category {
  id: string;
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

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon_name?: string;
  display_order?: number;
  is_active?: boolean;
}
