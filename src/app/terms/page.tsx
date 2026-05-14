"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export default function TermsPage() {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
              Last updated: April 2026
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sm:p-12">
            <div className="prose prose-slate max-w-none">
              <div className="mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-100 italic text-slate-600 text-center">
                Local Eats — Kilkeel Eats, Newcastle Eats & Downpatrick Eats
              </div>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>1</span>
                  Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms and Conditions govern your use of the Local Eats platform, including the websites and interfaces operating under the brand names Kilkeel Eats, Newcastle Eats, and Downpatrick Eats (collectively, the &quot;Platform&quot;). By registering an account or placing an order, you agree to these Terms in full.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>2</span>
                  Who We Are
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Local Eats operates an online marketplace connecting customers with local restaurants. We act as an agent for restaurants: when you place an order, your contract for the food is with the restaurant, not with Local Eats. We facilitate the ordering and payment process only.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>3</span>
                  Account Registration
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>You are responsible for maintaining the confidentiality of your login credentials.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>You must provide accurate and current information (name, email, phone number) when registering.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>You may not create an account using someone else&apos;s identity.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>We reserve the right to suspend or terminate accounts that violate these Terms.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>4</span>
                  Ordering and Payment
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Orders are subject to acceptance by the restaurant. We will notify you if a restaurant cannot fulfil your order.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Prices include any applicable service charge. Delivery fees are calculated separately based on your delivery area or distance.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Payment is processed securely via Stripe. We do not store your card details.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Once an order is submitted and payment confirmed, cancellations are subject to the restaurant&apos;s cancellation policy.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>In the event of a failed payment, your order will not be confirmed.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>5</span>
                  Delivery
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Estimated delivery times are indicative only and are not guaranteed.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>You are responsible for providing an accurate delivery address.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>If you are not present at delivery, the driver may leave your order in a safe place at their discretion. We are not liable for orders left unattended.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>For issues with missing or incorrect orders, contact the restaurant directly first, or message our Facebook page for assistance.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>7</span>
                  Refunds and Complaints
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Refund requests must be raised within 24 hours of delivery by contacting the restaurant or our support team.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Refunds are issued at our discretion and depend on the nature of the complaint.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Delivery fees are generally non-refundable once a delivery has been dispatched.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Refunds processed via Stripe may take 5–10 business days to appear in your account.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>8</span>
                  Prohibited Conduct
                </h2>
                <p className="text-gray-700 mb-4">You must not:</p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Use the Platform for fraudulent purposes or place false orders.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Abuse, harass, or threaten restaurant staff, drivers, or Platform support staff.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Attempt to reverse-engineer or disrupt the Platform&apos;s technical systems.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <span>Post false or defamatory reviews.</span>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>9</span>
                  Intellectual Property
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  All content on the Platform — including logos, text, and software — is owned by Local Eats or its licensors. You may not reproduce or redistribute any content without our express written consent.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>10</span>
                  Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, Local Eats shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability for any claim shall not exceed the value of the order to which the claim relates.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>11</span>
                  Account Deletion
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  You may delete your account at any time from your account settings. Upon deletion, your personal information will be removed, but order history will be retained in anonymised form for legal and financial record-keeping purposes.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>12</span>
                  Changes to These Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update these Terms from time to time. We will notify you of significant changes by email or via the Platform. Continued use after changes constitutes your acceptance of the new Terms.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>13</span>
                  Governing Law
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms are governed by the laws of Northern Ireland and the United Kingdom. Any disputes shall be subject to the exclusive jurisdiction of the courts of Northern Ireland.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>14</span>
                  Contact
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  For questions regarding these Terms: <a href="mailto:hello@yourlocaleats.app" className="font-semibold underline" style={{ color: site.theme.primary }}>hello@yourlocaleats.app</a>
                </p>
              </section>
            </div>

            {/* Back link */}
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
