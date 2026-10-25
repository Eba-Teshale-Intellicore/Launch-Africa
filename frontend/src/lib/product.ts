import api from "@/src/lib/api";

import type {
  Product,
  ProductImage,
  CreateProductInput,
  UpdateProductInput,
  UploadProductImageInput,
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

export async function uploadProductImage(
  slug: string,
  input: UploadProductImageInput,
): Promise<ProductImage> {
  const formData = new FormData();

  // "image" must match the field name expected by Django.
  formData.append("image", input.file);
  formData.append("alt_text", input.alt_text);

  if (input.display_order !== undefined) {
    formData.append("display_order", String(input.display_order));
  }

  if (input.is_primary !== undefined) {
    formData.append("is_primary", String(input.is_primary));
  }

  const res = await api.post<ProductImage>(
    `/products/${encodeURIComponent(slug)}/images/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return res.data;
}

export async function deleteProductImage(
  slug: string,
  imageId: string,
): Promise<void> {
  await api.delete(
    `/products/${encodeURIComponent(slug)}/images/${encodeURIComponent(imageId)}/`,
  );
}

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
