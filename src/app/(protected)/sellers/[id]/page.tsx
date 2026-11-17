import SellerDetailPage from "@/features/sellers/components/SellerDetailPage";

export default function Page({ params }: { params: { id: string } }) {
  return <SellerDetailPage sellerId={params.id} />;
}
