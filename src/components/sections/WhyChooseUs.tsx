"use client";

import Image from "next/image";
import { useSite } from "@/context/SiteContext";
import { Zap, Shield, ThumbsUp, Headphones } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Delivery",
    desc: "We partner with local couriers who know the streets. Your food arrives hot, fast, and on time — every time.",
  },
  {
    icon: Shield,
    title: "Safe & Secure Payments",
    desc: "All transactions are fully encrypted with bank-grade security. Pay with confidence every time you order.",
  },
  {
    icon: ThumbsUp,
    title: "Quality Guaranteed",
    desc: "Every restaurant on our platform is vetted for food quality and hygiene. We only work with the best.",
  },
  {
    icon: Headphones,
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

          {/* Left — real food photo */}
          <div className="relative flex items-center justify-center order-last lg:order-first">
            <div
              className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: `3px solid ${site.theme.accent}33` }}
            >
              <Image
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=85"
                alt="Delicious food spread"
                width={560}
                height={560}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Overlay badges */}
            <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <Zap className="w-4 h-4" style={{ color: site.theme.accent }} />
              Fast Delivery
            </div>
            <div className="absolute bottom-4 left-4 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <ThumbsUp className="w-4 h-4" style={{ color: site.theme.accent }} />
              Top Rated
            </div>

          </div>

          {/* Right — features */}
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-4"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
              }}
            >
              Why {site.name}?
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Local Delivery Done Right
            </h2>
            <p className="text-gray-500 mb-10">
              We are proudly local — built for {site.location}, by people who love{" "}
              {site.location}. Here&apos;s what sets us apart.
            </p>

            <div className="space-y-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-gray-900 mb-1">{f.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
