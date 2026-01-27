import { QueryClient } from '@tanstack/react-query';

const API_BASE_URL = '';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return apiRequest(url, 'GET');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

export async function apiRequest(
  url: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists in localStorage
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for session-based auth
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  
  // Auto-unwrap WAI SDK's { success, data } response envelope
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    if (!json.success) {
      throw new Error(json.error || 'Request failed');
    }
    return json.data;
  }
  
  return json;
}

export default apiRequest;