import { Suspense } from "react";
import OrdersPage from "@/features/orders/components/OrdersPage";

export default function Page() {
  // OrdersPage reads ?order= from the URL, which needs a Suspense boundary.
  return (
    <Suspense>
      <OrdersPage />
    </Suspense>
  );
}
