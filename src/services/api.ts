import {
  AuthSuccessResponse,
  ErrorResponse,
  MessageResponse,
  UserResponse,
  AdminUser
} from "../types/auth";
import {
  Restaurant,
  RestaurantWithMenu,
  MenuCategory,
  MenuItem,
  MenuItemCreate,
  Owner
} from "../types/restaurant";

export const authService = {
  async signUp(
    email: string,
    password: string,
    confirmPassword: string,
    role: string,
    firstName: string,
    lastName: string,
    mobile: string,
    postcode: string
  ): Promise<AuthSuccessResponse> {
    const signupData = {
      email,
      password,
      confirmPassword,
      role,
      first_name: firstName,
      last_name: lastName,
      mobile,
      postcode
    };

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Signup failed');
    }
    return data as AuthSuccessResponse;
  },

  async signIn(email: string, password: string): Promise<AuthSuccessResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Login failed');
    }
    return data as AuthSuccessResponse;
  },

  async signOut(): Promise<MessageResponse> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Logout failed');
    }
    return data as MessageResponse;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await fetch('/api/auth/user');
    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Failed to fetch user');
    }
    return data as UserResponse;
  },

  async updateProfile(details: { first_name: string; last_name: string; mobile: string; postcode: string }): Promise<MessageResponse> {
    const response = await fetch('/api/auth/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Update failed');
    }
    return data as MessageResponse;
  },

  async updatePassword(password: string): Promise<MessageResponse> {
    const response = await fetch('/api/auth/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Password update failed');
    }
    return data as MessageResponse;
  },

  async requestPasswordReset(email: string, redirectTo: string): Promise<MessageResponse> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Password reset request failed');
    }
    return data as MessageResponse;
  },

  async verifyOtp(params: { token_hash?: string; code?: string; type: string }): Promise<AuthSuccessResponse> {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Verification failed');
    }
    return data as AuthSuccessResponse;
  },
};

export const restaurantService = {
  // --- Admin ---
  async getOwners(): Promise<Owner[]> {
    const response = await fetch('/api/admin/owners');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch owners');
    return data.owners;
  },

  async getAdminRestaurants(): Promise<Restaurant[]> {
    const response = await fetch('/api/admin/restaurants');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch restaurants');
    return data.restaurants;
  },

  async getAdminCategories(): Promise<MenuCategory[]> {
    const response = await fetch('/api/admin/categories');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data.categories;
  },

  async getAdminMenuItems(): Promise<MenuItem[]> {
    const response = await fetch('/api/admin/menu-items');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch menu items');
    return data.menuItems;
  },

  async getUsers(): Promise<AdminUser[]> {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
    return data.users;
  },

  async updateUserRole(id: string, role: string, details?: Partial<AdminUser>): Promise<MessageResponse> {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role, ...details }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  async createRestaurant(restaurant: Partial<Restaurant>): Promise<Restaurant> {
    const response = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create restaurant');
    return data.restaurant;
  },

  async deleteRestaurant(id: string): Promise<MessageResponse> {
    const response = await fetch(`/api/admin/restaurants?id=${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete restaurant');
    return data;
  },

  async updateRestaurant(id: string, restaurant: Partial<Restaurant>): Promise<Restaurant> {
    const response = await fetch(`/api/admin/restaurants?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update restaurant');
    return data.restaurant;
  },

  async createCategory(name: string, restaurantId: string): Promise<MenuCategory> {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, restaurant_id: restaurantId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create category');
    return data.category;
  },

  async createMenuItem(item: MenuItemCreate): Promise<MenuItem> {
    const response = await fetch('/api/admin/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create menu item');
    return data.menuItem;
  },

  async deleteMenuItem(id: string): Promise<MessageResponse> {
    const response = await fetch(`/api/admin/menu-items?id=${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete menu item');
    return data;
  },

  // --- Owner ---
  async getOwnerRestaurants(): Promise<Restaurant[]> {
    const response = await fetch('/api/owner/restaurants');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch owner restaurants');
    return data.restaurants;
  },

  async getOwnerCategories(): Promise<MenuCategory[]> {
    const response = await fetch('/api/owner/categories');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch owner categories');
    return data.categories;
  },

  async getOwnerMenuItems(): Promise<MenuItem[]> {
    const response = await fetch('/api/owner/menu-items');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch owner menu items');
    return data.menuItems;
  },

  async updateRestaurantByOwner(id: string, restaurant: Partial<Restaurant>): Promise<Restaurant> {
    const response = await fetch(`/api/owner/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update restaurant');
    return data.restaurant;
  },

  async updateMenuItemByOwner(id: string, restaurantId: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const response = await fetch(`/api/owner/menu-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, restaurant_id: restaurantId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu item');
    return data.menuItem;
  },

  async deleteMenuItemByOwner(id: string, restaurantId: string): Promise<MessageResponse> {
    const response = await fetch(`/api/owner/menu-items/${id}?restaurant_id=${restaurantId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete menu item');
    return data;
  },

  async createCategoryByOwner(name: string, restaurantId: string): Promise<MenuCategory> {
    const response = await fetch('/api/owner/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, restaurant_id: restaurantId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create category');
    return data.category;
  },

  async createMenuItemByOwner(item: MenuItemCreate): Promise<MenuItem> {
    const response = await fetch('/api/owner/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create menu item');
    return data.menuItem;
  },

  // --- Public ---
  async getPublicRestaurants(): Promise<Restaurant[]> {
    const response = await fetch('/api/v1/restaurants');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch restaurants');
    return data.restaurants;
  },

  async getPublicRestaurantById(id: string): Promise<RestaurantWithMenu> {
    const response = await fetch(`/api/v1/restaurants?id=${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch restaurant');
    return data.restaurant;
  },

  // --- Helpers ---
  async getCategories(restaurantId?: string): Promise<MenuCategory[]> {
    const url = restaurantId ? `/api/v1/categories?restaurant_id=${restaurantId}` : '/api/v1/categories';
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data.categories;
  },

  async getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
    const url = restaurantId ? `/api/v1/menu-items?restaurantId=${restaurantId}` : '/api/v1/menu-items';
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch menu items');
    return data.menuItems;
  },
};
