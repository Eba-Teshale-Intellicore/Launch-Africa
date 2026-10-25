"use client";

import { useRef, useState } from "react";

import {
  useDeleteProductImage,
  useProduct,
  useUpdateProductImage,
  useUploadProductImage,
} from "@/src/hooks/useProduct";

interface Props {
  slug: string;
  canManage: boolean;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProductImageUploader({ slug, canManage }: Props) {
  const { data: product, isPending, isError } = useProduct(slug);

  const uploadMutation = useUploadProductImage();
  const deleteMutation = useDeleteProductImage();
  const updateMutation = useUpdateProductImage();

  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [altText, setAltText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isPending) {
    return <p className="text-soft">Loading product images...</p>;
  }

  if (isError || !product) {
    return (
      <p role="alert" className="text-error">
        Could not load this product's images.
      </p>
    );
  }

  const images = product.images ?? [];
  const remaining = MAX_IMAGES - images.length;
  const isBusy =
    uploadMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending;

  function selectFiles(selected: FileList | null) {
    if (!selected) return;

    setMessage(null);
    setErrorMessage(null);

    const incoming = Array.from(selected);

    if (incoming.some((file) => !file.type.startsWith("image/"))) {
      setErrorMessage("Please select image files only.");
      return;
    }

    if (incoming.some((file) => file.size > MAX_FILE_SIZE)) {
      setErrorMessage("Each image must be 5 MB or smaller.");
      return;
    }

    if (incoming.length > remaining) {
      setErrorMessage(`You can add at most ${remaining} more image(s).`);
      return;
    }

    setFiles(incoming);
  }

  async function uploadFiles() {
    if (!files.length) return;

    setMessage(null);
    setErrorMessage(null);

    let uploaded = 0;

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        await uploadMutation.mutateAsync({
          slug,
          input: {
            file,
            alt_text: altText.trim() || file.name,
            display_order: images.length + index,
            is_primary: images.length === 0 && index === 0,
          },
        });

        uploaded++;
      }

      setFiles([]);
      setAltText("");

      if (fileInput.current) {
        fileInput.current.value = "";
      }

      setMessage(`${uploaded} image(s) uploaded successfully.`);
    } catch (error) {
      setErrorMessage(
        uploaded > 0
          ? `${uploaded} image(s) uploaded. Another upload failed; try the remaining images again.`
          : error instanceof Error
            ? error.message
            : "Image upload failed. Please try again.",
      );

      // Keep only files that were not successfully uploaded.
      setFiles((previous) => previous.slice(uploaded));
    }
  }

  async function removeImage(imageId: string) {
    setErrorMessage(null);
    setMessage(null);

    try {
      await deleteMutation.mutateAsync({ slug, imageId });
      setMessage("Image deleted.");
    } catch {
      setErrorMessage("Could not delete the image. Please try again.");
    }
  }

  async function makePrimary(imageId: string) {
    setErrorMessage(null);
    setMessage(null);

    try {
      await updateMutation.mutateAsync({
        slug,
        imageId,
        input: { is_primary: true },
      });

      setMessage("Primary image updated.");
    } catch {
      setErrorMessage(
        "Could not update the primary image. Check the backend image-update endpoint.",
      );
    }
  }

  return (
    <section className="bg-card border-line rounded-card p-5 sm:p-7">
      <header className="mb-6">
        <h2 className="text-main text-xl font-bold">Product images</h2>
        <p className="text-soft mt-2 text-sm">
          {images.length} of {MAX_IMAGES} images uploaded.
        </p>
      </header>

      {message && (
        <p role="status" className="text-success mb-4 text-sm">
          {message}
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="text-error mb-4 text-sm">
          {errorMessage}
        </p>
      )}

      {images.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image) => (
            <article
              key={image.id}
              className="border-line bg-input rounded-card overflow-hidden border"
            >
              <div className="aspect-[4/3]">
                <img
                  src={image.secure_url}
                  alt={image.alt_text}
                  className="size-full object-cover"
                />
              </div>

              <div className="space-y-3 p-3">
                {image.is_primary && (
                  <span className="text-success text-xs font-semibold">
                    Primary image
                  </span>
                )}

                <p className="text-soft truncate text-xs">{image.alt_text}</p>

                {canManage && (
                  <div className="flex flex-col gap-2">
                    {!image.is_primary && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void makePrimary(image.id)}
                        className="btn-soft rounded-pill px-3 py-2 text-xs"
                      >
                        Make primary
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void removeImage(image.id)}
                      className="btn-soft rounded-pill px-3 py-2 text-xs"
                    >
                      Delete image
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!images.length && (
        <p className="text-soft mb-6 text-sm">
          No product images uploaded yet.
        </p>
      )}

      {canManage && remaining > 0 && (
        <div className="space-y-4 border-t border-[var(--line)] pt-5">
          <div>
            <label
              htmlFor="product-images"
              className="text-main mb-2 block text-sm font-semibold"
            >
              Choose images
            </label>

            <input
              ref={fileInput}
              id="product-images"
              type="file"
              accept="image/*"
              multiple
              disabled={isBusy}
              onChange={(event) => selectFiles(event.target.files)}
              className="input-box rounded-card p-3"
            />

            <p className="text-soft mt-2 text-xs">
              Up to {remaining} more image(s), maximum 5 MB per file.
            </p>
          </div>

          {files.length > 0 && (
            <div className="bg-input rounded-card p-4">
              <p className="text-main mb-2 text-sm font-semibold">
                Selected files
              </p>
              {files.map((file, index) => (
                <p
                  key={`${file.name}-${index}`}
                  className="text-soft py-1 text-xs"
                >
                  {file.name}
                </p>
              ))}
            </div>
          )}

          <div>
            <label
              htmlFor="product-image-alt"
              className="text-main mb-2 block text-sm font-semibold"
            >
              Image description (alt text)
            </label>

            <input
              id="product-image-alt"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              maxLength={250}
              placeholder="Describe the image for accessibility"
              className="input-box rounded-pill px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={() => void uploadFiles()}
            disabled={!files.length || isBusy}
            className="btn-main rounded-pill w-full px-4 py-3"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload images"}
          </button>
        </div>
      )}
    </section>
  );
}
