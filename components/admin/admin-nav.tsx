"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const SECTIONS = [
  { href: "/admin", label: "لوحة التحكم", exact: true },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/products", label: "المنتجات" },
  { href: "/admin/categories", label: "الأقسام" },
  { href: "/admin/boxes", label: "صناديق جرين بوكس" },
  { href: "/admin/customers", label: "العملاء" },
  { href: "/admin/delivery-zones", label: "مناطق التوصيل" },
  { href: "/admin/delivery-slots", label: "مواعيد التوصيل" },
  { href: "/admin/payments", label: "طرق الدفع" },
  { href: "/admin/loyalty", label: "نقاط الولاء" },
  { href: "/admin/subscriptions", label: "الاشتراكات" },
  { href: "/admin/content", label: "المحتوى" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-e md:px-2 md:py-4">
      {SECTIONS.map((section) => {
        const isActive = section.exact ? pathname === section.href : pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
              isActive ? "bg-brand-600 text-white" : "text-foreground hover:bg-brand-50",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
