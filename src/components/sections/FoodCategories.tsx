"use client";

import { useSite } from "@/context/SiteContext";
import { Pizza, Beef, Soup, Flame, Fish, Salad, Drumstick, Cookie, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category {
  icon: LucideIcon;
  name: string;
  count: number;
}

const categories: Category[] = [
  { icon: Pizza,     name: "Pizza",    count: 12 },
  { icon: Beef,      name: "Burgers",  count: 18 },
  { icon: Soup,      name: "Asian",    count: 9  },
  { icon: Flame,     name: "Mexican",  count: 7  },
  { icon: Fish,      name: "Sushi",    count: 5  },
  { icon: Salad,     name: "Healthy",  count: 14 },
  { icon: Drumstick, name: "Chicken",  count: 11 },
  { icon: Cookie,    name: "Desserts", count: 8  },
];

export default function FoodCategories() {
  const { site } = useSite();
  const router = useRouter();

  return (
    <section id="restaurants" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-3"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
              }}
            >
              Browse {site.location}
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900">
              What Are You Craving?
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              Choose a category and find the best restaurants delivering to {site.location} right now.
            </p>
          </div>
          <a
            href="#all-restaurants"
            className="inline-flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2"
            style={{ color: site.theme.primary }}
          >
            View all restaurants <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Category chips */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={i}
                onClick={() => router.push(`/dashboard/customer/category/${encodeURIComponent(c.name)}`)}
                className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100"
              >
                <span
                  className="w-12 h-12 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${site.theme.gradientFrom}15, ${site.theme.gradientTo}25)`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: site.theme.gradientFrom }}
                    strokeWidth={1.75}
                  />
                </span>
                <span className="text-xs font-semibold text-gray-700 leading-tight text-center">
                  {c.name}
                </span>
                <span className="text-[10px] text-gray-400 opacity-0 hidden">{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
