import { PolicyPage } from "@/components/PolicyPage";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This Privacy Policy explains how Podscentra collects, uses, stores, and protects customer information when you browse, create an account, place an order, or contact support."
      sections={[
        {
          title: "Information We Collect",
          body: [
            "We collect information required to process orders and provide support, including name, email address, phone number, shipping address, billing details, order items, delivery preferences, and communication history.",
            "We may collect technical information such as IP address, browser type, device information, pages viewed, referral source, and cookies to improve site performance, fraud prevention, and customer experience."
          ]
        },
        {
          title: "Payments And Razorpay",
          body: [
            "Online payments are securely processed by Razorpay. Podscentra does not store card, UPI, netbanking, wallet, or sensitive payment authentication details on its servers.",
            "Razorpay may process payment-related information as required to complete the transaction, verify payment status, prevent fraud, and comply with applicable law."
          ]
        },
        {
          title: "How We Use Data",
          body: [
            "We use customer data to confirm orders, ship products, provide tracking updates, handle cancellations, returns, refunds, customer support, fraud checks, and legal compliance.",
            "With consent or legitimate interest, we may send order updates, service messages, product recommendations, and promotional communication. Customers may opt out of marketing communication where applicable."
          ]
        },
        {
          title: "Sharing And Retention",
          body: [
            "We share only necessary information with logistics partners, payment providers, technology service providers, and legal or regulatory authorities when required.",
            "Order and transaction records are retained as required for accounting, tax, customer support, legal compliance, and fraud prevention. We take reasonable technical and organizational measures to protect personal information."
          ]
        },
        {
          title: "Customer Rights",
          body: [
            "Customers may request access, correction, or deletion of eligible personal information by contacting support@podscentra.com. Some records may be retained where required by law or legitimate business obligations.",
            "For privacy concerns, contact Podscentra at +91 0120 421 7372 or support@podscentra.com."
          ]
        }
      ]}
    />
  );
}
