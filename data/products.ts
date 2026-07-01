export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  compareAtPrice?: number;
  cost?: number;
  stock?: number;
  reorderLevel?: number;
  sku?: string;
  barcode?: string;
  status?: "Active" | "Draft" | "Archived";
  supplier?: string;
  vendor?: string;
  productType?: string;
  collections?: string;
  tags?: string;
  marketplace?: "Amazon" | "Flipkart" | "Meesho" | "Myntra" | "Other" | "Manual";
  sourceUrl?: string;
  externalId?: string;
  imageUrl?: string;
  chargeTax?: boolean;
  trackQuantity?: boolean;
  continueSelling?: boolean;
  hasSkuBarcode?: boolean;
  physicalProduct?: boolean;
  weight?: number;
  weightUnit?: "kg" | "g" | "lb" | "oz";
  originCountry?: string;
  hsCode?: string;
  onlineStore?: boolean;
  pointOfSale?: boolean;
  marketIndia?: boolean;
  marketInternational?: boolean;
  seoTitle?: string;
  metaDescription?: string;
  optionName?: string;
  optionValues?: string;
  variants?: ProductVariant[];
  notes?: string;
  rating: number;
  reviews: number;
  badge?: string;
  colors: string[];
  sizes: string[];
  image: string;
  gallery: string[];
  description: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
};

export const products: Product[] = [];

export const categories = ["All"];

export const blogs = [
  {
    slug: "quiet-luxury-essentials",
    title: "The New Quiet Luxury Essentials",
    category: "Style",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    excerpt: "How minimal silhouettes, better materials, and fewer decisions shape a premium wardrobe."
  },
  {
    slug: "designing-a-smarter-cart",
    title: "Designing a Smarter Cart",
    category: "Commerce",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Small interaction details that make premium checkout flows feel calmer and faster."
  },
  {
    slug: "future-of-personal-shopping",
    title: "The Future of Personal Shopping",
    category: "AI",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    excerpt: "AI recommendations are becoming less noisy, more contextual, and more beautifully timed."
  }
];
