export type ProductStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "archived";

export interface ProductImage {
  id: string;
  product: string;
  public_id: string;
  secure_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  owner: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  website_url: string;
  demo_url: string;
  category: string | ProductCategory | null;
  category_id?: string;
  status: ProductStatus;
  logo_url: string;
  country: string;
  languages: string[];
  images: ProductImage[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  title: string;
  tagline: string;
  description: string;
  website_url: string;
  demo_url?: string;
  category_id: string;
  country?: string;
  languages?: string[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface UploadProductLogoInput {
  file: File;
}

export interface UploadProductImageInput {
  file: File;
  alt_text: string;
  display_order?: number;
  is_primary?: boolean;
}
