"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function RefundPolicyPage() {
  const { site } = useSite();

  return (
    <>
      <Navbar />

      <main className="min-h-screen pb-20 theme-transition">
        {/* Hero Banner */}
        <div
          className="pt-24 pb-16 px-4 text-center theme-transition"
          style={{
            background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 55%, ${site.theme.gradientTo} 100%)`,
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mb-6 shadow-xl">
              <RotateCcw className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4 tracking-tight">
              Refund Policy
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-xl mx-auto">
              Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold mb-10 hover:opacity-70 transition-opacity"
            style={{ color: site.theme.gradientFrom }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="space-y-10 text-gray-700">

            <section>
              <h2 className="font-heading font-black text-xl text-gray-900 mb-3">1. Overview</h2>
              <p className="text-sm leading-relaxed">
                At {site.name}, we want you to be completely satisfied with every order. This policy explains
                when you are entitled to a refund and how to request one.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-black text-xl text-gray-900 mb-3">2. Cancellation Before Preparation</h2>
              <p className="text-sm leading-relaxed mb-2">
                You may cancel your order and receive a full refund if you cancel within <strong>2 minutes</strong> of
                completing payment, provided the restaurant has not yet begun preparing your order.
              </p>
              <p className="text-sm leading-relaxed">
                To cancel, go to <strong>My Orders</strong> and tap <strong>Cancel Order</strong> within the
                2-minute window shown on your order card. Refunds are processed automatically via the original
                payment method and typically appear within 5–10 business days.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-black text-xl text-gray-900 mb-3">3. Order Issues After Delivery</h2>
              <p className="text-sm leading-relaxed mb-2">
                If your order arrives with any of the following problems, you are eligible for a full or partial refund:
              </p>
              <ul className="list-disc list-inside text-sm leading-relaxed space-y-1 pl-2">
                <li>Items missing from the order</li>
                <li>Wrong items delivered</li>
                <li>Food that is inedible, spoiled, or significantly different from what was described</li>
                <li>Order never arrived</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3">
                You must report any issue within <strong>24 hours</strong> of the scheduled delivery time by
                contacting us via our Facebook page or email at{" "}
                <a href={`mailto:${site.contact.email}`} className="font-bold underline" style={{ color: site.theme.gradientFrom }}>
                  {site.contact.email}
                </a>. Please include your order number and a brief description of the issue.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-black text-xl text-gray-900 mb-3">4. Non-Refundable Situations</h2>
              <p className="text-sm leading-relaxed mb-2">Refunds will <strong>not</strong> be issued in the following cases:</p>
              <ul className="list-disc list-inside text-sm leading-relaxed space-y-1 pl-2">
                <li>Order cancelled after the 2-minute window once preparation has begun</li>
                <li>Change of mind after the order has been accepted and prepared</li>
                <li>Incorrect delivery address provided by the customer</li>
                <li>Customer unavailable at delivery address after multiple attempts</li>
                <li>Dissatisfaction with taste preferences (subjective quality)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-black text-xl text-gray-900 mb-3">5. Refund Processing</h2>
              <p className="text-sm leading-relaxed">
                Approved refunds are processed back to your original payment method (credit/debit card). Please
                allow <strong>5–10 business days</strong> for the refund to appear on your statement, depending on
                your card provider.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-black text-xl text-gray-900 mb-3">6. Contact Us</h2>
              <p className="text-sm leading-relaxed">
                For refund requests or questions about this policy, please contact us:
              </p>
              <ul className="mt-3 text-sm space-y-1">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${site.contact.email}`} className="underline" style={{ color: site.theme.gradientFrom }}>
                    {site.contact.email}
                  </a>
                </li>
                <li>
                  <strong>Facebook:</strong>{" "}
                  <a
                    href={`https://www.facebook.com/${site.contact.facebook.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: site.theme.gradientFrom }}
                  >
                    {site.contact.facebook.label}
                  </a>
                </li>
              </ul>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
