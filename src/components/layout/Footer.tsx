"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";

/**
 * Footer.tsx - Premium site footer with refined typography, 
 * glassmorphism touches, and high-end micro-interactions.
 */

export default function Footer() {
  const { site } = useSite();
  const { contact } = site;

  const quickLinks = [
    { label: "Home", href: "/#home" },
    { label: "Restaurants", href: "/#restaurants" },
    { label: "How It Works", href: "/#how-it-works" },
    // { label: "Offers", href: "/#offers" },
    { label: "Contact", href: "/contact" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookie Policy", href: "#" },
    { label: "Refund Policy", href: "/refund" },
  ];

  return (
    <footer className="relative bg-[#020617] text-slate-400 overflow-hidden">
      {/* Visual background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[200px] opacity-10 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${site.theme.primary} 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* ── Brand & Mission ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-heading font-black text-xl shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-500"
                style={{
                  background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                }}
              >
                {site.name.charAt(0)}
              </div>
              <span className="font-heading font-black text-white text-2xl tracking-tighter">
                {site.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs font-medium">
              Elevating the local dining experience in <span className="text-white font-bold">{site.location}</span>.
              Authentic flavours, premium service, delivered to your doorstep.
            </p>

            <div className="flex gap-4">
              {[
                { icon: FaFacebook, href: `https://www.facebook.com/search/top?q=${encodeURIComponent(contact.facebook.handle)}`, color: "#1877F2" },
                { icon: FaInstagram, href: `https://www.instagram.com/${contact.instagram.handle}`, color: "#E1306C" }
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-300 hover:text-white border transition-colors"
                  style={{ 
                    borderColor: `${site.theme.primary}30`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = site.theme.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${site.theme.primary}30`}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* ── Navigation ── */}
          <div>
            <h4 className="font-heading font-black text-white text-sm uppercase tracking-[0.2em] mb-6">
              Navigation
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center gap-2 hover:text-white transition-colors duration-300"
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300" 
                      style={{ backgroundColor: `${site.theme.primary}40` }}
                    />
                    <span 
                      className="text-sm font-bold tracking-tight group-hover:translate-x-1 transition-transform"
                      onMouseEnter={(e) => {
                        const dot = e.currentTarget.previousElementSibling as HTMLElement;
                        if (dot) dot.style.backgroundColor = site.theme.primary;
                      }}
                      onMouseLeave={(e) => {
                        const dot = e.currentTarget.previousElementSibling as HTMLElement;
                        if (dot) dot.style.backgroundColor = `${site.theme.primary}40`;
                      }}
                    >
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal ── */}
          <div>
            <h4 className="font-heading font-black text-white text-sm uppercase tracking-[0.2em] mb-6">
              Platform
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm font-bold tracking-tight hover:text-white transition-colors duration-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact Details ── */}
          <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-700/30">
            <h4 className="font-heading font-black text-white text-sm uppercase tracking-[0.2em] mb-6">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <MapPin 
                  className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" 
                  style={{ color: site.theme.primary }}
                />
                <span className="text-xs font-bold leading-tight">{site.location}, Northern Ireland</span>
              </li>

              {contact.managerPhone && (
                <li className="flex items-center gap-3 group">
                  <Phone 
                    className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" 
                    style={{ color: site.theme.primary }}
                  />
                  <a
                    href={`tel:${contact.managerPhone.replace(/\s/g, "")}`}
                    className="text-xs font-bold hover:text-white transition-colors duration-300"
                  >
                    {contact.managerPhone}
                  </a>
                </li>
              )}

              <li className="flex items-center gap-3 group">
                <Mail 
                  className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" 
                  style={{ color: site.theme.primary }}
                />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xs font-bold hover:text-white transition-colors duration-300 break-all"
                >
                  {contact.email}
                </a>
              </li>

              <li className="flex items-center gap-3 group">
                <FaFacebook 
                  size={20}
                  className="shrink-0 transition-transform group-hover:scale-110" 
                  style={{ color: site.theme.primary }}
                />
                <a
                  href={`https://www.facebook.com/search/top?q=${encodeURIComponent(contact.facebook.handle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold hover:text-white transition-colors duration-300"
                >
                  {contact.facebook.label}
                </a>
              </li>

              <li className="pt-2">
                <div 
                  className="p-3 rounded-xl border theme-transition"
                  style={{ 
                    backgroundColor: `${site.theme.primary}08`, 
                    borderColor: `${site.theme.primary}20` 
                  }}
                >
                  <p 
                    className="text-[10px] leading-relaxed font-black uppercase tracking-tight flex items-center gap-1.5"
                    style={{ color: site.theme.primary }}
                  >
                    <ExternalLink size={10} />
                    Support via Messenger
                  </p>
                  <p className="text-[10px] mt-1 text-slate-500 font-medium italic">
                    Need help? Message our Facebook page.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom Section ── */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
            © {new Date().getFullYear()} {site.name}. Curating local excellence.
          </p>
          <div className="flex items-center gap-6">
            <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
              Made with <span className="text-red-500 animate-pulse">♥</span> in {site.location}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
