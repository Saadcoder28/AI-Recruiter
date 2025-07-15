"use client";

/*
 ─────────────────────────────────────────────────────────
 DASHBOARD LAYOUT  (Next App Router)
 ─────────────────────────────────────────────────────────
 • Vertical sidebar with brand, CTA button, nav items
 • Protected route – redirects to /auth if no Supabase session
 • Zero Sign‑Out buttons in UI (sign‑out helper still available)
 • Billing link and icon removed
─────────────────────────────────────────────────────────*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineCollection,
  HiOutlinePlus,
} from "react-icons/hi";

/* ───────── Sidebar ───────── */
function Sidebar({ user }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard",           label: "Dashboard",           icon: HiOutlineViewGrid },
    { href: "/dashboard/scheduled", label: "Scheduled Interview", icon: HiOutlineCalendar },
    { href: "/dashboard/all",       label: "All Interview",        icon: HiOutlineCollection },
  ];

  return (
    <aside className="h-screen w-64 shrink-0 border-r bg-white/80 backdrop-blur-lg flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <span className="text-sky-600 text-2xl">🎙️</span>
        <span className="font-bold text-lg">AIcruiter</span>
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/new"
        className="mx-4 mt-6 flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 transition-colors"
      >
        <HiOutlinePlus className="text-xl" />
        Create New Interview
      </Link>

      {/* Nav */}
      <nav className="mt-8 flex-1 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sky-50 hover:text-sky-700 transition-colors ${
              pathname === href ? "bg-sky-100 text-sky-700" : "text-gray-700"
            }`}
          >
            <Icon className="text-lg" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Avatar footer (no sign‑out button) */}
      <div className="border-t p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-sky-200 grid place-items-center uppercase font-semibold text-sky-700">
          {user?.email?.[0] || "?"}
        </div>
        <div className="text-sm leading-tight truncate">
          <p className="font-medium text-gray-800">{user?.email || "…"}</p>
          <p className="text-gray-500">Welcome Back</p>
        </div>
      </div>
    </aside>
  );
}

/* ───────── Layout wrapper ───────── */
export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  /* helper available if you want to sign out elsewhere */
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/auth");
      } else {
        setUser(data.user);
        setLoading(false);
      }
    });
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
