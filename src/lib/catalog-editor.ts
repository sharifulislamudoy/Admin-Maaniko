import type {
  BannerPayload,
  CatalogPayload,
  CatalogResource,
  CatalogRow,
  CloudinaryImage,
  ComboPayload,
  ContentText,
  ProductPayload,
} from "@/types/catalog";

export const emptyText = (): ContentText => "";

const productTemplate = (): ProductPayload => ({
  slug: "",
  sku: "",
  name: emptyText(),
  description: emptyText(),
  category: { slug: "", name: emptyText() },
  badge: emptyText(),
  images: [],
  price: 0,
  compareAtPrice: null,
  stock: 0,
  rating: 5,
  reviewCount: 0,
  status: "DRAFT",
  featured: false,
  journeySlugs: [],
  details: { includedItems: [], whyEssential: [], preferredFor: [] },
  attributes: [],
  variants: [],
});

const comboTemplate = (): ComboPayload => ({
  slug: "",
  sku: "",
  name: emptyText(),
  subtitle: emptyText(),
  description: emptyText(),
  images: [],
  items: [],
  price: 0,
  compareAtPrice: 0,
  stock: 0,
  rating: 5,
  reviewCount: 0,
  status: "DRAFT",
  journeyStage: emptyText(),
  whyThisBox: [],
  preferredFor: [],
  usageGuide: [],
  selectionReasons: [],
  packaging: [],
  reviews: [],
  faqs: [],
});

const bannerTemplate = (): BannerPayload => ({
  key: "",
  placement: "SHOP_HERO",
  desktopImage: "",
  mobileImage: "",
  eyebrow: emptyText(),
  title: emptyText(),
  description: emptyText(),
  buttonLabel: "সমাধানগুলো দেখুন",
  link: "/shop",
  tone: "pink",
  isPublished: true,
  sortOrder: 0,
  startsAt: null,
  endsAt: null,
});

export function createTemplate(resource: "products"): ProductPayload;
export function createTemplate(resource: "combos"): ComboPayload;
export function createTemplate(resource: "banners"): BannerPayload;
export function createTemplate(resource: CatalogResource): CatalogPayload;
export function createTemplate(resource: CatalogResource): CatalogPayload {
  if (resource === "products") return productTemplate();
  if (resource === "combos") return comboTemplate();
  return bannerTemplate();
}

function asText(value: unknown): ContentText {
  return typeof value === "string" ? value : "";
}

function asImages(row: CatalogRow): CloudinaryImage[] {
  const records = Array.isArray(row.imageRecords) ? row.imageRecords : [];
  if (records.length) {
    return records.map((record) => {
      const image = record as Record<string, unknown>;
      return {
        url: String(image.url ?? ""),
        publicId: image.publicId ? String(image.publicId) : undefined,
        alt: image.alt ? String(image.alt) : undefined,
      };
    });
  }
  return (Array.isArray(row.images) ? row.images : []).map((image) =>
    typeof image === "string" ? { url: image } : (image as CloudinaryImage),
  );
}

export function payloadFromRow(
  resource: "products",
  row: CatalogRow,
): ProductPayload;
export function payloadFromRow(
  resource: "combos",
  row: CatalogRow,
): ComboPayload;
export function payloadFromRow(
  resource: "banners",
  row: CatalogRow,
): BannerPayload;
export function payloadFromRow(
  resource: CatalogResource,
  row: CatalogRow,
): CatalogPayload;
export function payloadFromRow(
  resource: CatalogResource,
  row: CatalogRow,
): CatalogPayload {
  if (resource === "products") {
    const base = productTemplate();
    return {
      ...base,
      ...(structuredClone(row) as Partial<ProductPayload>),
      name: asText(row.name),
      description: asText(row.description),
      badge: asText(row.badge),
      category: {
        slug: String(row.categorySlug ?? ""),
        name: asText(row.category),
      },
      images: asImages(row),
      journeySlugs: (
        (row.journeys as Array<{ slug?: string }> | undefined) ?? []
      )
        .map((item) => item.slug ?? "")
        .filter(Boolean),
      details: {
        includedItems: (
          (row.details as ProductPayload["details"] | undefined)
            ?.includedItems ?? []
        ).map((item) => ({ name: asText(item.name), image: item.image })),
        whyEssential: (
          (row.details as ProductPayload["details"] | undefined)
            ?.whyEssential ?? []
        ).map(asText),
        preferredFor: (
          (row.details as ProductPayload["details"] | undefined)
            ?.preferredFor ?? []
        ).map(asText),
      },
      attributes: (
        (row.attributes as ProductPayload["attributes"] | undefined) ?? []
      ).map((attribute) => ({
        name: asText(attribute.name),
        values: attribute.values.map((value) => ({
          value: asText(value.value),
          colorHex: value.colorHex ?? undefined,
        })),
      })),
      variants: (
        (row.variants as ProductPayload["variants"] | undefined) ?? []
      ).map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price ?? null,
        compareAtPrice: variant.compareAtPrice ?? null,
        stock: variant.stock,
        imageUrl: variant.imageUrl ?? null,
        isActive: variant.isActive ?? true,
        selections: variant.selections ?? [],
      })),
    };
  }

  if (resource === "combos") {
    const base = comboTemplate();
    return {
      ...base,
      ...(structuredClone(row) as Partial<ComboPayload>),
      name: asText(row.name),
      subtitle: asText(row.subtitle),
      description: asText(row.description),
      journeyStage: asText(row.journeyStage),
      images: asImages(row),
      items: (
        (row.items as Array<Record<string, unknown>> | undefined) ?? []
      ).map((item) => ({
        productId: String(item.productId ?? ""),
        quantity: Number(item.quantity ?? 1),
        variant: item.variant ? asText(item.variant) : undefined,
      })),
      whyThisBox: ((row.whyThisBox as ContentText[] | undefined) ?? []).map(
        asText,
      ),
      preferredFor: (
        (row.preferredFor as ContentText[] | undefined) ?? []
      ).map(asText),
      selectionReasons: (
        (row.selectionReasons as ContentText[] | undefined) ?? []
      ).map(asText),
      packaging: ((row.packaging as ContentText[] | undefined) ?? []).map(
        asText,
      ),
      usageGuide: (
        (row.usageGuide as ComboPayload["usageGuide"] | undefined) ?? []
      ).map((item) => ({
        id: item.id,
        title: asText(item.title),
        description: asText(item.description),
      })),
      reviews: ((row.reviews as ComboPayload["reviews"] | undefined) ?? []).map(
        (item) => ({
          id: item.id,
          customerName: item.customerName,
          rating: item.rating,
          review: asText(item.review),
        }),
      ),
      faqs: ((row.faqs as ComboPayload["faqs"] | undefined) ?? []).map(
        (item) => ({
          id: item.id,
          question: asText(item.question),
          answer: asText(item.answer),
        }),
      ),
    };
  }

  const base = bannerTemplate();
  return {
    ...base,
    ...(structuredClone(row) as Partial<BannerPayload>),
    desktopImage: String(row.desktopImage ?? row.imageUrl ?? ""),
    mobileImage: String(row.mobileImage ?? row.mobileImageUrl ?? ""),
    publicId: row.publicId ? String(row.publicId) : undefined,
    mobilePublicId: row.mobilePublicId ? String(row.mobilePublicId) : undefined,
    eyebrow: asText(row.eyebrow),
    title: asText(row.title),
    description: asText(row.description),
    buttonLabel: asText(row.buttonLabel),
    link: String(row.link ?? row.productLink ?? row.buttonHref ?? ""),
    startsAt: row.startsAt ? toDateTimeLocal(String(row.startsAt)) : null,
    endsAt: row.endsAt ? toDateTimeLocal(String(row.endsAt)) : null,
  };
}

export function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function copyBanglaToFallback(value: unknown): unknown {
  return value;
}

/**
 * Plain single-field catalog payload পাঠায়।
 */
export function toBanglaPayload(payload: CatalogPayload): CatalogPayload {
  return copyBanglaToFallback(payload) as CatalogPayload;
}
