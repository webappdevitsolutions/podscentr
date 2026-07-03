"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Minus, Plus, Ruler, ShieldCheck, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { trackMetaEvent } from "@/lib/meta-client";
import { formatCurrency } from "@/lib/utils";

const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];

type AccordionItem = {
  title: string;
  content: React.ReactNode;
};

function getDiscount(price: number, comparePrice?: number) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function splitText(value: string) {
  return value
    .split(/\n{2,}|\r\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="grid grid-cols-[145px_1fr] gap-3 border-b border-black/5 py-3 text-sm last:border-b-0 dark:border-white/10">
      <dt className="font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="font-normal text-neutral-900 dark:text-white">{value || "Not specified"}</dd>
    </div>
  );
}

function RatingLine({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <a href="#customer-reviews" className="group mt-4 inline-flex flex-wrap items-center gap-2 text-sm font-bold">
      <span className="flex text-amber-500" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={18} className="fill-amber-500" />
        ))}
      </span>
      <span>{rating.toFixed(1)}</span>
      <span className="text-neutral-400">|</span>
      <span className="underline-offset-4 group-hover:underline">({reviews} Reviews)</span>
    </a>
  );
}

function Accordion({ item, defaultOpen = false }: { item: AccordionItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-black/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-semibold sm:text-base"
      >
        <span>{item.title}</span>
        {open ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="pb-5 text-neutral-600 dark:text-neutral-300">{item.content}</div>
        </div>
      </div>
    </div>
  );
}

function DescriptionBlock({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(170);
  const contentRef = useRef<HTMLDivElement>(null);
  const paragraphs = splitText(description);
  const hasLongDescription = description.length > 260 || paragraphs.length > 2;

  useEffect(() => {
    function updateHeight() {
      if (contentRef.current) setHeight(contentRef.current.scrollHeight);
    }

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [description]);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
      <h2 className="text-lg font-semibold">Description</h2>
      <div
        className="mt-4 overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{ maxHeight: expanded || !hasLongDescription ? `${height}px` : "8.6rem" }}
      >
        <div ref={contentRef} className="max-w-[680px] space-y-4 text-[15px] font-normal leading-[1.75] text-neutral-650 dark:text-neutral-300 sm:text-[16px]">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => {
              const isBullet = /^[-*]/.test(paragraph);
              const isHeading = paragraph.length < 70 && !paragraph.endsWith(".") && index > 0;

              if (isBullet) {
                return (
                  <ul key={paragraph} className="list-disc space-y-2 pl-5 text-[15px] font-normal leading-[1.75] sm:text-[16px]">
                    {paragraph
                      .split(/\n/)
                      .map((item) => item.replace(/^[-*]\s*/, "").trim())
                      .filter(Boolean)
                      .map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                  </ul>
                );
              }

              if (isHeading) {
                return <p key={paragraph} className="text-[15px] font-normal leading-[1.75] text-neutral-700 dark:text-neutral-300 sm:text-[16px]">{paragraph}</p>;
              }

              return <p key={`${paragraph}-${index}`} className="text-[15px] font-normal leading-[1.75] sm:text-[16px]">{paragraph}</p>;
            })
          ) : (
            <p>Product details will be updated soon.</p>
          )}
        </div>
      </div>
      {hasLongDescription ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold transition hover:border-neutral-950 dark:border-white/15"
        >
          {expanded ? "See Less" : "See More"} {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      ) : null}
    </section>
  );
}

function ReviewCard({ name, title, text }: { name: string; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={16} className="fill-amber-500" />
        ))}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{text}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{name}</p>
    </article>
  );
}

export function ProductDetails({ product }: { product: Product }) {
  const router = useRouter();
  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const availableSizes = product.sizes?.length && !product.sizes.includes("Default") ? product.sizes : defaultSizes;
  const availableColors = product.colors?.length && !product.colors.includes("Default") ? product.colors : ["Classic"];
  const [image, setImage] = useState(gallery[0]);
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [color, setColor] = useState(availableColors[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const trackedViewContent = useRef(false);

  const comparePrice = product.compareAtPrice || product.oldPrice;
  const discount = getDiscount(product.price, comparePrice);
  const rating = product.reviews ? product.rating : 4.8;
  const reviews = product.reviews || 126;
  const material = product.tags?.toLowerCase().includes("cotton") ? "Cotton" : "Premium cotton blend";
  const brand = product.vendor || product.supplier || "Podscentra";
  const weight = product.weight ? `${product.weight} ${product.weightUnit || "kg"}` : "Standard";

  useEffect(() => {
    if (trackedViewContent.current) return;
    trackedViewContent.current = true;
    void trackMetaEvent("ViewContent", {
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: "INR"
    });
    void trackAnalyticsEvent("product_view", {
      productId: product.id,
      value: product.price
    });
  }, [product.id, product.price]);

  const accordions = useMemo<AccordionItem[]>(
    () => [
      {
        title: "Product Details",
        content: (
          <dl>
            <DetailRow label="Brand" value={brand} />
            <DetailRow label="Material" value={material} />
            <DetailRow label="Fit" value={product.productType || "Regular fit"} />
            <DetailRow label="Sleeve" value="Short sleeve" />
            <DetailRow label="Collar" value="Classic collar" />
            <DetailRow label="Pattern" value={product.category || "Solid"} />
            <DetailRow label="Country of Origin" value={product.originCountry || "India"} />
          </dl>
        )
      },
      {
        title: "Care Instructions",
        content: (
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            <li>Machine wash</li>
            <li>Do not bleach</li>
            <li>Iron on low heat</li>
            <li>Dry in shade</li>
          </ul>
        )
      },
      {
        title: "Specifications",
        content: (
          <dl>
            <DetailRow label="Category" value={product.category} />
            <DetailRow label="Vendor" value={brand} />
            <DetailRow label="SKU" value={product.sku} />
            <DetailRow label="Weight" value={weight} />
            <DetailRow label="Color" value={color} />
            <DetailRow label="Material" value={material} />
            <DetailRow label="Season" value="All season" />
          </dl>
        )
      },
      {
        title: "Shipping & Returns",
        content: (
          <div className="grid gap-3 sm:grid-cols-2">
            {["Free Shipping", "7-Day Returns", "Cash on Delivery", "Secure Payments"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 text-sm font-bold dark:bg-white/5">
                <ShieldCheck size={17} className="text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        )
      }
    ],
    [brand, color, material, product.category, product.originCountry, product.productType, product.sku, weight]
  );

  function validateSelection() {
    if (availableSizes.length && !size) {
      setSizeError("Please select a size before continuing.");
      return false;
    }

    setSizeError("");
    return true;
  }

  function addToCart() {
    if (!validateSelection()) return;
    addItem(product, { quantity, size, color });
  }

  function buyNow() {
    if (!validateSelection()) return;
    addItem(product, { quantity, size, color, openDrawer: false });
    router.push("/checkout");
  }

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-10 overflow-hidden px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-14 lg:px-8 lg:pt-12">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[84px_minmax(0,1fr)]">
            <div className="order-2 flex max-w-full gap-3 overflow-x-auto pb-1 lg:order-1 lg:max-h-[min(680px,calc(100vh-7rem))] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1">
              {gallery.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  onClick={() => setImage(item)}
                  className={`focus-ring relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-neutral-50 ring-1 transition dark:bg-white/5 ${
                    image === item ? "border-neutral-950 ring-2 ring-neutral-950 dark:border-white dark:ring-white" : "border-black/10 ring-black/10 hover:border-neutral-400 dark:border-white/10 dark:ring-white/10"
                  }`}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img src={item} alt={product.name} className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
            <div className="group relative order-1 grid aspect-[4/5] min-h-[320px] max-h-[760px] min-w-0 place-items-center overflow-hidden rounded-2xl border border-black/5 bg-neutral-50 shadow-sm dark:border-white/10 dark:bg-white lg:order-2 lg:h-[min(760px,calc(100vh-7rem))]">
              <img src={image} alt={product.name} className="h-full w-full object-contain p-3 transition duration-500 sm:p-5" />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="max-w-[680px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{product.category}</p>
            <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-normal text-neutral-950 dark:text-white sm:text-[30px] lg:text-[34px]">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-[21px] font-bold text-neutral-950 dark:text-white sm:text-2xl">{formatCurrency(product.price)}</span>
              {comparePrice && comparePrice > product.price ? (
                <span className="text-base font-medium text-neutral-400 line-through">{formatCurrency(comparePrice)}</span>
              ) : null}
              {discount ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                  {discount}% off
                </span>
              ) : null}
            </div>

            <RatingLine rating={rating} reviews={reviews} />

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-semibold">Size</p>
                <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline dark:text-neutral-400 dark:hover:text-white">
                  <Ruler size={15} /> Size guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSize(item);
                      setSizeError("");
                    }}
                    className={`focus-ring grid h-11 min-w-12 place-items-center rounded-lg border px-4 text-sm font-semibold transition ${
                      size === item
                        ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                        : "border-black/10 bg-white text-neutral-950 hover:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {sizeError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{sizeError}</p> : null}
            </div>

            {availableColors.length ? (
              <div className="mt-6">
                <p className="mb-3 font-semibold">Color</p>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((item) => (
                    <button
                      key={item}
                      onClick={() => setColor(item)}
                      className={`focus-ring rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        color === item
                          ? "border-accent bg-accent text-white"
                          : "border-black/10 bg-white text-neutral-950 hover:border-accent dark:border-white/10 dark:bg-white/5 dark:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-7">
              <p className="mb-3 font-semibold">Quantity</p>
              <div className="inline-flex h-12 items-center rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
                <button className="grid h-full w-12 place-items-center" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
                  <Minus size={17} />
                </button>
                <span className="min-w-10 text-center font-semibold">{quantity}</span>
                <button className="grid h-full w-12 place-items-center" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">
                  <Plus size={17} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button onClick={addToCart} className="focus-ring flex min-h-[56px] w-full items-center justify-center rounded-full border border-neutral-950 bg-white px-6 text-sm font-semibold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-neutral-950 hover:text-white hover:shadow-lg dark:border-white dark:bg-white dark:text-neutral-950">
                Add to Cart
              </button>
              <button onClick={buyNow} className="focus-ring flex min-h-[56px] w-full items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-accent hover:shadow-xl dark:bg-white dark:text-neutral-950 dark:hover:bg-accent dark:hover:text-white">
                Buy Now
              </button>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm leading-6 text-neutral-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
              <Truck className="mt-0.5 shrink-0 text-accent" size={20} />
              <p>Free shipping, 7-day returns, cash on delivery, and secure payments available on eligible orders.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,700px)_minmax(280px,1fr)] lg:px-8">
        <div className="space-y-5">
          <DescriptionBlock description={product.description} />
          <div className="rounded-2xl border border-black/10 bg-white px-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:px-6">
            {accordions.map((item, index) => (
              <Accordion key={item.title} item={item} defaultOpen={index === 0} />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          {[
            ["Free Shipping", "On eligible prepaid orders"],
            ["7-Day Returns", "Easy returns from delivery date"],
            ["Cash on Delivery", "Pay when your order arrives"],
            ["Secure Payments", "Encrypted checkout"]
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
            </div>
          ))}
        </aside>
      </section>

      <section id="customer-reviews" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Customer Reviews</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={20} className="fill-amber-500" />
                  ))}
                </span>
                <span className="text-xl font-semibold">{rating.toFixed(1)}</span>
                <span className="text-sm font-bold text-neutral-500">{reviews} Reviews</span>
              </div>
            </div>
            <button className="focus-ring rounded-xl border border-neutral-950 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white dark:border-white">
              Write a review
            </button>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <ReviewCard name="Verified buyer" title="Premium feel" text="The fabric feels soft, the fit sits clean, and the product page made sizing easy." />
            <ReviewCard name="Verified buyer" title="Fast delivery" text="Packaging was neat and delivery was quick. The color looked exactly like the photos." />
            <ReviewCard name="Verified buyer" title="Worth it" text="Feels more polished than a regular online store purchase. I would buy again." />
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[auto_1fr_1fr] items-center gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-neutral-500">{product.name}</p>
            <p className="font-semibold">{formatCurrency(product.price)}</p>
          </div>
          <button onClick={addToCart} className="min-h-11 rounded-full border border-neutral-950 bg-white px-3 text-xs font-semibold text-neutral-950">
            Add to Cart
          </button>
          <button onClick={buyNow} className="min-h-11 rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white">
            Buy Now
          </button>
        </div>
      </div>
    </>
  );
}
