import { SimplePage } from "@/components/SimplePage";

export default function TermsPage() {
  return (
    <SimplePage
      eyebrow="Terms"
      title="Terms and conditions"
      description="The core terms for using Podscentra, placing orders, and accessing limited product drops."
      items={["Order acceptance", "Pricing and availability", "Account responsibilities"]}
    />
  );
}
