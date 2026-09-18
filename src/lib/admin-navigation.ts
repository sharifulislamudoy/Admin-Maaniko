import {
  Boxes,
  BookOpen,
  Bot,
  PackageOpen,
  ClipboardList,
  Images,
  LayoutDashboard,
  Settings,
  Shapes,
  ShieldCheck,
  TicketPercent,
  Users,
  Headphones,
  ScrollText,
  Warehouse,
  ChartNoAxesCombined,
  BellRing,
  MessageSquareText,
  TrendingUp,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { href: "/", labelKey: "admin.navigation.dashboard", icon: LayoutDashboard },
  { href: "/banners", labelKey: "admin.navigation.banners", icon: Images },
  { href: "/products", labelKey: "admin.navigation.products", icon: Boxes },
  {
    href: "/inventory",
    labelKey: "admin.navigation.inventory",
    icon: Warehouse,
  },
  { href: "/combos", labelKey: "admin.navigation.combos", icon: PackageOpen },
  { href: "/guides", labelKey: "admin.navigation.guides", icon: BookOpen },
  {
    href: "/categories",
    labelKey: "admin.navigation.categories",
    icon: Shapes,
  },
  { href: "/orders", labelKey: "admin.navigation.orders", icon: ClipboardList },
  {
    href: "/reviews",
    labelKey: "admin.navigation.reviews",
    icon: MessageSquareText,
  },
  {
    href: "/notifications",
    labelKey: "admin.navigation.notifications",
    icon: BellRing,
  },
  {
    href: "/finance",
    labelKey: "admin.navigation.finance",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/growth",
    labelKey: "admin.navigation.growth",
    icon: TrendingUp,
  },
  { href: "/customers", labelKey: "admin.navigation.customers", icon: Users },
  {
    href: "/ai-assistant",
    labelKey: "admin.navigation.aiAssistant",
    icon: Bot,
  },
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

export const ADMIN_PAGE_GROUPS = [
  {
    key: "support-pages",
    label: "Support pages",
    icon: Headphones,
    children: [
      { href: "/pages/help-center", label: "Help center" },
      { href: "/pages/how-to-order", label: "How to order" },
      { href: "/pages/contact-us", label: "Contact us" },
    ],
  },
  {
    key: "policy-pages",
    label: "Policy pages",
    icon: ScrollText,
    children: [
      { href: "/pages/shipping-policy", label: "Shipping policy" },
      { href: "/pages/return-refund-policy", label: "Return & refund" },
      { href: "/pages/privacy-policy", label: "Privacy policy" },
      { href: "/pages/terms-and-conditions", label: "Terms & conditions" },
      { href: "/pages/cancellation-policy", label: "Cancellation policy" },
    ],
  },
] as const;
