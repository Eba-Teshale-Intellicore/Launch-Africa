"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useCategories } from "@/src/hooks/useCategory";
import {
  useCreateProduct,
  useUploadProductLogo,
  useUploadProductImage,
} from "@/src/hooks/useProduct";

import type { CreateProductInput } from "@/src/types/product";
import type { ApiErrorBody } from "@/src/types/auth";

import { AFRICAN_COUNTRIES } from "@/src/constants/african-countries";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const MIN_GALLERY_IMAGES = 3;
const MAX_GALLERY_IMAGES = 5;

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

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

  // Demo URL is optional, but must be valid when provided.
  demo_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || z.string().url().safeParse(value).success,
      "Enter a valid demo URL.",
    ),

  category_id: z.string().min(1, "Choose a category."),

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

const STEPS = [
  {
    number: 1,
    title: "Product details",
    description: "Introduce your product.",
  },
  {
    number: 2,
    title: "Links & category",
    description: "Help people discover your product.",
  },
  {
    number: 3,
    title: "Location",
    description: "Where is your product based?",
  },
  {
    number: 4,
    title: "Product gallery",
    description: "Show people what your product looks like.",
  },
] as const;

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

export default function CreateProductForm() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateProduct();
  const uploadLogoMutation = useUploadProductLogo();
  const uploadImageMutation = useUploadProductImage();

  const {
    data: categories,
    isPending: categoriesLoading,
    isError: categoriesError,
  } = useCategories(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Product logo state.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");

  // The product slug is saved immediately after creation so a failed
  // upload does not cause the product to be created a second time.
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  // Step 4: product gallery state.
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

  // Prevent replacing the selected files after any image has uploaded.
  // This keeps each successful upload associated with the correct file.
  const galleryLocked = uploadedImageIndexes.length > 0;

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  // Generate previews for the selected gallery images.
  useEffect(() => {
    const previews = galleryFiles.map((file) => URL.createObjectURL(file));

    setGalleryPreviews(previews);

    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [galleryFiles]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
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
      category_id: "",
      country: "",
    },
  });

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
      setLogoError("Choose a PNG, JPEG, or WebP image.");
      return;
    }

    if (file.size === 0) {
      setLogoFile(null);
      event.currentTarget.value = "";
      setLogoError("The selected image is empty.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoFile(null);
      event.currentTarget.value = "";
      setLogoError("The logo must be 5 MB or smaller.");
      return;
    }

    setLogoFile(file);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoError("");

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }

  // STEP 4: validate the gallery file selection.
  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    setGalleryError("");

    // Do not allow the selection to change after a successful upload.
    if (galleryLocked || galleryBusy) {
      return;
    }

    const files = Array.from(event.currentTarget.files ?? []);

    if (files.length < MIN_GALLERY_IMAGES) {
      setGalleryFiles([]);
      event.currentTarget.value = "";
      setGalleryError(`Please select at least ${MIN_GALLERY_IMAGES} images.`);
      return;
    }

    if (files.length > MAX_GALLERY_IMAGES) {
      setGalleryFiles([]);
      event.currentTarget.value = "";
      setGalleryError(
        `You can upload a maximum of ${MAX_GALLERY_IMAGES} images.`,
      );
      return;
    }

    const invalidType = files.find(
      (file) => !ALLOWED_LOGO_TYPES.includes(file.type),
    );

    if (invalidType) {
      setGalleryFiles([]);
      event.currentTarget.value = "";
      setGalleryError("All gallery images must be PNG, JPEG, or WebP files.");
      return;
    }

    const emptyFile = files.find((file) => file.size === 0);

    if (emptyFile) {
      setGalleryFiles([]);
      event.currentTarget.value = "";
      setGalleryError("One of the selected images is empty.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      setGalleryFiles([]);
      event.currentTarget.value = "";
      setGalleryError("Each gallery image must be 5 MB or smaller.");
      return;
    }

    setUploadedImageIndexes([]);
    setGalleryFiles(files);
  }

  async function handleNext() {
    setLogoError("");

    if (step === 1) {
      const valid = await trigger(["title", "tagline", "description"]);

      if (!valid) return;

      if (!logoFile) {
        setLogoError("A product logo is required.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (categoriesLoading || categoriesError || !categories?.length) {
        return;
      }

      const valid = await trigger(["category_id", "website_url", "demo_url"]);

      if (!valid) return;

      setStep(3);
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

  async function onSubmit(values: ProductFormValues) {
    if (productAlreadyCreated) {
      setLogoError(
        "The product already exists. Retry the logo upload instead.",
      );
      return;
    }

    setLogoError("");

    // Defensively validate the logo before creating the product.
    if (!logoFile) {
      setLogoError("A product logo is required.");
      setStep(1);
      return;
    }

    if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
      setLogoError("Choose a PNG, JPEG, or WebP image.");
      setStep(1);
      return;
    }

    if (logoFile.size === 0 || logoFile.size > MAX_LOGO_SIZE) {
      setLogoError("The logo must be a valid image no larger than 5 MB.");
      setStep(1);
      return;
    }

    const payload: CreateProductInput = {
      title: values.title,
      tagline: values.tagline,
      description: values.description,
      website_url: values.website_url,
      demo_url: values.demo_url ?? "",
      category_id: values.category_id,
      country: values.country,
    };

    try {
      const product = await createMutation.mutateAsync(payload);

      // Save the slug before uploading files to prevent duplicate creation.
      setCreatedSlug(product.slug);

      try {
        await uploadLogoMutation.mutateAsync({
          slug: product.slug,
          input: { file: logoFile },
        });
      } catch (error) {
        setLogoError(
          `Your product was created, but its logo upload failed. ${getErrorMessage(error)}`,
        );
        return;
      }

      setLogoError("");

      // Continue to the new fourth step instead of navigating away.
      setStep(4);
    } catch {
      // The creation error is rendered below.
    }
  }

  async function retryLogoUpload() {
    if (!createdSlug || !logoFile) {
      setLogoError("Select a valid logo before retrying.");
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
    } catch (error) {
      setLogoError(`Logo upload failed. ${getErrorMessage(error)}`);
    }
  }

  // STEP 4: upload gallery images sequentially.
  async function uploadGalleryImages() {
    if (!createdSlug) {
      setGalleryError("Create the product before uploading gallery images.");
      return;
    }

    if (
      galleryFiles.length < MIN_GALLERY_IMAGES ||
      galleryFiles.length > MAX_GALLERY_IMAGES
    ) {
      setGalleryError(
        `Select between ${MIN_GALLERY_IMAGES} and ${MAX_GALLERY_IMAGES} images.`,
      );
      return;
    }

    setGalleryError("");
    setGalleryBusy(true);

    // Keep track of successful uploads during this attempt.
    // A retry skips indexes that have already succeeded.
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

      // All selected gallery images uploaded successfully.
      router.push(`/products/${encodeURIComponent(createdSlug)}`);
    } catch (error) {
      setGalleryError(
        `An image could not be uploaded. ${getErrorMessage(error)} You can retry the remaining images.`,
      );
    } finally {
      setGalleryBusy(false);
    }
  }

  const activeStep = STEPS[step - 1];

  return (
    <section className="bg-card border-line rounded-card shadow-card w-card mx-auto p-6 sm:p-8">
      {/* Header */}
      <header className="mb-7 text-center">
        <div className="mb-4 flex items-center justify-center">
          <span className="font-logo text-logo text-2xl">LAUNCHAFRICA</span>
        </div>

        <h1 className="text-main mt-4 text-2xl font-bold">
          Launch your product
        </h1>

        <p className="text-soft mt-2 text-sm leading-6">
          Introduce your product to Africa&apos;s innovation ecosystem.
        </p>
      </header>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          {STEPS.map((item) => {
            const completed = step > item.number;
            const current = step === item.number;

            return (
              <div
                key={item.number}
                className="flex min-w-0 flex-1 flex-col items-center text-center"
              >
                <div
                  className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                    completed || current
                      ? "border-transparent bg-yellow-500 text-black"
                      : "border-line text-soft"
                  }`}
                >
                  {completed ? "✓" : item.number}
                </div>

                <span
                  className={`text-xs font-medium sm:text-sm ${
                    current ? "text-main" : "text-soft"
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
            className="h-full rounded-full bg-yellow-500 transition-all duration-300"
            style={{
              width: `${(step / STEPS.length) * 100}%`,
            }}
          />
        </div>

        <div className="mt-4">
          <h2 className="text-main text-lg font-semibold">
            Step {step}: {activeStep.title}
          </h2>

          <p className="text-soft mt-1 text-sm">{activeStep.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* STEP 1: Product details */}
        {step === 1 && (
          <>
            {/* Logo */}
            <div>
              <label
                htmlFor="product-logo"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Product logo <span className="text-error">*</span>
              </label>

              <div className="border-line bg-input rounded-card border p-4">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                  <div className="bg-card border-line flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Selected product logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-soft text-center text-xs">
                        Logo preview
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <input
                      ref={logoInputRef}
                      id="product-logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      disabled={productAlreadyCreated || busy}
                      aria-invalid={Boolean(logoError) || !logoFile}
                      aria-describedby="product-logo-help"
                      className="text-main block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
                    />

                    <p
                      id="product-logo-help"
                      className="text-soft mt-2 text-xs leading-5"
                    >
                      PNG, JPEG, or WebP. Maximum 5 MB. A square logo works
                      best.
                    </p>

                    {logoFile && !productAlreadyCreated && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        disabled={busy}
                        className="text-soft mt-2 text-sm underline"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {logoError && (
                <p role="alert" className="text-error mt-2 text-sm">
                  {logoError}
                </p>
              )}
            </div>

            {/* Product name */}
            <div>
              <label
                htmlFor="product-title"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Product name <span className="text-error">*</span>
              </label>

              <input
                id="product-title"
                {...register("title")}
                disabled={productAlreadyCreated || busy}
                placeholder="e.g. LaunchAfrica"
                aria-invalid={Boolean(errors.title)}
                className="input-box rounded-pill px-4 py-3"
              />

              {errors.title && (
                <p className="text-error mt-1 text-sm">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Tagline */}
            <div>
              <label
                htmlFor="product-tagline"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Tagline <span className="text-error">*</span>
              </label>

              <input
                id="product-tagline"
                {...register("tagline")}
                disabled={productAlreadyCreated || busy}
                placeholder="What makes your product useful?"
                aria-invalid={Boolean(errors.tagline)}
                className="input-box rounded-pill px-4 py-3"
              />

              {errors.tagline && (
                <p className="text-error mt-1 text-sm">
                  {errors.tagline.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="product-description"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Description <span className="text-error">*</span>
              </label>

              <textarea
                id="product-description"
                {...register("description")}
                disabled={productAlreadyCreated || busy}
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
          </>
        )}

        {/* STEP 2: Category and links */}
        {step === 2 && (
          <>
            {/* Category */}
            <div>
              <label
                htmlFor="product-category"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Category <span className="text-error">*</span>
              </label>

              <select
                id="product-category"
                {...register("category_id")}
                disabled={
                  categoriesLoading ||
                  categoriesError ||
                  !categories?.length ||
                  productAlreadyCreated ||
                  busy
                }
                aria-invalid={Boolean(errors.category_id)}
                className="input-box rounded-pill w-full px-4 py-3"
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
                <p role="alert" className="text-error mt-1 text-sm">
                  Could not load categories. Reload the page and try again.
                </p>
              )}

              {!categoriesLoading &&
                !categoriesError &&
                !categories?.length && (
                  <p className="text-soft mt-2 text-xs">
                    No active categories are available yet. An administrator
                    must activate a category first.
                  </p>
                )}
            </div>

            {/* Website */}
            <div>
              <label
                htmlFor="product-website"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Website URL <span className="text-error">*</span>
              </label>

              <input
                id="product-website"
                {...register("website_url")}
                disabled={productAlreadyCreated || busy}
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

            {/* Optional demo URL */}
            <div>
              <label
                htmlFor="product-demo"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Demo URL{" "}
                <span className="text-soft font-normal">(Optional)</span>
              </label>

              <input
                id="product-demo"
                {...register("demo_url")}
                disabled={productAlreadyCreated || busy}
                type="url"
                placeholder="https://demo.example.com"
                aria-invalid={Boolean(errors.demo_url)}
                className="input-box rounded-pill px-4 py-3"
              />

              {errors.demo_url && (
                <p className="text-error mt-1 text-sm">
                  {errors.demo_url.message}
                </p>
              )}

              <p className="text-soft mt-2 text-xs">
                Add a live demo if your product has one.
              </p>
            </div>
          </>
        )}

        {/* STEP 3: Country */}
        {step === 3 && (
          <>
            <div>
              <label
                htmlFor="product-country"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Country <span className="text-error">*</span>
              </label>

              <select
                id="product-country"
                {...register("country")}
                disabled={productAlreadyCreated || busy}
                aria-invalid={Boolean(errors.country)}
                className="input-box rounded-pill w-full px-4 py-3"
              >
                <option value="">Select an African country</option>

                {AFRICAN_COUNTRIES.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>

              {errors.country && (
                <p className="text-error mt-1 text-sm">
                  {errors.country.message}
                </p>
              )}
            </div>

            {/* Final review */}
            <div className="border-line bg-input rounded-card border p-4">
              <h3 className="text-main mb-3 font-semibold">
                Review your product
              </h3>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-soft">Product name</dt>
                  <dd className="text-main mt-1 font-medium">
                    {getValues("title") || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-soft">Tagline</dt>
                  <dd className="text-main mt-1">
                    {getValues("tagline") || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-soft">Website</dt>
                  <dd className="text-main mt-1 break-all">
                    {getValues("website_url") || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-soft">Demo</dt>
                  <dd className="text-main mt-1 break-all">
                    {getValues("demo_url") || "Not provided"}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}

        {/* STEP 4: Product gallery */}
        {step === 4 && productAlreadyCreated && (
          <section className="space-y-5">
            <div>
              <h3 className="text-main text-base font-semibold">
                Upload product images
              </h3>

              <p className="text-soft mt-2 text-sm leading-6">
                Show your product in action. Select 3–5 screenshots or images
                that help visitors understand your product.
              </p>

              <p className="text-soft mt-2 text-xs leading-5">
                PNG, JPEG, or WebP · Up to 5 MB per image ·
                {` ${MIN_GALLERY_IMAGES}–${MAX_GALLERY_IMAGES} images`}
              </p>
            </div>

            <div className="border-line bg-input rounded-card border border-dashed p-5">
              <label
                htmlFor="product-gallery"
                className="text-main mb-3 block text-sm font-semibold"
              >
                Product gallery images
              </label>

              <input
                ref={galleryInputRef}
                id="product-gallery"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleGalleryChange}
                disabled={galleryBusy || galleryLocked}
                aria-describedby="product-gallery-help"
                className="text-main block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black disabled:opacity-50"
              />

              <p
                id="product-gallery-help"
                className="text-soft mt-3 text-xs leading-5"
              >
                Select all your gallery images at once. After an image uploads
                successfully, the selection is locked so you can retry failed
                uploads without changing the image order.
              </p>
            </div>

            {/* Gallery previews */}
            {galleryFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-main text-sm font-semibold">
                    Selected images
                  </h4>

                  <span className="text-soft text-xs">
                    {uploadedImageIndexes.length} of {galleryFiles.length}{" "}
                    uploaded
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {galleryFiles.map((file, index) => {
                    const uploaded = uploadedImageIndexes.includes(index);

                    return (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="border-line bg-input rounded-card flex min-w-0 items-center gap-3 border p-3"
                      >
                        <div className="bg-card border-line h-20 w-20 shrink-0 overflow-hidden rounded-xl border">
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
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>

                          {index === 0 && (
                            <p className="text-soft mt-1 text-xs">
                              Primary gallery image
                            </p>
                          )}

                          {uploaded && (
                            <p className="mt-2 text-sm font-medium text-green-600">
                              ✓ Uploaded
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gallery upload error */}
            {galleryError && (
              <p
                role="alert"
                className="text-error bg-input rounded-card p-3 text-sm"
              >
                {galleryError}
              </p>
            )}

            {/* Upload / retry button */}
            <button
              type="button"
              onClick={uploadGalleryImages}
              disabled={
                galleryBusy ||
                galleryFiles.length < MIN_GALLERY_IMAGES ||
                galleryFiles.length > MAX_GALLERY_IMAGES ||
                uploadedImageIndexes.length === galleryFiles.length
              }
              className="btn-main rounded-pill w-full px-4 py-3 disabled:opacity-50"
            >
              {galleryBusy
                ? "Uploading images..."
                : uploadedImageIndexes.length > 0
                  ? "Retry remaining uploads"
                  : "Finish launch"}
            </button>

            <p className="text-soft text-center text-xs leading-5">
              Your product has been created. Upload the gallery images to
              finish, then you&apos;ll be taken to your product page.
            </p>
          </section>
        )}

        {/* Product creation error */}
        {createMutation.isError && !productAlreadyCreated && (
          <p
            role="alert"
            className="text-error bg-input rounded-card p-3 text-sm"
          >
            {getErrorMessage(createMutation.error)}
          </p>
        )}

        {/* Logo upload error and retry */}
        {logoError && productAlreadyCreated && (
          <div
            role="alert"
            className="text-error bg-input rounded-card p-3 text-sm"
          >
            <p>{logoError}</p>

            {logoFile && step !== 4 && (
              <button
                type="button"
                onClick={retryLogoUpload}
                disabled={busy}
                className="btn-main rounded-pill mt-3 w-full px-4 py-3 disabled:opacity-50"
              >
                {uploadLogoMutation.isPending
                  ? "Uploading logo..."
                  : "Retry logo upload"}
              </button>
            )}
          </div>
        )}

        {/* Navigation for Steps 1–3 */}
        {!productAlreadyCreated && (
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={busy}
                className="border-line text-main rounded-pill border px-5 py-3 disabled:opacity-50"
              >
                Back
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
                className="btn-main rounded-pill flex-1 px-4 py-3 disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={busy}
                className="btn-main rounded-pill flex-1 px-4 py-3 disabled:opacity-50"
              >
                {createMutation.isPending
                  ? "Creating product..."
                  : uploadLogoMutation.isPending
                    ? "Uploading logo..."
                    : "Create Product"}
              </button>
            )}
          </div>
        )}

        <p className="text-soft text-xs leading-5">
          Fields marked * are required. The demo URL is optional. Product
          approval and publication status are controlled by Django.
        </p>
      </form>
    </section>
  );
}
