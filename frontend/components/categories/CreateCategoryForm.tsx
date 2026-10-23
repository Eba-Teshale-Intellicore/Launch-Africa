"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { useCreateCategory } from "@/src/hooks/useCategory";
import type { ApiErrorBody } from "@/src/types/auth";
import type { CreateCategoryInput } from "@/src/types/category";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must contain at least 3 characters.")
    .max(253, "Name must not exceed 253 characters."),

  description: z.string().trim().max(5000, "Description is too long."),

  icon_name: z.enum(["Folder", "File", "House"]),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (error.response?.status === 401) {
      return "Please sign in again.";
    }

    if (error.response?.status === 403) {
      return "Only administrators can create categories.";
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.non_field_errors)) {
      return data.non_field_errors.join(" ");
    }

    if (data && typeof data === "object") {
      const messages = Object.entries(data)
        .filter(([key]) => key !== "detail" && key !== "non_field_errors")
        .flatMap(([, value]) =>
          Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string")
            : typeof value === "string"
              ? [value]
              : [],
        );

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (!error.response) {
      return "Cannot reach the server. Check that the Django backend is running.";
    }

    return "Could not create category. Please check your input.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function CreateCategoryForm() {
  const createCategory = useCreateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon_name: "Folder",
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    const payload: CreateCategoryInput = {
      name: values.name,
      description: values.description,
      icon_name: values.icon_name,
    };

    createCategory.mutate(payload, {
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <section className="bg-card border-line rounded-card shadow-card w-card mx-auto p-6 sm:p-8">
      <div className="mb-7 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="font-logo text-logo text-2xl">LAUNCHAFRICA</span>
        </div>

        <h2 className="text-main text-2xl font-bold">Create a category</h2>

        <p className="text-soft mt-2 text-sm leading-6">
          New categories require administrator activation before they appear
          publicly.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="name"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Category name
          </label>

          <input
            id="name"
            autoComplete="off"
            placeholder="Artificial Intelligence"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
            className="input-box rounded-pill w-full px-4 py-3"
          />

          {errors.name && (
            <p id="name-error" className="text-error mt-1 text-sm">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Description
          </label>

          <textarea
            id="description"
            rows={4}
            placeholder="Describe the types of projects in this category."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error" : "description-help"
            }
            {...register("description")}
            className="input-box rounded-card w-full resize-none px-4 py-3"
          />

          <p id="description-help" className="text-soft mt-2 text-xs">
            Optional — help contributors understand what fits here.
          </p>

          {errors.description && (
            <p id="description-error" className="text-error mt-1 text-sm">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="icon_name"
            className="text-main mb-2 block text-sm font-semibold"
          >
            Category icon
          </label>

          <div className="relative">
            <select
              id="icon_name"
              {...register("icon_name")}
              className="input-box rounded-pill w-full appearance-none px-4 py-3 pr-10"
            >
              <option value="Folder">Folder</option>
              <option value="File">File</option>
              <option value="House">House</option>
            </select>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-soft pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {createCategory.isSuccess && (
          <p
            role="status"
            className="text-success bg-input rounded-card p-3 text-sm"
          >
            Category created successfully. It is inactive until an administrator
            activates it.
          </p>
        )}

        {createCategory.isError && (
          <p
            role="alert"
            className="text-error bg-input rounded-card p-3 text-sm"
          >
            {getErrorMessage(createCategory.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={createCategory.isPending}
          className="btn-main rounded-pill w-full px-4 py-3"
        >
          {createCategory.isPending ? "Creating category…" : "Create category"}
        </button>
      </form>
    </section>
  );
}
