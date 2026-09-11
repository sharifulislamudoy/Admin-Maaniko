import {
  Boxes,
  BookOpen,
  PackageOpen,
  ClipboardList,
  Images,
  LayoutDashboard,
  Settings,
  Shapes,
  ShieldCheck,
  TicketPercent,
  Users,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { href: "/guides", labelKey: "admin.navigation.guides", icon: BookOpen },
  { href: "/", labelKey: "admin.navigation.dashboard", icon: LayoutDashboard },
  { href: "/banners", labelKey: "admin.navigation.banners", icon: Images },
  { href: "/products", labelKey: "admin.navigation.products", icon: Boxes },
  { href: "/combos", labelKey: "admin.navigation.combos", icon: PackageOpen },
  {
    href: "/categories",
    labelKey: "admin.navigation.categories",
    icon: Shapes,
  },
  { href: "/orders", labelKey: "admin.navigation.orders", icon: ClipboardList },
  { href: "/customers", labelKey: "admin.navigation.customers", icon: Users },
  {
    href: "/coupons",
    labelKey: "admin.navigation.coupons",
    icon: TicketPercent,
  },
  {
    href: "/admin-management",
    labelKey: "admin.navigation.adminManagement",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
  { href: "/settings", labelKey: "admin.navigation.settings", icon: Settings },
] as const;
