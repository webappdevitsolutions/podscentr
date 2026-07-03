import { type Product } from "@/data/products";

export type CollectionRule = {
  type?: string;
  value?: string;
};

function discountPercent(product: Product) {
  const compareAt = Number(product.compareAtPrice || product.oldPrice || 0);
  if (!compareAt || compareAt <= product.price) return 0;
  return Math.round(((compareAt - product.price) / compareAt) * 100);
}

export function parseCollectionRule(value: unknown): CollectionRule {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return {
    type: typeof record.type === "string" ? record.type : "",
    value: typeof record.value === "string" ? record.value : ""
  };
}

export function productMatchesCollectionRule(product: Product, rule: CollectionRule) {
  const type = rule.type || "";
  const rawValue = rule.value || "";
  const numberValue = Number(rawValue || 0);

  if (!type) return false;
  if (type === "price_gt") return product.price > numberValue;
  if (type === "category_eq") return product.category.toLowerCase() === rawValue.toLowerCase();
  if (type === "status_active") return product.status === "Active";
  if (type === "stock_gt") return Number(product.stock || 0) > numberValue;
  if (type === "discount_gt") return discountPercent(product) > numberValue;
  if (type === "new_arrivals") return true;
  if (type === "best_sellers") return Number(product.reviews || 0) >= numberValue;
  return false;
}
