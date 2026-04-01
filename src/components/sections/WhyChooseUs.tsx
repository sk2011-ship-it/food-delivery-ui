"use client";

import { useSite } from "@/context/SiteContext";
import { Zap, Shield, ThumbsUp, Headphones } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Lightning Fast Delivery",
    desc: "We partner with local couriers who know the streets. Your food arrives hot, fast, and on time — every time.",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "Safe & Secure Payments",
    desc: "All transactions are fully encrypted with bank-grade security. Pay with confidence every time you order.",
  },
  {
    icon: <ThumbsUp className="w-7 h-7" />,
    title: "Quality Guaranteed",
    desc: "Every restaurant on our platform is vetted for food quality and hygiene. We only work with the best.",
  },
  {
    icon: <Headphones className="w-7 h-7" />,
    title: "24/7 Support",
    desc: "Something not right? Our local support team is always here to help you — day or night.",
  },
];

export default function WhyChooseUs() {
  const { site } = useSite();

  return (
    <section id="offers" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left — illustration */}
          <div className="relative flex items-center justify-center">
            <div
              className="w-72 h-72 sm:w-96 sm:h-96 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${site.theme.gradientFrom}15 0%, ${site.theme.gradientTo}25 100%)`,
                border: `2px dashed ${site.theme.accent}44`,
              }}
            >
              <span className="text-[120px] float">🍽️</span>
            </div>
            {/* Badge overlays */}
            <div className="absolute top-6 right-6 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 text-sm font-bold text-gray-800">
              ⚡ Fast Delivery
            </div>
            <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 text-sm font-bold text-gray-800">
              🌟 Top Rated
            </div>
            <div
              className="absolute -bottom-2 right-10 rounded-2xl shadow-xl px-4 py-2 text-white text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
            >
              Free delivery on first order!
            </div>
          </div>

          {/* Right — features */}
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-4"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
            >
              Why {site.name}?
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Local Delivery Done Right
            </h2>
            <p className="text-gray-500 mb-10">
              We are proudly local — built for {site.location}, by people who love {site.location}. Here's what sets us apart.
            </p>

            <div className="space-y-6">
              {features.map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-gray-900 mb-1">{f.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
