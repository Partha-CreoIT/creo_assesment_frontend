"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileQuestion,
  LayoutDashboard,
  LogOut,
  ScrollText,
} from "lucide-react";
import { tokens } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/questions", label: "Question Bank", icon: FileQuestion },
  { href: "/admin/exams", label: "Exams & Sets", icon: ScrollText },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!tokens.admin.get()) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [isLogin, router, pathname]);

  if (isLogin) return <>{children}</>;
  if (!ready) return <Spinner className="min-h-screen" />;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-56 flex-col bg-ink text-paper">
        <div className="border-b border-paper/15 px-5 py-5">
          <p className="font-display text-xl italic">Exam Taker</p>
          <p className="label-caps mt-0.5 !text-paper/50">Examiner&apos;s Office</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-paper text-ink font-medium"
                    : "text-paper/70 hover:bg-paper/10 hover:text-paper"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => {
            tokens.admin.clear();
            router.replace("/admin/login");
          }}
          className="flex items-center gap-3 border-t border-paper/15 px-5 py-4 text-sm text-paper/70 hover:text-paper"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="ml-56 min-h-screen flex-1 bg-paper px-8 py-8">
        {children}
      </main>
    </div>
  );
}
