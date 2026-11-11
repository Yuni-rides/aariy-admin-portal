import ProductFormPage from "@/features/products/components/ProductFormPage";

export default function Page({ params }: { params: { id: string } }) {
  return <ProductFormPage productId={params.id} />;
}
