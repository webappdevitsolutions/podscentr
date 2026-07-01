import { PolicyPage } from "@/components/PolicyPage";

export default function CancellationPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Cancellation"
      title="Cancellation Policy"
      description="This Cancellation Policy explains how Podscentra handles order cancellation requests before dispatch, after dispatch, and refund timelines for cancelled orders."
      sections={[
        {
          title: "Cancellation Before Dispatch",
          body: [
            "Customers may request cancellation before the order is dispatched by contacting support@podscentra.com or calling +91 0120 421 7372 with the order ID.",
            "If the order has not been packed or handed over to the courier partner, Podscentra will cancel the order and initiate the applicable refund."
          ]
        },
        {
          title: "Cancellation After Dispatch",
          body: [
            "Once an order has been dispatched, cancellation may not be possible immediately. Customers may refuse delivery where applicable, or request a return after delivery as per the Return & Refund Policy.",
            "Shipping and COD charges may be non-refundable in cases where the shipment has already been dispatched or delivery was attempted."
          ]
        },
        {
          title: "Podscentra-Initiated Cancellation",
          body: [
            "Podscentra may cancel orders due to payment failure, stock unavailability, address or phone verification failure, courier non-serviceability, suspected fraud, pricing errors, or policy violations.",
            "If payment was already received for a cancelled order, the eligible refund will be initiated to the original payment method or another approved refund method."
          ]
        },
        {
          title: "Refund Timeline For Cancellations",
          body: [
            "Approved cancellation refunds are generally initiated within 2-5 business days. Bank, card, UPI, or payment gateway settlement timelines may vary depending on the payment provider.",
            "For cancellation support, contact Podscentra Monday to Saturday, 10:00 AM - 6:00 PM."
          ]
        }
      ]}
    />
  );
}
