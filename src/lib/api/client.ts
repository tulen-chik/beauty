import { axiosInstance } from './axios';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://147.45.231.110';
const TOKEN_COOKIE_NAME = 'access_token';

interface FetchOptions {
  requiresAuth?: boolean;
  headers?: Record<string, string>;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {} } = options;

  try {
    const { data } = await axiosInstance.request<T>({
      url: endpoint,
      headers,
      // If requiresAuth is false, we'll skip the auth token
      // The interceptor will handle this automatically
    });
    return data;
  } catch (error) {
    // Error handling is already done in the axios interceptor
    throw error;
  }
} 