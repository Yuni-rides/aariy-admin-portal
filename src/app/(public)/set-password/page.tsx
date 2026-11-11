

import { Suspense } from "react";
import SetPasswordPage from "@/features/auth/components/SetPasswordPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SetPasswordPage />
    </Suspense>
  );
}
