import { SimplePage } from "@/components/SimplePage";

export default function ShippingPolicyPage() {
  return (
    <SimplePage
      eyebrow="Shipping"
      title="Shipping policy"
      description="Clear delivery timelines for domestic and international Podscentra orders."
      items={["Standard delivery: 3-5 business days", "Express delivery: 1-2 business days", "Tracking email after dispatch"]}
    />
  );
}
