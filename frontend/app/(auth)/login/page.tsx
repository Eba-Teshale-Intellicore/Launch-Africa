"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type Theme = "dark" | "light";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (typeof data?.detail === "string") return data.detail;

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

      if (messages.length) return messages.join(" ");
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
  const [theme, setTheme] = useState<Theme>("dark");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("la-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("la-theme", theme);
  }, [theme]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));

  return (
    <main className="bg-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg sm:mx-auto">
        <div className="bg-card border-line rounded-card shadow-card p-6 sm:p-8">
          {/* Brand + heading + theme toggle */}
          <div className="mb-7 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <Link href="/" className="font-logo text-logo text-2xl">
                LAUNCHAFRICA
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
                aria-pressed={theme === "light"}
                title={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
                className="btn-soft rounded-pill inline-flex size-8 items-center justify-center"
              >
                {theme === "dark" ? (
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
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
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
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  </svg>
                )}
              </button>
            </div>

            <h1 className="text-main text-2xl font-bold">Welcome back</h1>

            <p className="text-soft mt-2 text-sm leading-6">
              Sign in to discover, build, and launch great ideas.
            </p>
          </div>

          {/* Google placeholder */}
          <button
            type="button"
            disabled
            title="Google sign-in is not configured yet"
            className="btn-soft rounded-pill w-full px-4 py-3"
          >
            Continue with Google (coming soon)
          </button>

          <div className="divider my-6">
            <span className="text-soft text-xs">OR Continue with email</span>
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
                className="text-main mb-2 block text-sm font-semibold"
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
                className="input-box rounded-pill w-full px-4 py-3"
              />
              {errors.email && (
                <p id="email-error" className="text-error mt-1 text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-main block text-sm font-semibold"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-soft text-sm font-semibold underline underline-offset-2 hover:opacity-80"
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
                  className="input-box rounded-pill w-full px-4 py-3 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="text-soft hover:text-main absolute inset-y-0 right-4 my-auto rounded px-1 text-sm font-semibold focus:outline-none focus-visible:ring-2"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" className="text-error mt-1 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* API error */}
            {mutation.isError && (
              <p
                role="alert"
                className="text-error bg-input rounded-card p-3 text-sm"
              >
                {getErrorMessage(mutation.error)}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-main rounded-pill w-full px-4 py-3"
            >
              {mutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Registration link */}
          <div className="divider my-6">
            <span className="text-soft text-xs">NEW TO LAUNCHAFRICA?</span>
          </div>

          <p className="text-soft text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-main font-bold hover:opacity-80"
            >
              Create account
            </Link>
          </p>
        </div>

        <p className="text-soft mt-6 text-center text-xs">
          Discover. Build. Launch. Grow.
        </p>
      </div>
    </main>
  );
}
