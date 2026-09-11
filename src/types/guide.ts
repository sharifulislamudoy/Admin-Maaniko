export type GuideStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type GuideCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isPublished: boolean;
};
export type GuideSection = { title: string; body: string; points: string[] };
export type GuideSource = { label: string; url: string };
export type GuideInfoItem = {
  icon: "message" | "file" | "refresh" | "research" | "edit" | "check";
  text: string;
};
export type GuidePageContent = {
  title: string;
  description: string;
  searchPlaceholder: string;
  trustTitle: string;
  journeyTitle: string;
  featuredTitle: string;
  popularTitle: string;
  processTitle: string;
  processNote: string;
  noticeTitle: string;
  noticeText: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
  trustItems: GuideInfoItem[];
  processItems: GuideInfoItem[];
};
export type GuideCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverPublicId: string | null;
  coverAlt: string;
  authorName: string;
  readMinutes: number;
  pdfUrl: string | null;
  pageCount: number | null;
  featured: boolean;
  popular: boolean;
  sortOrder: number;
  publishedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string;
  category: Pick<GuideCategory, "id" | "slug" | "name">;
};
export type Guide = GuideCardData & {
  categoryId: string;
  status: GuideStatus;
  sections: GuideSection[];
  sources: GuideSource[];
};
export type GuideHub = {
  page: GuidePageContent | null;
  categories: GuideCategory[];
  featuredGuides: GuideCardData[];
};
export type GuideList = {
  items: GuideCardData[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};
export type GuideDetail = {
  guide: Guide;
  related: GuideCardData[];
  page: GuidePageContent | null;
};
