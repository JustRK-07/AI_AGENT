/**
 * Authentication Service
 * Handles login, registration, and session management
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/config/api.config';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  tenantName?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  isAdmin?: boolean;
  tenantId: string | null;  // Can be null for admin users
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          token: string;
          tokenType: string;
          user: User;
        };
      }>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      // Extract data from wrapped response
      const { token, user } = response.data;

      // Store token and user data
      apiClient.setToken(token);
      this.storeUserData(user);

      return { token, user };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.error || 'Login failed');
    }
  },

  /**
   * Register new user
   * Note: Backend register endpoint doesn't return a token yet,
   * so users need to login separately after registration
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: User;
        message: string;
      }>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      // Backend doesn't return token on register, so auto-login after registration
      const loginResponse = await this.login({
        email: data.email,
        password: data.password,
      });

      return loginResponse;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.error || 'Registration failed');
    }
  },

  /**
   * Logout
   */
  logout(): void {
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      // Redirect to auth page
      window.location.href = '/auth';
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  /**
   * Get current user data from localStorage
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  },

  /**
   * Get current active tenant ID
   * - For tenant users: Returns their tenantId from JWT
   * - For system admins: Returns selected tenant from localStorage (or default for testing)
   */
  getTenantId(): string | null {
    if (typeof window === 'undefined') return null;

    const user = this.getCurrentUser();

    // For regular tenant users: use their tenantId from JWT
    if (user?.tenantId) {
      return user.tenantId;
    }

    // For system admins: check if they've selected a tenant
    if (user?.isAdmin) {
      const selectedTenant = localStorage.getItem(STORAGE_KEYS.SELECTED_TENANT);
      if (selectedTenant) {
        return selectedTenant;
      }

      // Default tenant for testing (TODO: Show tenant selector in UI)
      return '7c8693c6-976e-4324-9123-2c1d811605f9'; // Ytel QA Team
    }

    return null;
  },

  /**
   * Set active tenant for system administrators
   * Regular tenant users cannot change their tenant
   */
  setActiveTenant(tenantId: string): void {
    if (typeof window === 'undefined') return;

    const user = this.getCurrentUser();
    if (!user?.isAdmin) {
      console.warn('Only system administrators can change active tenant');
      return;
    }

    localStorage.setItem(STORAGE_KEYS.SELECTED_TENANT, tenantId);
  },

  /**
   * Get active tenant display name (for UI)
   */
  getActiveTenantId(): string | null {
    return this.getTenantId();
  },

  /**
   * Check if current user is an admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin === true || user?.role === 'admin' || user?.role === 'ADMIN';
  },

  /**
   * Store user data in localStorage
   */
  storeUserData(user: User): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    // Only store tenantId if user has one (admin users may not have tenantId)
    if (user.tenantId) {
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, user.tenantId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
    }
  },
};

export default authService;
