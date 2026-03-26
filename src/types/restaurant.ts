export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  opening: string;
  closing: string;
  menu: MenuItem[];
  categories: MenuCategory[];
}

export interface RestaurantWithStats extends Restaurant {
  avgPrice: number;
  cuisines: string[];
  rating: number;
}

export interface RestaurantWithStatus extends RestaurantWithStats {
  isOpen: boolean;
  isFavorite: boolean;
}

export type SortOption = "name" | "price" | "items" | "rating";
export type FilterOption = "all" | string;
