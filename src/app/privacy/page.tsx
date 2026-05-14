"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
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
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
              Your privacy is our priority. Last updated: April 2026
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
                  Who We Are
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Local Eats operates the Platform under the brands Kilkeel Eats, Newcastle Eats, and Downpatrick Eats. We are the data controller for personal data collected through the Platform. 
                </p>
                <p className="mt-4 font-semibold text-gray-800">
                  Contact: <a href="mailto:hello@yourlocaleats.app" className="underline decoration-2" style={{ textDecorationColor: site.theme.accent }}>hello@yourlocaleats.app</a>
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>2</span>
                  What Data We Collect
                </h2>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Account Data</strong>
                      Your full name, email address, and phone number when you register.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Order Data</strong>
                      Delivery address, delivery area, order contents, prices, and payment status.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Device Data</strong>
                      Firebase Cloud Messaging (FCM) device tokens for push notifications, stored against your account.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Location Data</strong>
                      If you grant permission, your approximate location to calculate delivery fees and show nearby restaurants. We do not continuously track your location.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Usage Data</strong>
                      Standard server logs (IP address, browser type, pages visited) for security and debugging.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Payment Data</strong>
                      Payment is processed by Stripe. We store only the Stripe payment intent ID — never card numbers or CVVs.
                    </div>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>3</span>
                  How We Use Your Data
                </h2>
                <ul className="space-y-2 text-gray-700 list-disc pl-5">
                  <li>To process and deliver your orders.</li>
                  <li>To send order status notifications via push notification (FCM), WhatsApp (Twilio), and email (SendGrid).</li>
                  <li>To allow you to review your order history.</li>
                  <li>To facilitate account management and support.</li>
                  <li>To detect and prevent fraud.</li>
                  <li>To comply with legal and financial record-keeping requirements.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>4</span>
                  Legal Basis for Processing (UK GDPR)
                </h2>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Contract performance</strong>
                      Processing your order, managing your account, and arranging delivery.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Legitimate interests</strong>
                      Fraud prevention, platform security, and service improvement.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Consent</strong>
                      Push notifications — you may withdraw consent at any time in your device settings.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Legal obligation</strong>
                      Retaining financial transaction records as required by HMRC regulations.
                    </div>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>5</span>
                  Who We Share Your Data With
                </h2>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Restaurants</strong>
                      Your name, phone number, delivery address, and order details with the restaurant fulfilling your order.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Shipday (Delivery Management)</strong>
                      Order and address details shared to dispatch drivers.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Stripe</strong>
                      Payment processing under their own Privacy Policy.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Firebase (Google)</strong>
                      Device tokens for push notifications, processed by Google.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Twilio</strong>
                      Your phone number, only to send WhatsApp order notifications.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">SendGrid (Twilio)</strong>
                      Your email address, only to send order confirmation emails.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Supabase</strong>
                      Your account credentials stored for authentication.
                    </div>
                  </li>
                </ul>
                <p className="mt-6 font-bold text-gray-900">We do not sell your personal data to third parties.</p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>8</span>
                  Cookies and Tracking
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We use strictly necessary cookies for authentication (Supabase session cookies). We do not use advertising or third-party tracking cookies. No cookie consent banner is required for strictly necessary cookies under UK PECR.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>9</span>
                  Data Security
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We protect your data using: TLS/HTTPS encryption in transit, Supabase row-level security (RLS) on the database, and JWT-based authentication. Passwords are hashed and never stored in plaintext.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>12</span>
                  Changes to This Policy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy and will notify you of material changes by email. The latest version will always be available on the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>13</span>
                  Contact
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  For privacy questions or to exercise your rights: <a href="mailto:hello@yourlocaleats.app" className="font-semibold underline" style={{ color: site.theme.primary }}>hello@yourlocaleats.app</a>
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
