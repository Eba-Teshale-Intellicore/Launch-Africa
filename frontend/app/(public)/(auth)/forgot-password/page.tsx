"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { requestPasswordReset } from "@/src/lib/auth";
import type { ApiErrorBody } from "@/src/types/auth";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .email("Enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type Theme = "dark" | "light";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (typeof data?.detail === "string") return data.detail;

    if (Array.isArray(data?.non_field_errors)) {
      return data.non_field_errors.join(" ");
    }

    if (!error.response) {
      return "Cannot reach the server. Check that Django is running.";
    }

    return "We couldn't process your request. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordPage() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("la-theme");

    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("la-theme", theme);
  }, [theme]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    mutation.reset();

    mutation.mutate({
      email: values.email.trim(),
    });
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <main className="bg-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg sm:mx-auto">
        <section className="bg-card border-line rounded-card shadow-card border p-6 sm:p-8">
          {/* Brand and theme toggle */}
          <header className="mb-7 text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <Link href="/" className="font-logo text-logo text-2xl">
                LAUNCHAFRICA
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${
                  theme === "dark" ? "light" : "dark"
                } theme`}
                aria-pressed={theme === "light"}
                className="btn-soft rounded-pill inline-flex size-9 items-center justify-center"
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mail icon */}
            <div className="bg-input text-soft rounded-card mx-auto mb-5 flex size-14 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>

            <h1 className="text-main text-2xl font-bold">
              Forgot your password?
            </h1>

            <p className="text-soft mt-3 text-sm leading-6">
              It happens. Enter your email address and we&apos;ll help you get
              back into your account.
            </p>
          </header>

          {/* Success state */}
          {mutation.isSuccess ? (
            <div
              role="status"
              aria-live="polite"
              className="border-line bg-input rounded-card border p-5 text-center"
            >
              <div className="bg-page text-main mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>

              <h2 className="text-main font-semibold">Check your email</h2>

              <p className="text-soft mt-2 text-sm leading-6">
                If an account exists for that email address, you&apos;ll receive
                instructions to reset your password. Check your inbox and spam
                folder.
              </p>

              <button
                type="button"
                onClick={() => mutation.reset()}
                className="text-main mt-5 text-sm font-semibold underline underline-offset-4 hover:opacity-80"
              >
                Try another email
              </button>
            </div>
          ) : (
            /* Form state */
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-main mb-2 block text-sm font-semibold"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  className="input-box rounded-pill w-full px-4 py-3"
                />

                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="text-error mt-1 text-sm"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {mutation.isError && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-error bg-input rounded-card p-3 text-sm"
                >
                  {getErrorMessage(mutation.error)}
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-main rounded-pill w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending
                  ? "Sending instructions…"
                  : "Send reset instructions"}
              </button>
            </form>
          )}

          {/* Navigation */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-soft hover:text-main inline-flex items-center gap-2 text-sm font-semibold"
            >
              <span aria-hidden="true">←</span>
              Back to login
            </Link>
          </div>
        </section>

        <p className="text-soft mt-6 text-center text-xs">
          Discover. Build. Launch. Grow.
        </p>
      </div>
    </main>
  );
}
