import ContentPageEditor from "@/components/content-pages/ContentPageEditor";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentPageEditor slug={slug} />;
}
