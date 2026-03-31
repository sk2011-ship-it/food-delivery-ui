export type RestaurantLocation = "Newcastle" | "Downpatrick" | "Kilkeel";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  is_available?: boolean;
  restaurant_id?: string;
}


export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  created_at?: string;
}

export interface MenuItemCreate {
  restaurant_id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  restaurant_id: string;
  created_at?: string;
}

export interface Owner {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location: RestaurantLocation;
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  owner_id?: string;
  image_url?: string;
  created_at?: string;
}

export interface RestaurantWithMenu extends Restaurant {
  menu_items: MenuItem[];
  categories: MenuCategory[];
}

export interface RestaurantWithStats extends Restaurant {
  avgPrice: number;
  cuisines: string[];
  rating: number;
  menu_items: MenuItem[];
}

export interface RestaurantWithStatus extends RestaurantWithStats {
  isOpen: boolean;
  isFavorite: boolean;
}

export type SortOption = "name" | "price" | "items" | "rating";
export type FilterOption = "all" | string;

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  total_amount: number;
  vat_amount: number;
  service_charge: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_intent_id?: string;
  created_at: string;
  restaurants?: { name: string };
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  created_at?: string;
}
