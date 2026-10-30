export interface ProductSearchResult {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  logo_url: string | null;
  category_name: string;
  category_slug: string;
}

export interface CategorySearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string | null;
}

export interface BuilderSearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
}

export interface GlobalSearchResponse {
  query: string;
  products: ProductSearchResult[];
  categories: CategorySearchResult[];
  builders: BuilderSearchResult[];
}
