import CreateProductForm from "@/components/products/CreateProductForm";

export default function NewProductPage() {
  return (
    <main className="bg-page min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      <div className="w-page mx-auto">
        <CreateProductForm />
      </div>
    </main>
  );
}
