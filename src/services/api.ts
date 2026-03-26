import { 
  AuthSuccessResponse, 
  ErrorResponse, 
  MessageResponse, 
  UserResponse 
} from "../types/auth";

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
