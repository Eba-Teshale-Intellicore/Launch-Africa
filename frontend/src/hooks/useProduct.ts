"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  allProducts,
  createProduct,
  getProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  updateProductImage,
} from "@/src/lib/product";

import type {
  CreateProductInput,
  UpdateProductInput,
  UploadProductImageInput,
} from "@/src/types/product";

export const productKeys = {
  all: ["products"] as const,
  lists: () => ["products", "list"] as const,
  list: (view: string) => ["products", "list", view] as const,
  detail: (slug: string) => ["products", "detail", slug] as const,
};

export function useProducts(view = "public") {
  return useQuery({
    queryKey: productKeys.list(view),
    queryFn: allProducts,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),

    onSuccess: async (product) => {
      queryClient.setQueryData(productKeys.detail(product.slug), product);

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      input,
    }: {
      slug: string;
      input: UpdateProductInput;
    }) => updateProduct(slug, input),

    onSuccess: async (product) => {
      queryClient.setQueryData(productKeys.detail(product.slug), product);

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      input,
    }: {
      slug: string;
      input: UploadProductImageInput;
    }) => uploadProductImage(slug, input),

    onSuccess: async (_image, variables) => {
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.slug),
      });

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, imageId }: { slug: string; imageId: string }) =>
      deleteProductImage(slug, imageId),

    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.slug),
      });

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}

export function useUpdateProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      imageId,
      input,
    }: {
      slug: string;
      imageId: string;
      input: {
        alt_text?: string;
        display_order?: number;
        is_primary?: boolean;
      };
    }) => updateProductImage(slug, imageId, input),

    onSuccess: async (_image, variables) => {
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.slug),
      });

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}
