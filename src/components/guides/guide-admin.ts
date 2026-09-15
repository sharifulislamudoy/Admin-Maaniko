import type { Guide, GuidePageContent, GuideStatus } from "@/types/guide";

export type GuideInput = Pick<
  Guide,
  | "slug"
  | "title"
  | "excerpt"
  | "coverImage"
  | "coverPublicId"
  | "coverAlt"
  | "authorName"
  | "readMinutes"
  | "pdfUrl"
  | "pageCount"
  | "status"
  | "featured"
  | "popular"
  | "sortOrder"
  | "publishedAt"
  | "reviewedAt"
  | "categoryId"
  | "sections"
  | "sources"
>;

export const statusLabels: Record<GuideStatus, string> = {
  ACTIVE: "প্রকাশিত",
  DRAFT: "খসড়া",
  ARCHIVED: "আর্কাইভ",
};

export function toGuideInput(guide?: Guide, categoryId = ""): GuideInput {
  if (!guide)
    return {
      slug: "",
      title: "",
      excerpt: "",
      coverImage: "",
      coverPublicId: null,
      coverAlt: "",
      authorName: "Maaniko তথ্য সংকলন",
      readMinutes: 3,
      pdfUrl: null,
      pageCount: null,
      status: "DRAFT",
      featured: false,
      popular: false,
      sortOrder: 0,
      publishedAt: null,
      reviewedAt: null,
      categoryId,
      sections: [{ title: "", body: "", points: [] }],
      sources: [{ label: "", url: "" }],
    };
  return {
    slug: guide.slug,
    title: guide.title,
    excerpt: guide.excerpt,
    coverImage: guide.coverImage,
    coverPublicId: guide.coverPublicId,
    coverAlt: guide.coverAlt,
    authorName: guide.authorName,
    readMinutes: guide.readMinutes,
    pdfUrl: guide.pdfUrl,
    pageCount: guide.pageCount,
    status: guide.status,
    featured: guide.featured,
    popular: guide.popular,
    sortOrder: guide.sortOrder,
    publishedAt: guide.publishedAt,
    reviewedAt: guide.reviewedAt,
    categoryId: guide.categoryId,
    sections: guide.sections.map(({ title, body, points }) => ({
      title,
      body,
      points,
    })),
    sources: guide.sources.map(({ label, url }) => ({ label, url })),
  };
}

export async function guideAdminRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/catalog/${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? body.message
        : "অনুরোধটি সম্পন্ন হয়নি।";
    throw new Error(
      Array.isArray(message) ? message.join(" · ") : String(message),
    );
  }
  return body as T;
}

export const pageFieldLabels: Record<
  Exclude<keyof GuidePageContent, "trustItems" | "processItems">,
  string
> = {
  title: "পেজের শিরোনাম / SEO title",
  description: "পেজের বিবরণ / SEO description",
  searchPlaceholder: "সার্চের ভেতরের লেখা",
  trustTitle: "তথ্যের মান শিরোনাম",
  journeyTitle: "জার্নি শিরোনাম",
  featuredTitle: "বিশেষ গাইড শিরোনাম",
  popularTitle: "জনপ্রিয় গাইড শিরোনাম",
  processTitle: "তৈরির প্রক্রিয়ার শিরোনাম",
  processNote: "প্রক্রিয়ার নিচের লেখা",
  noticeTitle: "স্বাস্থ্য নোটের শিরোনাম",
  noticeText: "স্বাস্থ্য নোটের বিস্তারিত",
  ctaTitle: "শেষের অংশের শিরোনাম",
  ctaDescription: "শেষের অংশের বিবরণ",
  ctaLabel: "শেষের বাটনের লেখা",
};

export function emptyGuidePage(): GuidePageContent {
  return {
    title: "",
    description: "",
    searchPlaceholder: "",
    trustTitle: "",
    journeyTitle: "",
    featuredTitle: "",
    popularTitle: "",
    processTitle: "",
    processNote: "",
    noticeTitle: "",
    noticeText: "",
    ctaTitle: "",
    ctaDescription: "",
    ctaLabel: "",
    trustItems: [
      { icon: "message", text: "" },
      { icon: "file", text: "" },
      { icon: "refresh", text: "" },
    ],
    processItems: [
      { icon: "research", text: "" },
      { icon: "edit", text: "" },
      { icon: "check", text: "" },
    ],
  };
}
