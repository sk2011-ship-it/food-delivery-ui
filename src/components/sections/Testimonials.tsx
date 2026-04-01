"use client";

import { useSite } from "@/context/SiteContext";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    location: "Kilkeel",
    rating: 5,
    text: "Absolutely love it! The app is so easy to use and my food arrived piping hot in under 30 minutes. Best delivery service in town.",
    avatar: "👩",
  },
  {
    name: "James O.",
    location: "Downpatrick",
    rating: 5,
    text: "Finally a delivery service that actually knows our local area. The restaurant selection is great and the drivers are always friendly.",
    avatar: "👨",
  },
  {
    name: "Emma T.",
    location: "Newcastle",
    rating: 5,
    text: "Used it every week now for a month. Never had a bad experience. The tracking is brilliant and the food is always exactly as ordered.",
    avatar: "👩‍🦱",
  },
  {
    name: "Conor B.",
    location: "Kilkeel",
    rating: 4,
    text: "Really solid service. Love that it's local and supports local businesses. The pizza from The Pizza Palace is unreal!",
    avatar: "🧑",
  },
  {
    name: "Aoife D.",
    location: "Newcastle",
    rating: 5,
    text: "Customer service helped me straight away when I had a query. Super responsive and friendly. 10/10 would recommend.",
    avatar: "👩‍🦰",
  },
  {
    name: "Patrick N.",
    location: "Downpatrick",
    rating: 5,
    text: "Brilliant! I've ordered from at least 8 different restaurants through this and every single one has been great. Very impressed.",
    avatar: "👴",
  },
];

export default function Testimonials() {
  const { site } = useSite();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-4"
            style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
          >
            Real Reviews
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-500">Trusted by thousands of happy customers across {site.location} and beyond.</p>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</p>

              <div className="flex items-center gap-3">
                <span className="text-3xl">{r.avatar}</span>
                <div>
                  <p className="font-heading font-semibold text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
