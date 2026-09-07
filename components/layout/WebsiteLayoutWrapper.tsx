import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { fetchCategories, fetchArticles, fetchProducts } from "@/lib/api";
import { StickyFooterAd } from "@/components/ui/StickyFooterAd";
import BackToTop from "@/components/ui/BackToTop";

export default async function WebsiteLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, articlesData, products] = await Promise.all([
    fetchCategories(),
    fetchArticles(), // Remove status filter
    fetchProducts(),
  ]);

  // Extract articles array from the new API response format
  const articles = Array.isArray(articlesData) ? articlesData : articlesData.articles;

  return (
    <>
      <Header categories={categories} articles={articles} products={products} />
      {children}
      <Footer categories={categories} />
      <StickyFooterAd pageType="website" showOnAllPages={false} />
      <BackToTop />
    </>
  );
}
