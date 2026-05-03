import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import AccountModal from "@/components/account/AccountModal";
import WishlistHydrator from "@/components/layout/WishlistHydrator";

export const metadata: Metadata = {
  title: "PlanYourSkin",
  description: "Skincare yang sesuai dengan kebutuhan kulitmu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans antialiased flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <AccountModal />
        <WishlistHydrator />
      </body>
    </html>
  );
}
