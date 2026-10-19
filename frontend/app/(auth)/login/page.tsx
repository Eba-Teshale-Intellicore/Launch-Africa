"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { loginUser } from "@/lib/auth";
import type { ApiErrorBody } from "@/types/auth";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

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

      if (messages.length) {
        return messages.join(" ");
      }
    }

    if (!error.response) {
      return "Cannot reach the server. Check that the Django backend is running.";
    }

    if (error.response.status === 401) {
      return "Invalid email or password. Please try again.";
    }

    if (error.response.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }

    return "Login failed. Please check your details and try again.";
  }

  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      router.replace("/");
      router.refresh();
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    mutation.mutate({
      email: values.email.trim(),
      password: values.password,
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Brand and heading */}
          <div className="mb-7 text-center">
            <Link
              href="/"
              className="mb-4 block text-2xl font-black tracking-tight text-[#101a2b]"
            >
              LAUNCH<span className="text-amber-500">AFRICA</span>
            </Link>

            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to discover, build, and launch great ideas.
            </p>
          </div>

          {/* Login form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
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
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 aria-[invalid=true]:border-red-500"
              />

              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-amber-700 hover:text-amber-800"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password")}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 aria-[invalid=true]:border-red-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-3 my-auto rounded px-2 text-sm font-semibold text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* API error */}
            {mutation.isError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
              >
                {getErrorMessage(mutation.error)}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg bg-[#101a2b] px-4 py-3 font-semibold text-white transition hover:bg-[#22324b] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Registration link */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">NEW TO LAUNCHAFRICA?</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-amber-700 hover:text-amber-800"
            >
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Discover. Build. Launch. Grow.
        </p>
      </div>
    </main>
  );
}
