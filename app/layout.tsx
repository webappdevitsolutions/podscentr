import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { SiteChrome } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: {
    default: "Podscentra | Premium Ecommerce",
    template: "%s | Podscentra"
  },
  description: "A premium modern ecommerce experience for fashion, tech, and lifestyle essentials.",
  metadataBase: new URL("https://podscentra.example"),
  openGraph: {
    title: "Podscentra",
    description: "Luxury ecommerce, sharpened for modern shoppers.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>
          <SiteChrome>{children}</SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
