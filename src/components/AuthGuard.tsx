"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) {
      router.replace(`/login?redirect=${pathname}`);
    }
  }, [token, pathname, router]);

  if (!token) return null; 

  return <>{children}</>;
}
