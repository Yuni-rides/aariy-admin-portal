"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Store,
  Package,
  Users,
  ShoppingBag,
  Layers,
  UserCog,
  ShieldCheck,
  Settings,
  Menu,
  User,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { useAuthStore } from "@/features/auth/auth.store";
import { requestForToken } from "@/lib/firebase";
import { AUTH_BYPASS } from "@/features/auth/auth.mock";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Screens that are designed but not built yet stay visible but disabled. */
  ready?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", ready: true },
  { label: "Categories", icon: FolderTree, href: "/categories", ready: true },
  { label: "Sellers", icon: Store, href: "/sellers", ready: true },
  { label: "Products", icon: Package, href: "/products", ready: true },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Orders", icon: ShoppingBag, href: "/orders" },
  { label: "Tier Management", icon: Layers, href: "/tiers" },
  { label: "Staff", icon: UserCog, href: "/staff" },
  { label: "Roles & Permissions", icon: ShieldCheck, href: "/roles" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

/* ---------------- SIDEBAR ---------------- */

export function Sidebar({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full w-[232px] flex-col gap-1 border-r border-sidebar-border bg-white px-3.5 py-5",
        className,
      )}
    >
      <div className="px-2.5">
        <div className="text-[22px] font-semibold leading-tight">Aariy</div>
        <div className="pb-4 text-xs text-muted-foreground">
          Super admin portal
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          const content = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm",
                isActive
                  ? "bg-accent font-semibold text-foreground"
                  : "text-sidebar-foreground hover:bg-muted",
                !item.ready && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="flex-1 truncate">{item.label}</span>
              {!item.ready && (
                <span className="text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              )}
            </div>
          );

          if (!item.ready) {
            return (
              <div key={item.href} aria-disabled="true">
                {content}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------- HEADER ---------------- */

export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    const token = AUTH_BYPASS ? null : await requestForToken();
    await logout(token || "");
  };

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "SA";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[232px] p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <span className="text-lg font-semibold">Aariy</span>
      </div>

      <div className="hidden flex-1 lg:flex" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 cursor-pointer rounded-full p-0"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-accent text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

/* ---------------- APP LAYOUT ---------------- */

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="fixed inset-y-0 left-0 z-20 hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[232px]">
        <Header />
        <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
