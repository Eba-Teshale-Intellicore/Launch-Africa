"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { registerUser } from "@/lib/auth";
import type { ApiErrorBody } from "@/types/auth";

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
    terms: z.boolean().refine((accepted) => accepted, {
      message: "You must accept the Terms of Service and Privacy Policy.",
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
      router.push("/");
      router.refresh();
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    mutation.mutate({
      username: values.username,
      email: values.email,
      password: values.password,
      password_confirm: values.password_confirm,
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 text-center">
            <Link
              href="/"
              className="mb-4 block text-center text-2xl font-black tracking-tight text-[#101a2b]"
            >
              LAUNCH<span className="text-amber-500">AFRICA</span>
            </Link>

            <h1 className="text-2xl font-bold text-slate-900">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Join the community building Africa&apos;s future.
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Google sign-in is not configured yet"
            className="w-full cursor-not-allowed rounded-lg bg-[#101a2b] px-4 py-3 font-semibold text-white opacity-60"
          >
            Continue with Google (coming soon)
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              OR Continue with email
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-700"
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
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              {errors.username && (
                <p id="username-error" className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : "password-help"
                }
                {...register("password")}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <p id="password-help" className="mt-2 text-xs text-slate-500">
                Use at least 8 characters and follow any additional password
                rules shown.
              </p>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password_confirm"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="password_confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                aria-invalid={Boolean(errors.password_confirm)}
                aria-describedby={
                  errors.password_confirm ? "confirm-error" : undefined
                }
                {...register("password_confirm")}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              {errors.password_confirm && (
                <p id="confirm-error" className="mt-1 text-sm text-red-600">
                  {errors.password_confirm.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  {...register("terms")}
                  aria-invalid={Boolean(errors.terms)}
                  className="mt-1 size-4 accent-amber-500"
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-5 text-slate-600"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-slate-900 underline underline-offset-2"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-slate-900 underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.terms.message}
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

            {mutation.isSuccess && (
              <p role="status" className="text-sm text-green-700">
                Account created successfully. Redirecting…
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg bg-[#101a2b] px-4 py-3 font-semibold text-white transition hover:bg-[#22324b] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-amber-700 hover:text-amber-800"
            >
              Log in
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
