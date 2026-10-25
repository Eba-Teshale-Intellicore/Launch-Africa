"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useCategories } from "@/src/hooks/useCategory";
import { useCreateProduct } from "@/src/hooks/useProduct";
import type { CreateProductInput } from "@/src/types/product";
import type { ApiErrorBody } from "@/src/types/auth";

const productSchema = z.object({
  title: z.string().trim().min(3).max(200),
  tagline: z.string().trim().min(5).max(300),
  description: z.string().trim().min(20).max(10000),
  website_url: z.string().trim().url("Enter a valid website URL."),
  demo_url: z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid demo URL."),
  ]),
  category_id: z.string().min(1, "Choose a category."),
  country: z.string().trim().max(100),
});

type ProductFormValues = z.infer<typeof productSchema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (error.response?.status === 401) {
      return "Please sign in to create a product.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to create this product.";
    }

    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
      const messages = Object.values(data).flatMap((value) =>
        Array.isArray(value)
          ? value.filter((item): item is string => typeof item === "string")
          : typeof value === "string"
            ? [value]
            : [],
      );

      if (messages.length) return messages.join(" ");
    }

    if (!error.response) {
      return "Cannot reach the server. Check your Django backend.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Could not create the product. Please try again.";
}

export default function CreateProductForm() {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const {
    data: categories,
    isPending: categoriesLoading,
    isError: categoriesError,
  } = useCategories(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      tagline: "",
      description: "",
      website_url: "",
      demo_url: "",
      category_id: "",
      country: "",
    },
  });

  async function onSubmit(values: ProductFormValues) {
    const payload: CreateProductInput = {
      title: values.title,
      tagline: values.tagline,
      description: values.description,
      website_url: values.website_url,
      demo_url: values.demo_url || undefined,
      category_id: values.category_id,
      country: values.country || undefined,
    };

    try {
      const product = await createMutation.mutateAsync(payload);
      router.push(`/products/${encodeURIComponent(product.slug)}`);
    } catch {
      // The mutation error is displayed below.
    }
  }

  return (
    <section className="bg-card border-line rounded-card shadow-card w-card mx-auto p-6 sm:p-8">
      <header className="mb-7 text-center">
        <p className="font-logo text-logo text-xl">LAUNCHAFRICA</p>

        <h1 className="text-main mt-4 text-2xl font-bold">
          Launch your product
        </h1>

        <p className="text-soft mt-2 text-sm leading-6">
          Introduce your product to Africa's innovation ecosystem.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="product-title"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Product name
          </label>
          <input
            id="product-title"
            {...register("title")}
            placeholder="e.g. LaunchAfrica"
            aria-invalid={Boolean(errors.title)}
            className="input-box rounded-pill px-4 py-3"
          />
          {errors.title && (
            <p className="text-error mt-1 text-sm">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-tagline"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Tagline
          </label>
          <input
            id="product-tagline"
            {...register("tagline")}
            placeholder="What makes your product useful?"
            aria-invalid={Boolean(errors.tagline)}
            className="input-box rounded-pill px-4 py-3"
          />
          {errors.tagline && (
            <p className="text-error mt-1 text-sm">{errors.tagline.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-description"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Description
          </label>
          <textarea
            id="product-description"
            {...register("description")}
            rows={5}
            placeholder="Explain the problem, solution and target users."
            aria-invalid={Boolean(errors.description)}
            className="input-box rounded-card resize-y px-4 py-3"
          />
          {errors.description && (
            <p className="text-error mt-1 text-sm">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-category"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Category
          </label>
          <select
            id="product-category"
            {...register("category_id")}
            disabled={categoriesLoading || categoriesError}
            aria-invalid={Boolean(errors.category_id)}
            className="input-box rounded-pill px-4 py-3"
          >
            <option value="">
              {categoriesLoading
                ? "Loading categories..."
                : categoriesError
                  ? "Could not load categories"
                  : "Select a category"}
            </option>

            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-error mt-1 text-sm">
              {errors.category_id.message}
            </p>
          )}
          {categoriesError && (
            <p className="text-error mt-1 text-sm">
              Please reload the page and try again.
            </p>
          )}
          {!categoriesLoading && !categoriesError && !categories?.length && (
            <p className="text-soft mt-2 text-xs">
              No active categories are available yet.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-website"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Website URL
          </label>
          <input
            id="product-website"
            {...register("website_url")}
            type="url"
            placeholder="https://example.com"
            aria-invalid={Boolean(errors.website_url)}
            className="input-box rounded-pill px-4 py-3"
          />
          {errors.website_url && (
            <p className="text-error mt-1 text-sm">
              {errors.website_url.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-demo"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Demo URL (optional)
          </label>
          <input
            id="product-demo"
            {...register("demo_url")}
            type="url"
            placeholder="https://demo.example.com"
            aria-invalid={Boolean(errors.demo_url)}
            className="input-box rounded-pill px-4 py-3"
          />
          {errors.demo_url && (
            <p className="text-error mt-1 text-sm">{errors.demo_url.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-country"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Country (optional)
          </label>
          <input
            id="product-country"
            {...register("country")}
            placeholder="Ethiopia"
            className="input-box rounded-pill px-4 py-3"
          />
        </div>

        {createMutation.isError && (
          <p
            role="alert"
            className="text-error bg-input rounded-card p-3 text-sm"
          >
            {getErrorMessage(createMutation.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={
            createMutation.isPending || categoriesLoading || !categories?.length
          }
          className="btn-main rounded-pill w-full px-4 py-3 disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating product..." : "Create product"}
        </button>

        <p className="text-soft text-xs leading-5">
          Your product's initial status is controlled by Django. Upload product
          images after creation, then follow the moderation workflow.
        </p>
      </form>
    </section>
  );
}
