"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Mail,
  ArrowLeft,
} from "lucide-react";

export default function ContactPage() {
  const { site } = useSite();
  const { contact } = site;

  return (
    <>
      <Navbar />

      <main className="min-h-screen pb-0 theme-transition">
        {/* ── Hero banner — pt-16 accounts for fixed navbar height ── */}
        <div
          className="pt-16 pb-12 px-4 text-center theme-transition"
          style={{
            background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 55%, ${site.theme.gradientTo} 100%)`,
          }}
        >
          <div className="max-w-2xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
             
             
            </Link>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white mb-3">
              Contact Us
            </h1>
            <p className="text-white/75 text-base sm:text-lg max-w-xl mx-auto">
              {`${site.name} — we're here to help.`}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">

          {/* ── Contact message section ── */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden group">
             {/* Decorative background element */}
             <div 
              className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-700"
              style={{ backgroundColor: site.theme.primary }}
            />
            
            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-xl mx-auto">
              If you face any issues, have questions, or want to report problems, please don&apos;t hesitate to contact us directly. Our team is here to ensure you have the best experience possible.
            </p>
            
            <div className="inline-block relative">
              <a 
                href={`mailto:${contact.email}`}
                className="group/mail relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: `${site.theme.primary}10`,
                  color: site.theme.primary,
                }}
              >
                <Mail className="w-6 h-6 transition-transform group-hover/mail:-rotate-12" />
                <span className="relative">
                  {contact.email}
                  <span 
                    className="absolute bottom-0 left-0 w-full h-0.5 transform origin-left scale-x-0 group-hover/mail:scale-x-100 transition-transform duration-300"
                    style={{ backgroundColor: site.theme.primary }}
                  />
                </span>
              </a>
            </div>
          </div>


          {/* ── Back link ── */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to {site.name}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

