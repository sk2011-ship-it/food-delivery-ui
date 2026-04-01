"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Phone,
  Mail,
  ArrowLeft,
  Info,
  MessageCircle,
  Camera,
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

          {/* ── Important notice ── */}
          <div
            className="flex gap-4 p-5 rounded-2xl border"
            style={{
              background: `${site.theme.gradientFrom}0f`,
              borderColor: `${site.theme.gradientFrom}30`,
            }}
          >
            <Info
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: site.theme.primary }}
            />
            <p className="text-gray-700 text-sm leading-relaxed">
              {contact.notice}
            </p>
          </div>

          {/* ── Contact details card ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Card header */}
            <div
              className="px-6 py-5 flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientVia})`,
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="font-heading font-black text-white text-base">
                  {site.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="font-heading font-bold text-white text-lg leading-tight">
                  {site.name}
                </h2>
                <p className="text-white/70 text-xs">{site.tagline}</p>
              </div>
            </div>

            {/* Contact rows */}
            <div className="divide-y divide-gray-100">
              {/* Phone */}
              <ContactRow
                icon={<Phone className="w-5 h-5" style={{ color: site.theme.primary }} />}
                label="Manager (Phone)"
                value={contact.managerPhone}
                href={`tel:${contact.managerPhone.replace(/\s/g, "")}`}
                linkLabel="Call now"
                siteTheme={site.theme}
              />

              {/* Email */}
              <ContactRow
                icon={<Mail className="w-5 h-5" style={{ color: site.theme.primary }} />}
                label="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
                linkLabel="Send email"
                siteTheme={site.theme}
              />

              {/* Facebook */}
              <ContactRow
                icon={<MessageCircle className="w-5 h-5" style={{ color: site.theme.primary }} />}
                label="Facebook"
                value={contact.facebook.label}
                href={`https://www.facebook.com/search/top?q=${encodeURIComponent(contact.facebook.handle)}`}
                linkLabel="Open Facebook"
                siteTheme={site.theme}
                external
              />

              {/* Instagram */}
              <ContactRow
                icon={<Camera className="w-5 h-5" style={{ color: site.theme.primary }} />}
                label="Instagram"
                value={`@${contact.instagram.handle}`}
                href={`https://www.instagram.com/${contact.instagram.handle}`}
                linkLabel="Open Instagram"
                siteTheme={site.theme}
                external
              />
            </div>
          </div>

          {/* ── Quick action buttons ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={`tel:${contact.managerPhone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2.5 h-14 rounded-2xl text-white font-bold text-sm shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientVia})`,
              }}
            >
              <Phone className="w-5 h-5" />
              Call the Manager
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center justify-center gap-2.5 h-14 rounded-2xl font-bold text-sm shadow-sm border-2 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{
                borderColor: site.theme.primary,
                color: site.theme.primary,
                background: `${site.theme.gradientFrom}08`,
              }}
            >
              <Mail className="w-5 h-5" />
              Send an Email
            </a>
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

/* ── Contact row component ── */
function ContactRow({
  icon,
  label,
  value,
  href,
  linkLabel,
  siteTheme,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  linkLabel: string;
  siteTheme: { primary: string; accent: string; gradientFrom: string };
  external?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${siteTheme.gradientFrom}12` }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-gray-800 font-medium text-sm truncate">{value}</p>
      </div>

      {/* Link */}
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:opacity-80 whitespace-nowrap"
        style={{
          background: `${siteTheme.gradientFrom}15`,
          color: siteTheme.primary,
        }}
      >
        {linkLabel} →
      </a>
    </div>
  );
}
