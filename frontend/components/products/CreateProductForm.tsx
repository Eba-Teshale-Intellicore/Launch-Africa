"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useCategories } from "@/src/hooks/useCategory";
import { useToast } from "@/components/toast/ToastProvider";

import {
  useCreateProduct,
  useUploadProductLogo,
  useUploadProductImage,
} from "@/src/hooks/useProduct";

import type { CreateProductInput } from "@/src/types/product";
import type { ApiErrorBody } from "@/src/types/auth";

import { AFRICAN_COUNTRIES } from "@/src/constants/african-countries";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const MIN_GALLERY_IMAGES = 3;
const MAX_GALLERY_IMAGES = 5;

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const STEPS = [
  {
    number: 1,
    title: "Product details",
    description: "Introduce your product to the community.",
  },
  {
    number: 2,
    title: "Links & category",
    description: "Help people discover your product.",
  },
  {
    number: 3,
    title: "Location",
    description: "Tell us where your product is based.",
  },
  {
    number: 4,
    title: "Product gallery",
    description: "Show your product in action.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const productSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(253, "Title must not exceed 253 characters."),

  tagline: z
    .string()
    .trim()
    .min(5, "Tagline must be at least 5 characters.")
    .max(253, "Tagline must not exceed 253 characters."),

  description: z
    .string()
    .trim()
    .min(20, "Description must contain at least 20 characters.")
    .max(10000, "Description must not exceed 10,000 characters."),

  website_url: z
    .string()
    .trim()
    .min(1, "Website URL is required.")
    .url("Enter a valid website URL."),

  demo_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || z.string().url().safeParse(value).success,
      "Enter a valid demo URL.",
    ),

  category_ids: z
    .array(z.string())
    .min(1, "Choose at least one product category."),

  country: z
    .string()
    .min(1, "Choose an African country.")
    .max(100, "Country name is too long.")
    .refine(
      (country) => AFRICAN_COUNTRIES.some((item) => item.name === country),
      "Choose a valid African country.",
    ),
});

type ProductFormValues = z.infer<typeof productSchema>;

type StepNumber = 1 | 2 | 3 | 4;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (error.response?.status === 401) {
      return "Please sign in to continue.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.non_field_errors)) {
      return data.non_field_errors.join(" ");
    }

    if (data && typeof data === "object") {
      const messages = Object.entries(data).flatMap(([, value]) =>
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
      return "Cannot reach the server. Check your connection and Django backend.";
    }

    return "The request failed. Please check your input and try again.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatFileSize(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

/* -------------------------------------------------------------------------- */
/* Reusable UI components                                                     */
/* -------------------------------------------------------------------------- */

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;

  return (
    <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-error">
      <span aria-hidden="true">!</span>
      <span>{children}</span>
    </p>
  );
}

function FieldLabel({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-main"
    >
      {children}

      {optional ? (
        <span className="ml-2 font-normal text-soft">(Optional)</span>
      ) : (
        <span className="ml-1 text-error">*</span>
      )}
    </label>
  );
}

function StepIndicator({
  step,
  onStepClick,
}: {
  step: StepNumber;
  onStepClick: (step: StepNumber) => void;
}) {
  return (
    <div className="mb-8">
      <div className="mb-5 flex items-center justify-between gap-2">
        {STEPS.map((item, index) => {
          const completed = step > item.number;
          const current = step === item.number;

          return (
            <div
              key={item.number}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              <button
                type="button"
                onClick={() => {
                  if (completed) onStepClick(item.number as StepNumber);
                }}
                disabled={!completed}
                aria-current={current ? "step" : undefined}
                aria-label={`Step ${item.number}: ${item.title}`}
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-all duration-200 ${
                  completed || current
                    ? "border-yellow-500 bg-yellow-500 text-black shadow-sm"
                    : "border-line bg-input text-soft"
                } ${completed ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
              >
                {completed ? "✓" : item.number}
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={`absolute left-1/2 top-5 h-0.5 w-full ${
                    completed ? "bg-yellow-500" : "bg-line"
                  }`}
                />
              )}

              <span
                className={`mt-2 hidden text-center text-xs font-medium sm:block ${
                  current ? "text-main" : completed ? "text-main" : "text-soft"
                }`}
              >
                {item.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-input h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-yellow-500 transition-all duration-300 ease-out"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-main text-base font-semibold">
            {STEPS[step - 1].title}
          </p>
          <p className="text-soft mt-1 text-xs">
            {STEPS[step - 1].description}
          </p>
        </div>

        <span className="border-line bg-input rounded-full border px-3 py-1.5 text-xs font-medium text-soft">
          Step {step} of 4
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function CreateProductForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  /* Mutations */
  const createMutation = useCreateProduct();
  const uploadLogoMutation = useUploadProductLogo();
  const uploadImageMutation = useUploadProductImage();

  /* Categories */
  const {
    data: categories,
    isPending: categoriesLoading,
    isError: categoriesError,
  } = useCategories(false);

  /* Step state */
  const [step, setStep] = useState<StepNumber>(1);

  /* Logo state */
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");

  /* Created product */
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  /* Gallery state */
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState("");
  const [uploadedImageIndexes, setUploadedImageIndexes] = useState<number[]>(
    [],
  );
  const [galleryBusy, setGalleryBusy] = useState(false);

  const productAlreadyCreated = Boolean(createdSlug);

  const busy =
    createMutation.isPending || uploadLogoMutation.isPending || galleryBusy;

  const galleryLocked = uploadedImageIndexes.length > 0;

  /* ------------------------------------------------------------------------ */
  /* React Hook Form                                                          */
  /* ------------------------------------------------------------------------ */

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      tagline: "",
      description: "",
      website_url: "",
      demo_url: "",
      category_ids: [],
      country: "",
    },
  });

  const watchedValues = watch();
  /* ------------------------------------------------------------------------ */
  /* Image previews                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);

    setLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  useEffect(() => {
    const previews = galleryFiles.map((file) => URL.createObjectURL(file));

    setGalleryPreviews(previews);

    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [galleryFiles]);

  /* ------------------------------------------------------------------------ */
  /* Logo handlers                                                            */
  /* ------------------------------------------------------------------------ */

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;

    setLogoError("");

    if (!file) {
      setLogoFile(null);
      return;
    }

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoFile(null);
      event.currentTarget.value = "";

      const message = "Choose a PNG, JPEG, or WebP image.";

      setLogoError(message);
      showToast(message, "error");

      return;
    }

    if (file.size === 0) {
      setLogoFile(null);
      event.currentTarget.value = "";

      const message = "The selected image is empty.";

      setLogoError(message);
      showToast(message, "error");

      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoFile(null);
      event.currentTarget.value = "";

      const message = "The logo must be 5 MB or smaller.";

      setLogoError(message);
      showToast(message, "error");

      return;
    }

    setLogoFile(file);

    showToast("Product logo selected successfully.", "success");
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoError("");

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }

    showToast("Product logo removed.", "info");
  }

  /* ------------------------------------------------------------------------ */
  /* Gallery handlers                                                         */
  /* ------------------------------------------------------------------------ */

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    setGalleryError("");

    if (galleryLocked || galleryBusy) {
      return;
    }

    const files = Array.from(event.currentTarget.files ?? []);

    if (files.length < MIN_GALLERY_IMAGES) {
      setGalleryFiles([]);
      event.currentTarget.value = "";

      const message = `Please select at least ${MIN_GALLERY_IMAGES} images.`;

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    if (files.length > MAX_GALLERY_IMAGES) {
      setGalleryFiles([]);
      event.currentTarget.value = "";

      const message = `You can upload a maximum of ${MAX_GALLERY_IMAGES} images.`;

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    const invalidType = files.find(
      (file) => !ALLOWED_LOGO_TYPES.includes(file.type),
    );

    if (invalidType) {
      setGalleryFiles([]);
      event.currentTarget.value = "";

      const message = "All gallery images must be PNG, JPEG, or WebP files.";

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    const emptyFile = files.find((file) => file.size === 0);

    if (emptyFile) {
      setGalleryFiles([]);
      event.currentTarget.value = "";

      const message = "One of the selected images is empty.";

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      setGalleryFiles([]);
      event.currentTarget.value = "";

      const message = "Each gallery image must be 5 MB or smaller.";

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    setUploadedImageIndexes([]);
    setGalleryFiles(files);

    showToast(`${files.length} gallery images selected.`, "success");
  }

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  function toggleCategory(categoryId: string) {
    const currentIds = getValues("category_ids") ?? [];

    const updatedIds = currentIds.includes(categoryId)
      ? currentIds.filter((id) => id !== categoryId)
      : [...currentIds, categoryId];

    setValue("category_ids", updatedIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Step navigation                                                          */
  /* ------------------------------------------------------------------------ */

  async function handleNext() {
    setLogoError("");

    if (step === 1) {
      const valid = await trigger(["title", "tagline", "description"]);

      if (!valid) {
        showToast(
          "Please correct the product details before continuing.",
          "error",
        );
        return;
      }

      if (!logoFile) {
        const message = "A product logo is required.";

        setLogoError(message);
        showToast(message, "error");

        return;
      }

      setStep(2);
      showToast("Product details completed.", "success");

      return;
    }

    if (step === 2) {
      if (categoriesLoading || categoriesError || !categories?.length) {
        showToast("Categories are not available yet.", "error");
        return;
      }

      const valid = await trigger(["category_ids", "website_url", "demo_url"]);

      if (!valid) {
        showToast(
          "Please select at least one category and check your website and demo links.",
          "error",
        );
        return;
      }

      setStep(3);
      showToast("Links and category completed.", "success");
    }
  }

  function handleBack() {
    setLogoError("");

    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  }

  function handleStepClick(targetStep: StepNumber) {
    if (targetStep < step && !productAlreadyCreated && !busy) {
      setStep(targetStep);
      setLogoError("");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Product creation                                                         */
  /* ------------------------------------------------------------------------ */

  async function onSubmit(values: ProductFormValues) {
    if (productAlreadyCreated) {
      const message =
        "The product already exists. Retry the logo upload instead.";

      setLogoError(message);
      showToast(message, "error");

      return;
    }

    setLogoError("");

    if (!logoFile) {
      const message = "A product logo is required.";

      setLogoError(message);
      setStep(1);
      showToast(message, "error");

      return;
    }

    if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
      const message = "Choose a PNG, JPEG, or WebP image.";

      setLogoError(message);
      setStep(1);
      showToast(message, "error");

      return;
    }

    if (logoFile.size === 0 || logoFile.size > MAX_LOGO_SIZE) {
      const message = "The logo must be a valid image no larger than 5 MB.";

      setLogoError(message);
      setStep(1);
      showToast(message, "error");

      return;
    }

    const payload: CreateProductInput = {
      title: values.title,
      tagline: values.tagline,
      description: values.description,
      website_url: values.website_url,
      demo_url: values.demo_url ?? "",
      category_ids: values.category_ids,
      country: values.country,
    };

    try {
      showToast("Creating your product...", "info");

      const product = await createMutation.mutateAsync(payload);

      // Save the slug immediately to prevent duplicate product creation.
      setCreatedSlug(product.slug);

      showToast("Product created. Uploading your logo...", "success");

      try {
        await uploadLogoMutation.mutateAsync({
          slug: product.slug,
          input: { file: logoFile },
        });
      } catch (error) {
        const message = `Your product was created, but its logo upload failed. ${getErrorMessage(error)}`;

        setLogoError(message);
        showToast("Product created, but logo upload failed.", "error");

        return;
      }

      setLogoError("");
      setStep(4);

      showToast("Logo uploaded! Now add your product gallery.", "success");
    } catch (error) {
      const message = getErrorMessage(error);

      setLogoError(message);
      showToast(message, "error");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Retry logo upload                                                        */
  /* ------------------------------------------------------------------------ */

  async function retryLogoUpload() {
    if (!createdSlug || !logoFile) {
      const message = "Select a valid logo before retrying.";

      setLogoError(message);
      showToast(message, "error");

      return;
    }

    setLogoError("");

    try {
      await uploadLogoMutation.mutateAsync({
        slug: createdSlug,
        input: { file: logoFile },
      });

      setLogoError("");
      setStep(4);

      showToast("Product logo uploaded successfully.", "success");
    } catch (error) {
      const message = `Logo upload failed. ${getErrorMessage(error)}`;

      setLogoError(message);
      showToast(message, "error");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Gallery upload                                                           */
  /* ------------------------------------------------------------------------ */

  async function uploadGalleryImages() {
    if (!createdSlug) {
      const message = "Create the product before uploading gallery images.";

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    if (
      galleryFiles.length < MIN_GALLERY_IMAGES ||
      galleryFiles.length > MAX_GALLERY_IMAGES
    ) {
      const message = `Select between ${MIN_GALLERY_IMAGES} and ${MAX_GALLERY_IMAGES} images.`;

      setGalleryError(message);
      showToast(message, "error");

      return;
    }

    setGalleryError("");
    setGalleryBusy(true);

    const successfulIndexes = new Set(uploadedImageIndexes);

    try {
      for (let index = 0; index < galleryFiles.length; index += 1) {
        if (successfulIndexes.has(index)) {
          continue;
        }

        const file = galleryFiles[index];

        const altText =
          file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim() || `Product gallery image ${index + 1}`;

        await uploadImageMutation.mutateAsync({
          slug: createdSlug,
          input: {
            file,
            alt_text: altText,
            display_order: index,
            is_primary: index === 0,
          },
        });

        successfulIndexes.add(index);

        setUploadedImageIndexes(Array.from(successfulIndexes));
      }

      showToast("All product images uploaded successfully!", "success");

      router.push(`/products/${encodeURIComponent(createdSlug)}`);
    } catch (error) {
      const message = `An image could not be uploaded. ${getErrorMessage(error)} You can retry the remaining images.`;

      setGalleryError(message);
      showToast("Some images could not be uploaded. You can retry.", "error");
    } finally {
      setGalleryBusy(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Derived values                                                           */
  /* ------------------------------------------------------------------------ */

  const activeStep = STEPS[step - 1];

  const uploadedCount = uploadedImageIndexes.length;

  const galleryProgress =
    galleryFiles.length > 0
      ? Math.round((uploadedCount / galleryFiles.length) * 100)
      : 0;

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="bg-card border-line shadow-card overflow-hidden rounded-2xl border">
        {/* Header */}
        <header className="border-line border-b px-5 py-7 text-center sm:px-8 sm:py-9">
          <div className="mb-5 flex items-center justify-center">
            <span className="font-logo text-logo text-2xl font-bold tracking-tight">
              LAUNCHAFRICA
            </span>
          </div>

          <div className="mx-auto max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-500">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              PRODUCT LAUNCH
            </div>

            <h1 className="text-main text-2xl font-bold tracking-tight sm:text-3xl">
              Launch your product
            </h1>

            <p className="text-soft mx-auto mt-3 max-w-md text-sm leading-6">
              Share what you are building with Africa&apos;s innovators,
              founders, developers, and early adopters.
            </p>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {/* Progress */}
          {step !== 4 && (
            <StepIndicator step={step} onStepClick={handleStepClick} />
          )}

          {/* Gallery step heading */}
          {step === 4 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-lg font-bold text-black">
                  ✓
                </div>

                <div>
                  <p className="text-main font-semibold">
                    Product created successfully
                  </p>
                  <p className="text-soft mt-1 text-xs">
                    One final step: add your product gallery.
                  </p>
                </div>
              </div>

              <div className="bg-input h-1.5 overflow-hidden rounded-full">
                <div className="h-full w-full rounded-full bg-yellow-500" />
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-6"
          >
            {/* ============================================================ */}
            {/* STEP 1: PRODUCT DETAILS                                      */}
            {/* ============================================================ */}

            {step === 1 && (
              <div className="space-y-6">
                {/* Logo */}
                <div>
                  <FieldLabel htmlFor="product-logo">Product logo</FieldLabel>

                  <div className="border-line bg-input rounded-xl border border-dashed p-5 transition-colors hover:border-yellow-500/60 sm:p-6">
                    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                      <div className="bg-card border-line flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Selected product logo preview"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-soft">
                            <span className="text-3xl">◇</span>
                            <span className="text-xs">Logo preview</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <h3 className="text-main text-sm font-semibold">
                          Upload your product logo
                        </h3>

                        <p className="text-soft mt-2 text-xs leading-5">
                          Choose a recognizable logo that represents your
                          product. Square images work best.
                        </p>

                        <input
                          ref={logoInputRef}
                          id="product-logo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoChange}
                          disabled={productAlreadyCreated || busy}
                          aria-invalid={Boolean(logoError) || !logoFile}
                          aria-describedby="product-logo-help"
                          className="text-main mt-4 block w-full text-xs file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-black hover:file:bg-gray-200 disabled:opacity-50"
                        />

                        <p
                          id="product-logo-help"
                          className="text-soft mt-2 text-xs"
                        >
                          PNG, JPEG or WebP · Maximum 5 MB
                        </p>

                        {logoFile && !productAlreadyCreated && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            disabled={busy}
                            className="mt-3 text-xs font-medium text-error underline underline-offset-4 disabled:opacity-50"
                          >
                            Remove selected logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {logoError && !productAlreadyCreated && (
                    <FieldError>{logoError}</FieldError>
                  )}
                </div>

                {/* Product name */}
                <div>
                  <FieldLabel htmlFor="product-title">Product name</FieldLabel>

                  <input
                    id="product-title"
                    {...register("title")}
                    disabled={productAlreadyCreated || busy}
                    placeholder="e.g. LaunchAfrica"
                    aria-invalid={Boolean(errors.title)}
                    className="input-box rounded-xl px-4 py-3 transition focus:border-yellow-500"
                  />

                  <FieldError>{errors.title?.message}</FieldError>

                  <p className="text-soft mt-2 text-xs">
                    Choose a clear and memorable name for your product.
                  </p>
                </div>

                {/* Tagline */}
                <div>
                  <FieldLabel htmlFor="product-tagline">Tagline</FieldLabel>

                  <input
                    id="product-tagline"
                    {...register("tagline")}
                    disabled={productAlreadyCreated || busy}
                    placeholder="What makes your product useful?"
                    aria-invalid={Boolean(errors.tagline)}
                    className="input-box rounded-xl px-4 py-3 transition focus:border-yellow-500"
                  />

                  <FieldError>{errors.tagline?.message}</FieldError>

                  <p className="text-soft mt-2 text-xs">
                    Describe your product in one short, compelling sentence.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <FieldLabel htmlFor="product-description">
                    Product description
                  </FieldLabel>

                  <textarea
                    id="product-description"
                    {...register("description")}
                    disabled={productAlreadyCreated || busy}
                    rows={6}
                    placeholder="What problem does your product solve? How does it work? Who is it for?"
                    aria-invalid={Boolean(errors.description)}
                    className="input-box rounded-xl resize-y px-4 py-3 leading-6 transition focus:border-yellow-500"
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <FieldError>{errors.description?.message}</FieldError>

                    <span className="text-soft ml-auto shrink-0 text-xs">
                      {watchedValues.description?.length ?? 0} / 10,000
                    </span>
                  </div>

                  <p className="text-soft mt-2 text-xs">
                    Explain the problem, your solution, and your target users.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: LINKS AND CATEGORY                                   */}
            {/* ============================================================ */}

            {step === 2 && (
              <div className="space-y-6">
                {/* Category */}
                <div>
                  <FieldLabel htmlFor="product-category">
                    Product categories
                  </FieldLabel>

                  <button
                    id="product-category"
                    type="button"
                    onClick={() =>
                      setCategoryPickerOpen((previous) => !previous)
                    }
                    disabled={
                      categoriesLoading ||
                      categoriesError ||
                      !categories?.length ||
                      productAlreadyCreated ||
                      busy
                    }
                    aria-expanded={categoryPickerOpen}
                    aria-invalid={Boolean(errors.category_ids)}
                    className="input-box flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:border-yellow-500 focus:border-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-main">
                        {categoriesLoading
                          ? "Loading categories..."
                          : categoriesError
                            ? "Could not load categories"
                            : watchedValues.category_ids?.length
                              ? `${watchedValues.category_ids.length} categories selected`
                              : "Choose product categories"}
                      </span>

                      <span className="mt-1 block text-xs text-soft">
                        Select one or more categories
                      </span>
                    </span>

                    <span className="shrink-0 text-soft">
                      {categoryPickerOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Selected categories */}
                  {watchedValues.category_ids?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories
                        ?.filter((category) =>
                          watchedValues.category_ids.includes(category.id),
                        )
                        .map((category) => (
                          <span
                            key={category.id}
                            className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-500"
                          >
                            {category.name}

                            <button
                              type="button"
                              onClick={() => toggleCategory(category.id)}
                              disabled={productAlreadyCreated || busy}
                              aria-label={`Remove ${category.name}`}
                              className="font-bold hover:text-main"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Category grid */}
                  {categoryPickerOpen && (
                    <div className="border-line bg-input mt-3 rounded-xl border p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-main text-sm font-semibold">
                            Choose your categories
                          </h3>

                          <p className="text-soft mt-1 text-xs">
                            You can select multiple categories.
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-500">
                          {watchedValues.category_ids?.length ?? 0} selected
                        </span>
                      </div>

                      {categoriesLoading ? (
                        <p className="text-soft py-6 text-center text-sm">
                          Loading categories...
                        </p>
                      ) : categoriesError ? (
                        <p className="text-error py-6 text-center text-sm">
                          Could not load categories. Reload the page and try
                          again.
                        </p>
                      ) : !categories?.length ? (
                        <p className="text-soft py-6 text-center text-sm">
                          No active categories are available yet.
                        </p>
                      ) : (
                        <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                          {categories.map((category) => {
                            const selected =
                              watchedValues.category_ids?.includes(
                                category.id,
                              ) ?? false;

                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => toggleCategory(category.id)}
                                disabled={productAlreadyCreated || busy}
                                aria-pressed={selected}
                                className={`relative flex min-h-20 items-center justify-center rounded-xl border p-3 text-center text-sm font-medium transition-all duration-200 ${
                                  selected
                                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-500 shadow-sm"
                                    : "border-line bg-card text-main hover:border-yellow-500/50 hover:bg-input"
                                }`}
                              >
                                <span className="break-words pr-4">
                                  {category.name}
                                </span>

                                {selected && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-black"
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="border-line mt-4 flex items-center justify-between border-t pt-4">
                        <p className="text-soft text-xs">
                          Select at least one category.
                        </p>

                        <button
                          type="button"
                          onClick={() => setCategoryPickerOpen(false)}
                          className="rounded-full bg-yellow-500 px-4 py-2 text-xs font-semibold text-black transition hover:opacity-90"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  <FieldError>{errors.category_ids?.message}</FieldError>

                  {categoriesError && (
                    <p role="alert" className="text-error mt-2 text-xs">
                      Could not load categories. Reload the page and try again.
                    </p>
                  )}

                  {!categoriesLoading &&
                    !categoriesError &&
                    !categories?.length && (
                      <p className="text-soft mt-2 text-xs leading-5">
                        No active categories are available yet. An administrator
                        must activate a category first.
                      </p>
                    )}
                </div>

                {/* Website */}
                <div>
                  <FieldLabel htmlFor="product-website">
                    Product website
                  </FieldLabel>

                  <input
                    id="product-website"
                    {...register("website_url")}
                    disabled={productAlreadyCreated || busy}
                    type="url"
                    placeholder="https://example.com"
                    aria-invalid={Boolean(errors.website_url)}
                    className="input-box rounded-xl px-4 py-3 transition focus:border-yellow-500"
                  />

                  <FieldError>{errors.website_url?.message}</FieldError>

                  <p className="text-soft mt-2 text-xs">
                    The main website where people can learn about your product.
                  </p>
                </div>

                {/* Demo */}
                <div>
                  <FieldLabel htmlFor="product-demo" optional>
                    Demo URL
                  </FieldLabel>

                  <input
                    id="product-demo"
                    {...register("demo_url")}
                    disabled={productAlreadyCreated || busy}
                    type="url"
                    placeholder="https://demo.example.com"
                    aria-invalid={Boolean(errors.demo_url)}
                    className="input-box rounded-xl px-4 py-3 transition focus:border-yellow-500"
                  />

                  <FieldError>{errors.demo_url?.message}</FieldError>

                  <p className="text-soft mt-2 text-xs">
                    Add a live demo, application preview, or product walkthrough
                    if available.
                  </p>
                </div>

                {/* Discovery note */}
                <div className="border-line bg-input rounded-xl border p-4">
                  <div className="flex gap-3">
                    <span className="text-xl" aria-hidden="true">
                      ✦
                    </span>

                    <div>
                      <h3 className="text-main text-sm font-semibold">
                        Make your product discoverable
                      </h3>

                      <p className="text-soft mt-1 text-xs leading-5">
                        Select the most relevant category and provide a working
                        website. This helps visitors understand and explore your
                        product.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: LOCATION AND REVIEW                                  */}
            {/* ============================================================ */}

            {step === 3 && (
              <div className="space-y-6">
                {/* Country */}
                <div>
                  <FieldLabel htmlFor="product-country">
                    Product country
                  </FieldLabel>

                  <select
                    id="product-country"
                    {...register("country")}
                    disabled={productAlreadyCreated || busy}
                    aria-invalid={Boolean(errors.country)}
                    className="input-box rounded-xl w-full px-4 py-3 transition focus:border-yellow-500"
                  >
                    <option value="">Select an African country</option>

                    {AFRICAN_COUNTRIES.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>

                  <FieldError>{errors.country?.message}</FieldError>

                  <p className="text-soft mt-2 text-xs">
                    Select the country where your product is based.
                  </p>
                </div>

                {/* Review */}
                <div className="border-line bg-input overflow-hidden rounded-xl border">
                  <div className="border-line border-b px-4 py-4">
                    <h3 className="text-main font-semibold">
                      Review your product
                    </h3>

                    <p className="text-soft mt-1 text-xs">
                      Check your information before submitting.
                    </p>
                  </div>

                  <div className="space-y-4 p-4">
                    {/* Product identity */}
                    <div className="flex items-start gap-4">
                      <div className="bg-card border-line flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Product logo"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-soft text-xs">Logo</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-main break-words font-semibold">
                          {watchedValues.title || "Your product name"}
                        </h4>

                        <p className="text-soft mt-1 text-sm leading-5">
                          {watchedValues.tagline || "Your product tagline"}
                        </p>
                      </div>
                    </div>

                    <div className="border-line border-t" />

                    {/* Product details */}
                    <dl className="space-y-4 text-sm">
                      <div>
                        <dt className="text-soft text-xs font-medium uppercase tracking-wide">
                          Description
                        </dt>

                        <dd className="text-main mt-1 whitespace-pre-wrap break-words leading-6">
                          {watchedValues.description || "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-soft text-xs font-medium uppercase tracking-wide">
                          Website
                        </dt>

                        <dd className="text-main mt-1 break-all">
                          {watchedValues.website_url || "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-soft text-xs font-medium uppercase tracking-wide">
                          Demo
                        </dt>

                        <dd className="text-main mt-1 break-all">
                          {watchedValues.demo_url || "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-soft text-xs font-medium uppercase tracking-wide">
                          Categories
                        </dt>

                        <dd className="mt-2 flex flex-wrap gap-2">
                          {categories
                            ?.filter((category) =>
                              watchedValues.category_ids?.includes(category.id),
                            )
                            .map((category) => (
                              <span
                                key={category.id}
                                className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-500"
                              >
                                {category.name}
                              </span>
                            ))}

                          {!watchedValues.category_ids?.length && (
                            <span className="text-main">Not selected</span>
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-soft text-xs font-medium uppercase tracking-wide">
                          Country
                        </dt>

                        <dd className="text-main mt-1">
                          {watchedValues.country || "Not selected"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <p className="text-main text-sm font-medium">
                    Ready to launch?
                  </p>

                  <p className="text-soft mt-1 text-xs leading-5">
                    After creating your product, you will upload its gallery
                    images. Your product&apos;s approval and publication status
                    are controlled by LaunchAfrica.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: PRODUCT GALLERY                                      */}
            {/* ============================================================ */}

            {step === 4 && productAlreadyCreated && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-main text-lg font-semibold">
                    Add product screenshots
                  </h2>

                  <p className="text-soft mt-2 text-sm leading-6">
                    Show visitors what your product looks like. Upload
                    screenshots, product previews, or images that demonstrate
                    its features.
                  </p>
                </div>

                {/* Gallery selection */}
                <div className="border-line bg-input rounded-xl border border-dashed p-5 sm:p-6">
                  <div className="mb-4 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-2xl text-yellow-500">
                      +
                    </div>

                    <h3 className="text-main text-sm font-semibold">
                      Select your product images
                    </h3>

                    <p className="text-soft mt-2 text-xs leading-5">
                      Select between 3 and 5 images at once.
                    </p>
                  </div>

                  <input
                    ref={galleryInputRef}
                    id="product-gallery"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleGalleryChange}
                    disabled={galleryBusy || galleryLocked}
                    aria-describedby="product-gallery-help"
                    className="text-main block w-full text-xs file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-black hover:file:bg-gray-200 disabled:opacity-50"
                  />

                  <p
                    id="product-gallery-help"
                    className="text-soft mt-3 text-center text-xs leading-5"
                  >
                    PNG, JPEG or WebP · Maximum 5 MB per image
                  </p>
                </div>

                {/* Gallery previews */}
                {galleryFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-main text-sm font-semibold">
                          Selected images
                        </h3>

                        <p className="text-soft mt-1 text-xs">
                          {galleryFiles.length} images selected
                        </p>
                      </div>

                      <span className="text-soft text-xs font-medium">
                        {uploadedCount}/{galleryFiles.length} uploaded
                      </span>
                    </div>

                    {/* Upload progress */}
                    <div>
                      <div className="bg-input h-2 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-yellow-500 transition-all duration-300"
                          style={{ width: `${galleryProgress}%` }}
                        />
                      </div>

                      <p className="text-soft mt-2 text-right text-xs">
                        {galleryProgress}% complete
                      </p>
                    </div>

                    {/* Image cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {galleryFiles.map((file, index) => {
                        const uploaded = uploadedImageIndexes.includes(index);

                        return (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="border-line bg-input flex min-w-0 items-center gap-3 rounded-xl border p-3"
                          >
                            <div className="bg-card border-line h-20 w-20 shrink-0 overflow-hidden rounded-lg border">
                              {galleryPreviews[index] && (
                                <img
                                  src={galleryPreviews[index]}
                                  alt={`Preview of ${file.name}`}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-main break-words text-sm font-medium">
                                {file.name}
                              </p>

                              <p className="text-soft mt-1 text-xs">
                                {formatFileSize(file.size)}
                              </p>

                              {index === 0 && (
                                <p className="mt-1 text-xs text-yellow-500">
                                  Primary image
                                </p>
                              )}

                              <p
                                className={`mt-2 text-xs font-semibold ${
                                  uploaded ? "text-green-600" : "text-soft"
                                }`}
                              >
                                {uploaded ? "✓ Uploaded" : "Waiting to upload"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gallery error */}
                {galleryError && (
                  <div
                    role="alert"
                    className="border-line bg-input rounded-xl border p-4"
                  >
                    <p className="text-error text-sm leading-6">
                      {galleryError}
                    </p>
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={uploadGalleryImages}
                  disabled={
                    galleryBusy ||
                    galleryFiles.length < MIN_GALLERY_IMAGES ||
                    galleryFiles.length > MAX_GALLERY_IMAGES ||
                    uploadedCount === galleryFiles.length
                  }
                  className="btn-main rounded-full w-full px-5 py-3.5 font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {galleryBusy
                    ? `Uploading images (${uploadedCount}/${galleryFiles.length})...`
                    : uploadedCount > 0
                      ? "Retry remaining uploads"
                      : "Finish product launch →"}
                </button>

                <p className="text-soft text-center text-xs leading-5">
                  Your product has been created. Once the gallery upload is
                  complete, you will be redirected to its product page.
                </p>
              </section>
            )}

            {/* ============================================================ */}
            {/* API ERRORS                                                   */}
            {/* ============================================================ */}

            {createMutation.isError && !productAlreadyCreated && (
              <div
                role="alert"
                className="border-line bg-input rounded-xl border p-4"
              >
                <p className="text-error text-sm leading-6">
                  {getErrorMessage(createMutation.error)}
                </p>
              </div>
            )}

            {/* Logo upload retry */}
            {logoError && productAlreadyCreated && (
              <div
                role="alert"
                className="border-line bg-input rounded-xl border p-4"
              >
                <p className="text-error text-sm leading-6">{logoError}</p>

                {logoFile && step !== 4 && (
                  <button
                    type="button"
                    onClick={retryLogoUpload}
                    disabled={busy}
                    className="btn-main rounded-full mt-4 w-full px-4 py-3 font-semibold disabled:opacity-50"
                  >
                    {uploadLogoMutation.isPending
                      ? "Uploading logo..."
                      : "Retry logo upload"}
                  </button>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* NAVIGATION                                                   */}
            {/* ============================================================ */}

            {!productAlreadyCreated && (
              <div className="flex gap-3 border-line border-t pt-5">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={busy}
                    className="border-line text-main rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-input disabled:opacity-50"
                  >
                    ← Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      busy ||
                      (step === 2 &&
                        (categoriesLoading ||
                          categoriesError ||
                          !categories?.length))
                    }
                    className="btn-main rounded-full flex-1 px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-main rounded-full flex-1 px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createMutation.isPending
                      ? "Creating product..."
                      : uploadLogoMutation.isPending
                        ? "Uploading logo..."
                        : "Create product →"}
                  </button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-line border-t pt-4">
              <p className="text-soft text-center text-xs leading-5">
                Fields marked * are required. Demo URL is optional. Product
                approval and publication status are controlled by Django.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Supporting information */}
      <p className="text-soft mt-5 text-center text-xs leading-5">
        Built for African founders, creators, and innovators.
      </p>
    </main>
  );
}
