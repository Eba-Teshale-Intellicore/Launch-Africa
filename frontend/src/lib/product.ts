import api from "@/src/lib/api";

import type {
  Product,
  ProductImage,
  CreateProductInput,
  UpdateProductInput,
  UploadProductImageInput,
  UploadProductLogoInput,
} from "@/src/types/product";

// GET /api/v1/products/
export async function allProducts(): Promise<Product[]> {
  const res = await api.get<Product[]>("/products/");
  return res.data;
}

// POST /api/v1/products/
export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const res = await api.post<Product>("/products/", input);
  return res.data;
}

// GET /api/v1/products/<slug>/
export async function getProduct(slug: string): Promise<Product> {
  const res = await api.get<Product>(`/products/${encodeURIComponent(slug)}/`);

  return res.data;
}

// PATCH /api/v1/products/<slug>/
export async function updateProduct(
  slug: string,
  input: UpdateProductInput,
): Promise<Product> {
  const res = await api.patch<Product>(
    `/products/${encodeURIComponent(slug)}/`,
    input,
  );

  return res.data;
}

// POST /api/v1/products/<slug>/logo/
export async function uploadProductLogo(
  slug: string,
  input: UploadProductLogoInput,
): Promise<Product> {
  const formData = new FormData();

  formData.append("logo", input.file);

  const res = await api.post<Product>(
    `/products/${encodeURIComponent(slug)}/logo/`,
    formData,
  );

  return res.data;
}

// POST /api/v1/products/<slug>/images/
export async function uploadProductImage(
  slug: string,
  input: UploadProductImageInput,
): Promise<ProductImage> {
  const formData = new FormData();

  // Django uploads this file to Cloudinary.
  formData.append("image", input.file);
  formData.append("alt_text", input.alt_text);

  const res = await api.post<ProductImage>(
    `/products/${encodeURIComponent(slug)}/images/`,
    formData,
  );

  return res.data;
}

// DELETE /api/v1/products/<slug>/images/<imageId>/
export async function deleteProductImage(
  slug: string,
  imageId: string,
): Promise<void> {
  await api.delete(
    `/products/${encodeURIComponent(slug)}/images/${encodeURIComponent(imageId)}/`,
  );
}

// PATCH /api/v1/products/<slug>/images/<imageId>/
export async function updateProductImage(
  slug: string,
  imageId: string,
  input: Partial<
    Pick<ProductImage, "alt_text" | "display_order" | "is_primary">
  >,
): Promise<ProductImage> {
  const res = await api.patch<ProductImage>(
    `/products/${encodeURIComponent(slug)}/images/${encodeURIComponent(imageId)}/`,
    input,
  );

  return res.data;
}
