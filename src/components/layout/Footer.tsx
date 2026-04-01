"use client";

import { useSite } from "@/context/SiteContext";
import { MapPin, Phone, Mail, Share2, MessageCircle, X } from "lucide-react";

export default function Footer() {
  const { site } = useSite();

  return (
    <footer className="bg-[#1C0A00] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-black"
                style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` }}
              >
                {site.name.charAt(0)}
              </div>
              <span className="font-heading font-bold text-white text-xl">{site.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Bringing the best local food straight to your door. Fast, fresh, and always delicious.
            </p>
            <div className="flex gap-3">
              {[Share2, MessageCircle, X].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {["Home", "Restaurants", "How It Works", "Offers", "Contact"].map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase().replace(" ", "-")}`} className="hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "Refund Policy"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: site.theme.accent }} />
                <span>{site.location}, Northern Ireland</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: site.theme.accent }} />
                <span>+44 28 0000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: site.theme.accent }} />
                <span>hello@{site.key}.co.uk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Made with ❤️ in {site.location}</p>
        </div>
      </div>
    </footer>
  );
}
