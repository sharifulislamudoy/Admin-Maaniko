export type AdminResource =
  "banners" | "products" | "categories" | "orders" | "customers" | "coupons";

type CollectionRow = Record<string, string> & { id: string };
type Collection = { columns: string[]; rows: CollectionRow[] };

export const COLLECTIONS: Record<AdminResource, Collection> = {
  banners: {
    columns: ["name", "link", "status", "updated"],
    rows: [
      {
        id: "BN-01",
        name: "Maaniko Main Campaign",
        link: "/shop",
        status: "published",
        updated: "07 Aug 2026",
      },
      {
        id: "BN-02",
        name: "New Mother Essentials",
        link: "/categories/mother",
        status: "published",
        updated: "06 Aug 2026",
      },
      {
        id: "BN-03",
        name: "Weekend Offer",
        link: "/offers",
        status: "draft",
        updated: "04 Aug 2026",
      },
    ],
  },
  products: {
    columns: ["product", "sku", "price", "stock", "status"],
    rows: [
      {
        id: "PR-01",
        product: "Premium Maternity Pillow",
        sku: "MN-PIL-001",
        price: "৳2,450",
        stock: "28",
        status: "active",
      },
      {
        id: "PR-02",
        product: "Baby Care Gift Box",
        sku: "MN-GFT-014",
        price: "৳1,850",
        stock: "46",
        status: "active",
      },
      {
        id: "PR-03",
        product: "Nursing Cover",
        sku: "MN-NUR-008",
        price: "৳950",
        stock: "0",
        status: "inactive",
      },
    ],
  },
  categories: {
    columns: ["name", "products", "status", "updated"],
    rows: [
      {
        id: "CT-01",
        name: "Mother Care",
        products: "84",
        status: "active",
        updated: "07 Aug 2026",
      },
      {
        id: "CT-02",
        name: "Baby Essentials",
        products: "126",
        status: "active",
        updated: "06 Aug 2026",
      },
      {
        id: "CT-03",
        name: "Gift Sets",
        products: "32",
        status: "active",
        updated: "03 Aug 2026",
      },
    ],
  },
  orders: {
    columns: ["orderId", "customer", "total", "status", "updated"],
    rows: [
      {
        id: "MN-1048",
        orderId: "MN-1048",
        customer: "Sadia Rahman",
        total: "৳4,850",
        status: "processing",
        updated: "07 Aug 2026",
      },
      {
        id: "MN-1047",
        orderId: "MN-1047",
        customer: "Nusrat Jahan",
        total: "৳2,990",
        status: "delivered",
        updated: "07 Aug 2026",
      },
      {
        id: "MN-1046",
        orderId: "MN-1046",
        customer: "Raisa Ahmed",
        total: "৳1,650",
        status: "pending",
        updated: "06 Aug 2026",
      },
    ],
  },
  customers: {
    columns: ["customer", "phone", "orders", "totalSpent", "status"],
    rows: [
      {
        id: "CU-01",
        customer: "Sadia Rahman",
        phone: "01711-111111",
        orders: "12",
        totalSpent: "৳28,500",
        status: "active",
      },
      {
        id: "CU-02",
        customer: "Nusrat Jahan",
        phone: "01822-222222",
        orders: "8",
        totalSpent: "৳17,920",
        status: "active",
      },
      {
        id: "CU-03",
        customer: "Raisa Ahmed",
        phone: "01933-333333",
        orders: "3",
        totalSpent: "৳6,450",
        status: "active",
      },
    ],
  },
  coupons: {
    columns: ["code", "discount", "usage", "expires", "status"],
    rows: [
      {
        id: "CP-01",
        code: "MAANIKO10",
        discount: "10%",
        usage: "84 / 200",
        expires: "31 Aug 2026",
        status: "active",
      },
      {
        id: "CP-02",
        code: "NEWMOM",
        discount: "৳250",
        usage: "36 / 100",
        expires: "15 Sep 2026",
        status: "active",
      },
      {
        id: "CP-03",
        code: "FREESHIP",
        discount: "৳80",
        usage: "150 / 150",
        expires: "01 Aug 2026",
        status: "inactive",
      },
    ],
  },
};
