"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { registerUser } from "@/src/lib/auth";
import type { ApiErrorBody } from "@/src/types/auth";

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must contain at least 3 characters.")
      .max(150, "Username is too long."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must contain at least 8 characters."),
    password_confirm: z.string().min(1, "Please confirm your password."),
    terms: z.boolean().refine(Boolean, {
      message: "Please accept the Terms of Service and Privacy Policy.",
    }),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

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

    return "Registration failed. Please check your details and try again.";
  }

  return "Something went wrong. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password_confirm: "",
      terms: false,
    },
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // Keep this destination if it matches your Django registration flow.
      // If email verification is required, redirect to a verification page.
      router.replace("/");
      router.refresh();
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    mutation.reset();

    mutation.mutate({
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
      password_confirm: values.password_confirm,
    });
  };

  return (
    <main className="bg-page flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <div className="w-full max-w-lg sm:mx-auto">
        <section className="bg-card border-line rounded-card border p-6 shadow-card sm:p-9">
          <header className="mb-7 text-center">
            <div className="mb-5 flex items-center justify-center">
              <Link href="/" className="font-logo text-logo text-2xl">
                LAUNCHAFRICA
              </Link>
            </div>

            <h1 className="text-main text-2xl font-bold">
              Create your account
            </h1>

            <p className="text-soft mt-2 text-sm leading-6">
              Join the community building Africa&apos;s future.
            </p>
          </header>

          <div className="divider my-6">
            <span className="text-soft text-xs">SIGN UP WITH EMAIL</span>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* USERNAME */}
            <div>
              <label
                htmlFor="username"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Username
              </label>

              <input
                id="username"
                autoComplete="username"
                placeholder="Choose a username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
                {...register("username")}
                className="input-box rounded-pill w-full px-4 py-3"
              />

              {errors.username && (
                <p
                  id="username-error"
                  role="alert"
                  className="text-error mt-1 text-sm"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
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
                <p
                  id="email-error"
                  role="alert"
                  className="text-error mt-1 text-sm"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : "password-help"
                  }
                  {...register("password")}
                  className="input-box rounded-pill w-full px-4 py-3 pr-20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-pressed={showPassword}
                  className="text-soft hover:text-main absolute inset-y-0 right-4 my-auto text-sm font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p id="password-help" className="text-soft mt-2 text-xs">
                Use at least 8 characters and follow any additional password
                rules enforced by the server.
              </p>

              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-error mt-1 text-sm"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label
                htmlFor="password_confirm"
                className="text-main mb-2 block text-sm font-semibold"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="password_confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  aria-invalid={Boolean(errors.password_confirm)}
                  aria-describedby={
                    errors.password_confirm ? "confirm-error" : undefined
                  }
                  {...register("password_confirm")}
                  className="input-box rounded-pill w-full px-4 py-3 pr-20"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-pressed={showConfirmPassword}
                  className="text-soft hover:text-main absolute inset-y-0 right-4 my-auto text-sm font-semibold"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password_confirm && (
                <p
                  id="confirm-error"
                  role="alert"
                  className="text-error mt-1 text-sm"
                >
                  {errors.password_confirm.message}
                </p>
              )}
            </div>

            {/* TERMS AND CONDITIONS */}
            <div>
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  {...register("terms")}
                  aria-invalid={Boolean(errors.terms)}
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                  className="mt-1 size-4"
                />

                <label htmlFor="terms" className="text-main text-sm leading-5">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-semibold underline underline-offset-2"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              {errors.terms && (
                <p
                  id="terms-error"
                  role="alert"
                  className="text-error mt-1 text-sm"
                >
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* API ERROR */}
            {mutation.isError && (
              <p
                role="alert"
                aria-live="polite"
                className="text-error bg-input rounded-card p-3 text-sm"
              >
                {getErrorMessage(mutation.error)}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-main rounded-pill w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-soft mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-main font-bold hover:opacity-80"
            >
              Log in
            </Link>
          </p>
        </section>

        <p className="text-soft mt-6 text-center text-xs tracking-wide">
          Discover. Build. Launch. Grow.
        </p>
      </div>
    </main>
  );
}
