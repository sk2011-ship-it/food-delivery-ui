"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { MapPin, Phone, Mail } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  const { site } = useSite();
  const { contact } = site;

  const quickLinks = [
    { label: "Home",         href: "/" },
    { label: "Restaurants",  href: "/#restaurants" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Offers",       href: "/#offers" },
    { label: "Contact",      href: "/contact" },
  ];

  const legalLinks = [
    "Privacy Policy",
    "Terms of Service",
    "Cookie Policy",
    "Refund Policy",
  ];

  return (
    <footer className="bg-[#1C0A00] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* ── Brand ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-black"
                style={{
                  background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})`,
                }}
              >
                {site.name.charAt(0)}
              </div>
              <span className="font-heading font-bold text-white text-xl">
                {site.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Bringing the best local food straight to your door in{" "}
              {site.location}. Fast, fresh, and always delicious.
            </p>

            {/* Social icons with real links */}
            <div className="flex gap-3">
              {/* Facebook */}
              <a
                href={`https://www.facebook.com/search/top?q=${encodeURIComponent(contact.facebook.handle)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={contact.facebook.label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2]/80 flex items-center justify-center transition-colors"
              >
                <FaFacebook className="w-4 h-4" size={16} />
              </a>
              {/* Instagram */}
              <a
                href={`https://www.instagram.com/${contact.instagram.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`@${contact.instagram.handle}`}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E1306C]/80 flex items-center justify-center transition-colors"
              >
                <FaInstagram className="w-4 h-4" size={16} />
              </a>
            </div>
          </div>

          {/* ── Quick links ── */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal ── */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact — real details from site config ── */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm">
              {/* Location */}
              <li className="flex items-start gap-2">
                <MapPin
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: site.theme.accent }}
                />
                <span>{site.location}, Northern Ireland</span>
              </li>

              {/* Phone — clickable */}
              <li className="flex items-center gap-2">
                <Phone
                  className="w-4 h-4 shrink-0"
                  style={{ color: site.theme.accent }}
                />
                <a
                  href={`tel:${contact.managerPhone.replace(/\s/g, "")}`}
                  className="hover:text-white transition-colors"
                >
                  {contact.managerPhone}
                </a>
              </li>

              {/* Email — clickable */}
              <li className="flex items-center gap-2">
                <Mail
                  className="w-4 h-4 shrink-0"
                  style={{ color: site.theme.accent }}
                />
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {contact.email}
                </a>
              </li>

              {/* Instagram */}
              <li className="flex items-center gap-2">
                <FaInstagram
                  size={16}
                  className="shrink-0"
                  style={{ color: site.theme.accent }}
                />
                <a
                  href={`https://www.instagram.com/${contact.instagram.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @{contact.instagram.handle}
                </a>
              </li>

              {/* Facebook */}
              <li className="flex items-center gap-2">
                <FaFacebook
                  size={16}
                  className="shrink-0"
                  style={{ color: site.theme.accent }}
                />
                <a
                  href={`https://www.facebook.com/search/top?q=${encodeURIComponent(contact.facebook.handle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {contact.facebook.label}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Made with ♥ in {site.location}</p>
        </div>
      </div>
    </footer>
  );
}
