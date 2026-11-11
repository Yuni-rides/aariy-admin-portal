"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/settings" }
];

export const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <>
      <header
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          background: "#111827",
          color: "#e5e7eb"
        }}
      >
        <span style={{ fontWeight: 600 }}>ModularApp</span>
        <nav style={{ display: "flex", gap: "1rem", fontSize: 14 }}>
          <Link href="/dashboard">App</Link>
          <Link href="/login">Logout</Link>
        </nav>
      </header>
      <div className="app-layout">
        <aside className="app-sidebar">
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              marginBottom: 8,
              color: "#9ca3af"
            }}
          >
            Main
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "0.4rem 0.6rem",
                    borderRadius: 6,
                    fontSize: 14,
                    background: active ? "#374151" : "transparent",
                    color: active ? "#f9fafb" : "#d1d5db"
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="app-content">{children}</main>
      </div>
    </>
  );
};
