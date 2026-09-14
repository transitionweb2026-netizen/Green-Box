"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LayoutGrid,
  Sparkles,
  Users,
  MapPin,
  Clock,
  Wallet,
  Gift,
  RefreshCw,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SECTIONS = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الأقسام", icon: LayoutGrid },
  { href: "/admin/boxes", label: "صناديق جرين بوكس", icon: Sparkles },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/delivery-zones", label: "مناطق التوصيل", icon: MapPin },
  { href: "/admin/delivery-slots", label: "مواعيد التوصيل", icon: Clock },
  { href: "/admin/payments", label: "طرق الدفع", icon: Wallet },
  { href: "/admin/loyalty", label: "نقاط الولاء", icon: Gift },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: RefreshCw },
  { href: "/admin/staff", label: "الموظفون", icon: ShieldCheck },
  { href: "/admin/content", label: "المحتوى", icon: FileText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 py-2 md:w-64 md:shrink-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 md:py-5">
      {SECTIONS.map((section) => {
        const isActive = section.exact ? pathname === section.href : pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              isActive ? "bg-brand-gradient text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <section.icon className="h-4 w-4 shrink-0" />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
