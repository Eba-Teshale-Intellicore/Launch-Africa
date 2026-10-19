"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { requestPasswordReset } from "@/lib/auth";
import type { ApiErrorBody } from "@/types/auth";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (typeof data?.detail === "string") {
      return data.detail;
    }

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
    mutation.mutate({
      email: values.email.trim(),
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-black tracking-tight text-[#101a2b]"
        >
          LAUNCH<span className="text-amber-500">AFRICA</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
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

          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              No worries! Enter the email address associated with your account,
              and we&apos;ll help you reset your password.
            </p>
          </div>

          {mutation.isSuccess ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-green-200 bg-green-50 p-5 text-center"
            >
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-700">
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

              <h2 className="font-semibold text-green-900">Check your email</h2>

              <p className="mt-2 text-sm leading-6 text-green-800">
                If an account exists for that email address, reset instructions
                will be sent. Check your inbox and spam folder.
              </p>

              <button
                type="button"
                onClick={() => mutation.reset()}
                className="mt-4 text-sm font-semibold text-green-900 underline underline-offset-4"
              >
                Try another email
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />

                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {mutation.isError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {getErrorMessage(mutation.error)}
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-[#101a2b] px-4 py-3 font-semibold text-white transition hover:bg-[#22324b] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending
                  ? "Sending instructions…"
                  : "Send reset instructions"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-amber-700"
            >
              <span aria-hidden="true">←</span>
              Back to login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Discover. Build. Launch. Grow.
        </p>
      </div>
    </main>
  );
}
