"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, Cookie } from "lucide-react";

export default function CookiePolicyPage() {
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
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4 tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
              How we use cookies on {site.name}. Last updated: May 2026
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sm:p-12">
            <div className="prose prose-slate max-w-none">
              <div className="mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-100 italic text-slate-600 text-center">
                Local Eats — Kilkeel Eats, Newcastle Eats &amp; Downpatrick Eats
              </div>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>1</span>
                  What Are Cookies?
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Cookies are small text files that are stored on your device (computer, phone, or tablet) when you visit a website. They allow the site to remember your actions and preferences over time, so you don&apos;t have to re-enter them every time you come back or browse between pages.
                </p>
                <p className="mt-4 text-gray-700 leading-relaxed">
                  Cookies can be &ldquo;session&rdquo; cookies (deleted when you close your browser) or &ldquo;persistent&rdquo; cookies (remain on your device for a set period or until you delete them).
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>2</span>
                  Types of Cookies We Use
                </h2>

                <div className="space-y-6">
                  {/* Essential */}
                  <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2.5 py-0.5 text-xs font-bold rounded-full text-white"
                        style={{ backgroundColor: site.theme.primary }}
                      >
                        Always Active
                      </span>
                      <h3 className="text-base font-bold text-gray-900">Essential Cookies</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      These cookies are strictly necessary for the Platform to function. Without them, core features such as logging in and placing orders cannot work. They cannot be disabled.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                        <div>
                          <strong className="text-gray-800">Session Cookie</strong> — Keeps you logged in while you navigate the Platform. Expires when you close your browser.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                        <div>
                          <strong className="text-gray-800">Authentication Cookie (Supabase)</strong> — A secure, HTTP-only cookie used to validate your login session across page loads. Expires after 7 days of inactivity.
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Analytics */}
                  <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                        Optional
                      </span>
                      <h3 className="text-base font-bold text-gray-900">Analytics Cookies</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      These cookies help us understand how visitors interact with the Platform so we can improve it. All data collected is aggregated and anonymous — we do not use it to identify you personally.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                        <div>
                          <strong className="text-gray-800">Page View Analytics</strong> — Records which pages are visited and for how long, helping us identify popular content and areas for improvement.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                        <div>
                          <strong className="text-gray-800">Error Tracking</strong> — Logs client-side errors anonymously so our team can diagnose and fix issues quickly.
                        </div>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-gray-500 italic">
                      We currently use only privacy-friendly, self-hosted analytics tools. We do not use Google Analytics or third-party advertising trackers.
                    </p>
                  </div>

                  {/* Preference */}
                  <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                        Optional
                      </span>
                      <h3 className="text-base font-bold text-gray-900">Preference Cookies</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      These cookies remember your choices and settings to give you a more personalised experience on return visits.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                        <div>
                          <strong className="text-gray-800">Delivery Area Preference</strong> — Remembers your selected delivery area so you don&apos;t need to re-select it on each visit.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                        <div>
                          <strong className="text-gray-800">Theme / Display Settings</strong> — Stores any display preferences you have set within your account.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>3</span>
                  Third-Party Cookies
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We do not serve advertising cookies or share cookie data with marketing networks. The only third-party service that may set a cookie is <strong>Stripe</strong> during the payment checkout process. Stripe uses cookies solely to prevent fraud and ensure payment security. Their use is governed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: site.theme.primary }}>Stripe&apos;s Privacy Policy</a>.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>4</span>
                  How to Control or Disable Cookies
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You can control and manage cookies in several ways. Please note that removing or blocking essential cookies will affect your ability to use the Platform (for example, you will not be able to stay logged in).
                </p>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Browser Settings</strong>
                      Most browsers allow you to view, manage, delete, and block cookies. Refer to your browser&apos;s help documentation: <span className="font-medium">Chrome → Settings → Privacy and security → Cookies</span>; <span className="font-medium">Firefox → Preferences → Privacy &amp; Security</span>; <span className="font-medium">Safari → Preferences → Privacy</span>.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Opt-Out Tools</strong>
                      For analytics cookies, you may opt out at any time by adjusting your account privacy settings or by contacting us directly.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.theme.primary }} />
                    <div>
                      <strong className="text-gray-900 block">Private / Incognito Mode</strong>
                      Browsing in private mode prevents persistent cookies from being stored. Session cookies will still work during your browsing session but are deleted when you close the window.
                    </div>
                  </li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>5</span>
                  Legal Basis
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Under the UK Privacy and Electronic Communications Regulations (PECR), strictly necessary cookies do not require your consent. For optional analytics and preference cookies, we rely on your consent, which you may withdraw at any time. Our use of cookies is also described in our{" "}
                  <Link href="/privacy" className="font-semibold underline" style={{ color: site.theme.primary }}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>6</span>
                  Changes to This Policy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Cookie Policy from time to time. Material changes will be notified via email or a prominent notice on the Platform. The date at the top of this page reflects when it was last revised.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-4" style={{ color: site.theme.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ backgroundColor: site.theme.primary }}>7</span>
                  Contact
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have questions about our use of cookies, please contact us at{" "}
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="font-semibold underline"
                    style={{ color: site.theme.primary }}
                  >
                    {site.contact.email}
                  </a>
                  .
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
