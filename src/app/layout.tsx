import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteProvider } from "@/context/SiteContext";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import SiteTitle from "@/components/layout/SiteTitle";
import { Toaster } from "sonner";

/*
 * ── Font configuration ──────────────────────────────────────────────────────
 * To change fonts site-wide, swap these imports and update the variable names.
 * The CSS variables --font-inter / --font-poppins are referenced in globals.css
 * via @theme inline → --font-sans / --font-heading.
 * ────────────────────────────────────────────────────────────────────────────
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Local Food Delivery",
    default: "Local Food Delivery — Fast & Fresh",
  },
  description:
    "Order food from your favourite local restaurants in Kilkeel, Downpatrick & Newcastle. Fast delivery, hot food, every time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteProvider>
          <CartProvider>
            <OrderProvider>
              <SiteTitle />
              {children}
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{
                  style: { fontSize: "14px" },
                }}
              />
            </OrderProvider>
          </CartProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
