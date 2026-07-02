import { PolicyPage } from "@/components/PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms & Conditions"
      description="These Terms & Conditions govern your access to and use of the Podscentra website, product catalogue, checkout, payments, delivery, returns, and customer support services."
      sections={[
        {
          title: "Use Of Website",
          body: [
            "By using this website or placing an order, you agree to provide accurate information and comply with applicable Indian laws. You must not misuse the website, attempt unauthorized access, or place fraudulent orders.",
            "Podscentra may update website content, prices, products, offers, and policies from time to time. Continued use of the website means you accept the latest terms."
          ]
        },
        {
          title: "Product Information And Pricing",
          body: [
            "We make reasonable efforts to display accurate product details, images, sizes, colours, prices, offers, taxes, and stock status. Minor variation may occur due to screen settings or product photography.",
            "Prices are listed in Indian Rupees unless stated otherwise. Podscentra may correct pricing or availability errors before dispatch and will contact customers if an order is affected."
          ]
        },
        {
          title: "Orders And Acceptance",
          body: [
            "An order is confirmed only after successful order creation and payment confirmation for online payments, or after order confirmation for Cash on Delivery orders.",
            "Podscentra may cancel or refuse orders in cases of incorrect information, suspected fraud, payment failure, stock unavailability, serviceability issues, or violation of these terms."
          ]
        },
        {
          title: "Payments",
          body: [
            "Online payments are securely processed by Razorpay using supported payment modes. Podscentra does not store sensitive card, UPI, wallet, or netbanking credentials.",
            "Cash on Delivery availability may depend on order value, delivery location, risk checks, and courier serviceability."
          ]
        },
        {
          title: "Liability And Governing Law",
          body: [
            "Podscentra is not liable for indirect, incidental, special, or consequential losses arising from website use, delivery delays, third-party failures, or product misuse, except as required by law.",
            "These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of competent courts in India."
          ]
        }
      ]}
    />
  );
}
