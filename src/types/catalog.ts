export type ContentText = string;

export type CatalogStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type CloudinaryImage = {
  url: string;
  publicId?: string;
  alt?: ContentText;
};

export type ProductAttribute = {
  name: ContentText;
  values: Array<{
    value: ContentText;
    colorHex?: string;
  }>;
};

export type ProductVariant = {
  id?: string;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  selections: Array<{ attribute: string; value: string }>;
};

export type ProductPayload = {
  slug: string;
  sku: string;
  name: ContentText;
  description: ContentText;
  category: { slug: string; name: ContentText };
  badge: ContentText;
  images: CloudinaryImage[];
  price: number;
  compareAtPrice: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  status: CatalogStatus;
  featured: boolean;
  journeySlugs: string[];
  details: {
    includedItems: Array<{ name: ContentText; image?: string }>;
    whyEssential: ContentText[];
    preferredFor: ContentText[];
  };
  attributes: ProductAttribute[];
  variants: ProductVariant[];
};

export type ComboPayload = {
  slug: string;
  sku: string;
  name: ContentText;
  subtitle: ContentText;
  description: ContentText;
  images: CloudinaryImage[];
  items: Array<{
    productId: string;
    quantity: number;
    variant?: ContentText;
  }>;
  price: number;
  compareAtPrice: number;
  stock: number;
  rating: number;
  reviewCount: number;
  status: CatalogStatus;
  journeyStage: ContentText;
  whyThisBox: ContentText[];
  preferredFor: ContentText[];
  usageGuide: Array<{
    id?: string;
    title: ContentText;
    description: ContentText;
  }>;
  selectionReasons: ContentText[];
  packaging: ContentText[];
  reviews: Array<{
    id?: string;
    customerName: string;
    rating: number;
    review: ContentText;
  }>;
  faqs: Array<{
    id?: string;
    question: ContentText;
    answer: ContentText;
  }>;
};

export type BannerPayload = {
  key: string;
  placement:
    | "HOME_HERO"
    | "SHOP_HERO"
    | "GUIDE_HERO"
    | "SOLUTION_GUIDE";
  desktopImage: string;
  mobileImage: string;
  publicId?: string;
  mobilePublicId?: string;
  eyebrow: ContentText;
  title: ContentText;
  description: ContentText;
  buttonLabel: ContentText;
  link: string;
  tone: string;
  isPublished: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

export type CatalogResource = "products" | "combos" | "banners";
export type CatalogPayload = ProductPayload | ComboPayload | BannerPayload;

export type CatalogRow = Record<string, unknown> & { id: string };

export type ProductOption = {
  id: string;
  sku: string;
  name: ContentText;
  images?: string[];
};
