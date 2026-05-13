"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, ReceiptText, ShieldCheck } from "lucide-react";

export default function RefundPolicyPage() {
  const { site } = useSite();

  return (
    <>
      <Navbar />

      <main className="min-h-screen pb-20 theme-transition">
        <div
          className="pt-24 pb-16 px-4 text-center theme-transition"
          style={{
            background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 55%, ${site.theme.gradientTo} 100%)`,
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mb-6 shadow-xl">
              <ReceiptText className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4 tracking-tight">
              Refund Policy
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
              Last updated: May 2026
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sm:p-12">
            <div className="prose prose-slate max-w-none">
              <div className="mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-100 italic text-slate-600 text-center">
                Local Eats and its participating restaurants
              </div>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>1</span>
                  Scope
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  This Refund Policy explains when refunds are available for orders placed through the Platform. It applies to both single-restaurant orders and grouped order sessions.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>2</span>
                  Customer Cancellation Window
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If an order has been paid and the restaurant has not yet progressed it beyond the early preparation stage, you may cancel from your order screen within 3 minutes of payment confirmation. When eligible, the Platform will automatically submit a refund to Stripe.
                </p>
                <p className="mt-4 text-gray-700 leading-relaxed">
                  Orders cancelled by the customer within the eligible window are marked as cancelled and refunded through the original payment method, subject to Stripe processing times.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>3</span>
                  When Refunds Are Available
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>The restaurant cancels the order before preparation begins.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>You cancel a paid order within the 3-minute cancellation window and the refund request is accepted.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Your payment fails or is reversed by Stripe before the order is confirmed.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>The Platform cannot complete an order due to a technical error or duplicate charge.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>4</span>
                  What Is Not Refundable
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Orders cancelled after the cancellation window has expired.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Orders already prepared, dispatched, or delivered.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Delivery fees once a delivery task has been dispatched, unless required by law or agreed by support.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Refund requests based on change of mind after food preparation has started.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>5</span>
                  Refund Method and Timing
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Approved refunds are returned to the original Stripe payment method. Stripe may take several business days to post the refund to your card or bank account, depending on your provider.
                </p>
                <p className="mt-4 text-gray-700 leading-relaxed">
                  If a refund is approved by support, the refund reference will be stored against the order so you can track it in your order history.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>6</span>
                  How To Request Help
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If your order is outside the automatic refund window but you believe a refund is still justified, contact support with your order ID, the restaurant name, and a short explanation of the issue.
                </p>
                <p className="mt-4 text-gray-700 leading-relaxed">
                  We may ask for photos, delivery details, or additional context before making a decision.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>7</span>
                  Chargebacks and Duplicate Payments
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If you believe you were charged twice or a payment failed but still appeared on your statement, contact support before starting a chargeback. We will work with Stripe to investigate and resolve the issue as quickly as possible.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>8</span>
                  Policy Changes
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Refund Policy from time to time to reflect changes in the Platform, our payment providers, or applicable law. The latest version will always be published on this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>9</span>
                  Contact
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  For refund questions, contact <a href="mailto:hello@yourlocaleats.app" className="font-semibold underline" style={{ color: site.theme.primary }}>hello@yourlocaleats.app</a>.
                </p>
              </section>
            </div>

            <div className="mt-12 p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: site.theme.primary }} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Refunds are always processed against the original payment method whenever possible.
              </p>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3"
                style={{ color: site.theme.primary }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {site.name}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
