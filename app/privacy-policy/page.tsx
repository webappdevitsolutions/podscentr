import { SimplePage } from "@/components/SimplePage";

export default function PrivacyPolicyPage() {
  return (
    <SimplePage
      eyebrow="Privacy"
      title="Privacy policy"
      description="How Podscentra handles account data, checkout information, and recommendation preferences."
      items={["Secure checkout data", "Preference-based recommendations", "Opt out anytime"]}
    />
  );
}
