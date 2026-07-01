import { SimplePage } from "@/components/SimplePage";

export default function ReturnPolicyPage() {
  return (
    <SimplePage
      eyebrow="Returns"
      title="Return policy"
      description="Returns are simple, trackable, and designed for premium ecommerce support."
      items={["30-day return window", "Original tags required", "Refunds after quality check"]}
    />
  );
}
