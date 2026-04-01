export type SiteKey = "downpatrickeats" | "newcastleeats" | "kilkeeleats";

export interface SiteConfig {
  key: SiteKey;
  name: string;
  tagline: string;
  description: string;
  location: string;
  hero: {
    headline: string;
    subheadline: string;
  };
  theme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
    badge: string;
  };
  stats: {
    restaurants: string;
    deliveries: string;
    rating: string;
    minutes: string;
  };
}

export const SITES: Record<SiteKey, SiteConfig> = {
  kilkeeleats: {
    key: "kilkeeleats",
    name: "Kilkeel Eats",
    tagline: "Food Delivery Service",
    description:
      "Your favourite restaurants in Kilkeel delivered fast to your door.",
    location: "Kilkeel",
    hero: {
      headline: "Hungry? We've Got Kilkeel Covered.",
      subheadline:
        "Order from the best local restaurants and get hot food delivered straight to your door in minutes.",
    },
    theme: {
      gradientFrom: "#C0392B",
      gradientVia: "#E74C3C",
      gradientTo: "#F39C12",
      primary: "#E74C3C",
      accent: "#F39C12",
      badge: "bg-red-600",
    },
    stats: {
      restaurants: "30+",
      deliveries: "5K+",
      rating: "4.8",
      minutes: "30",
    },
  },
  downpatrickeats: {
    key: "downpatrickeats",
    name: "Downpatrick Eats",
    tagline: "Food Delivery Service",
    description:
      "Your favourite restaurants in Downpatrick delivered fast to your door.",
    location: "Downpatrick",
    hero: {
      headline: "Hungry? We've Got Downpatrick Covered.",
      subheadline:
        "Order from the best local restaurants and get hot food delivered straight to your door in minutes.",
    },
    theme: {
      gradientFrom: "#1A3A5C",
      gradientVia: "#2980B9",
      gradientTo: "#1ABC9C",
      primary: "#2980B9",
      accent: "#1ABC9C",
      badge: "bg-blue-700",
    },
    stats: {
      restaurants: "45+",
      deliveries: "8K+",
      rating: "4.9",
      minutes: "25",
    },
  },
  newcastleeats: {
    key: "newcastleeats",
    name: "Newcastle Eats",
    tagline: "Food Delivery Service",
    description:
      "Your favourite restaurants in Newcastle delivered fast to your door.",
    location: "Newcastle",
    hero: {
      headline: "Hungry? We've Got Newcastle Covered.",
      subheadline:
        "Order from the best local restaurants and get hot food delivered straight to your door in minutes.",
    },
    theme: {
      gradientFrom: "#1B4332",
      gradientVia: "#2D6A4F",
      gradientTo: "#52B788",
      primary: "#2D6A4F",
      accent: "#52B788",
      badge: "bg-green-700",
    },
    stats: {
      restaurants: "35+",
      deliveries: "6K+",
      rating: "4.7",
      minutes: "28",
    },
  },
};

export const DEFAULT_SITE: SiteKey = "kilkeeleats";

export const ALL_SITES = Object.values(SITES);
