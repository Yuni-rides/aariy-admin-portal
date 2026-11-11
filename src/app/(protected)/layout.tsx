import { AppLayout } from "@/components/layout";
import NotificationListener from "@/components/NotificationListener";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }
  return (
    <AppLayout>
      <NotificationListener />
      {children}
    </AppLayout>
  );
}
