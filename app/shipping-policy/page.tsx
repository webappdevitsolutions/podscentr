import { PolicyPage } from "@/components/PolicyPage";

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Shipping"
      title="Shipping Policy"
      description="This Shipping Policy explains delivery timelines, delivery charges, tracking, and delay handling for Podscentra orders shipped within India."
      sections={[
        {
          title: "Delivery Timelines",
          body: [
            "Standard Delivery usually takes 3-5 business days after dispatch. Express Delivery usually takes 1-2 business days after dispatch, subject to courier serviceability and product availability.",
            "Orders are generally processed on business days. Delivery timelines may vary for remote locations, public holidays, weather disruptions, strikes, high-volume sale periods, or courier network delays."
          ]
        },
        {
          title: "Delivery Charges",
          body: [
            "For Online Payment orders, Standard Delivery is Rs. 49 and Express Delivery is Rs. 99. For Cash on Delivery orders, Standard Delivery is Rs. 100 and Express Delivery is Rs. 150.",
            "The final delivery charge is displayed at checkout before order placement and is saved with the order."
          ]
        },
        {
          title: "Tracking And Delivery Attempts",
          body: [
            "Once an order is dispatched, tracking information may be shared by email, SMS, WhatsApp, or through the order tracking page where available.",
            "Courier partners may attempt delivery more than once depending on their policy. Customers should provide a complete address and reachable phone number to avoid failed delivery."
          ]
        },
        {
          title: "Delays And Non-Serviceable Areas",
          body: [
            "If a location becomes non-serviceable or there is an unusual delay, Podscentra will contact the customer and may offer cancellation, refund, or an alternate delivery solution.",
            "For shipping help, contact +91 0120 421 7372 or support@podscentra.com."
          ]
        }
      ]}
    />
  );
}
