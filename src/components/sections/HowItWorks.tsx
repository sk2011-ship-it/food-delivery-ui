"use client";

import { useSite } from "@/context/SiteContext";

const steps = [
  {
    emoji: "📍",
    title: "Choose Your Location",
    desc: "Select from Kilkeel, Newcastle or Downpatrick and browse restaurants near you.",
    step: "01",
  },
  {
    emoji: "🍽️",
    title: "Pick Your Favourites",
    desc: "Browse menus, explore cuisines, and add delicious items to your cart.",
    step: "02",
  },
  {
    emoji: "💳",
    title: "Pay Securely",
    desc: "Checkout easily with card, Apple Pay, or Google Pay — all fully encrypted.",
    step: "03",
  },
  {
    emoji: "🚀",
    title: "Fast Delivery",
    desc: "Your food is picked up and delivered hot to your door in as little as 25 minutes.",
    step: "04",
  },
];

export default function HowItWorks() {
  const { site } = useSite();

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-4"
            style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
          >
            Simple &amp; Fast
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Getting great food delivered has never been easier. Four simple steps to your next meal.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 opacity-20"
            style={{ background: `linear-gradient(90deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step number badge */}
                <div className="relative mb-5">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${site.theme.gradientFrom}22, ${site.theme.gradientTo}33)`,
                      border: `2px solid ${site.theme.accent}44`,
                    }}
                  >
                    {s.emoji}
                  </div>
                  <span
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
                  >
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
