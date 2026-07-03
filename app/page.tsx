import { CategorySection, FeaturedCollections, FlashSale, Hero, InstagramGallery, Newsletter, ProductRail, Testimonials, TrustAndSocial } from "@/components/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductRail title="Featured products" />
      <FeaturedCollections />
      <CategorySection />
      <FlashSale />
      <ProductRail title="Best sellers" />
      <Testimonials />
      <ProductRail title="Trending now" />
      <TrustAndSocial />
      <InstagramGallery />
      <Newsletter />
    </>
  );
}
