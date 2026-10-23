"use client";

import CreateCategoryForm from "@/components/categories/CreateCategoryForm";
import CategoryList from "@/components/categories/CategoryList";
import { useCurrentUser } from "@/src/hooks/useCategory";

export default function CategoriesPage() {
  const { data: currentUser, isPending, isError, error } = useCurrentUser();

  const isAdmin = Boolean(
    currentUser &&
    currentUser.is_active !== false &&
    (currentUser.is_staff ||
      currentUser.is_superuser ||
      currentUser.role === "admin"),
  );

  // Temporary debugging logs — inside the React component
  console.log("Current user:", currentUser);
  console.log("Is admin:", isAdmin);
  console.log("User request failed:", isError);
  console.log("User request error:", error);

  // Keep your existing return (...) below.

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-12">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            LaunchAfrica Categories
          </h1>
          <p className="mt-2 text-gray-600">
            Organize and discover projects across Africa.
          </p>
        </header>

        {isAdmin && <CreateCategoryForm />}

        {isPending && (
          <p className="text-sm text-gray-500">
            Checking your account permissions...
          </p>
        )}

        <CategoryList isAdmin={isAdmin} />
      </div>
    </main>
  );
}
