import { PolicyPage } from "@/components/PolicyPage";

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Returns"
      title="Return & Refund Policy"
      description="This Return & Refund Policy explains return eligibility, return windows, refund timelines, and the process for damaged, defective, or incorrect products."
      sections={[
        {
          title: "Return Window And Eligibility",
          body: [
            "Eligible products can be requested for return within 7 days from the date of delivery, unless the product page states a different return condition.",
            "Products must be unused, unwashed, undamaged, and returned with original tags, packaging, invoice, accessories, and any included freebies. Products damaged due to customer misuse may not be accepted."
          ]
        },
        {
          title: "Non-Returnable Items",
          body: [
            "Certain items may not be returnable for hygiene, customization, clearance sale, or final-sale reasons. Any such restriction will be mentioned on the product page or during checkout where applicable.",
            "Returns may be rejected if the product does not pass quality inspection after pickup or if the returned item is different from the item delivered."
          ]
        },
        {
          title: "Damaged, Defective, Or Wrong Product",
          body: [
            "If you receive a damaged, defective, missing, or incorrect product, contact Podscentra support within 48 hours of delivery with order ID, photos or video of the package, product, and invoice.",
            "After verification, Podscentra may arrange replacement, return pickup, store credit, or refund depending on product availability and the issue reported."
          ]
        },
        {
          title: "Refund Timeline",
          body: [
            "Refunds are initiated after the returned product is received and passes quality inspection. Approved refunds are generally processed within 5-7 business days.",
            "For prepaid orders, refunds are sent to the original payment method where possible. For COD orders, customers may be asked for bank or UPI details to process the refund."
          ]
        },
        {
          title: "How To Request A Return",
          body: [
            "Contact support@podscentra.com or call +91 0120 421 7372 with your order ID, reason for return, and product photos where required.",
            "Our support team is available Monday to Saturday, 10:00 AM - 6:00 PM."
          ]
        }
      ]}
    />
  );
}
