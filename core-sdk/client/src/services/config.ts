/**
 * Environment-aware API Configuration
 */

export interface APIConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;
  retries: number;
}

export function getAPIConfig(): APIConfig {
  // Determine base URL based on environment
  const getBaseUrl = (): string => {
    // Browser environment
    if (typeof window !== 'undefined') {
      // Production deployment
      if (window.location.hostname !== 'localhost') {
        return `${window.location.protocol}//${window.location.host}`;
      }
      // Development with custom backend URL
      return process.env.NEXT_PUBLIC_WAI_SDK_URL || 'http://localhost:5000';
    }
    
    // Server-side environment
    return process.env.WAI_SDK_URL || 'http://localhost:5000';
  };

  const baseUrl = getBaseUrl();
  
  return {
    baseUrl,
    wsUrl: baseUrl.replace('http', 'ws') + '/api/ws',
    timeout: 30000,
    retries: 3,
  };
}

export function validateAPIEndpoint(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  return fetch(`${baseUrl}/api/health/v9`, {
    method: 'GET',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      clearTimeout(timeoutId);
      return response.ok;
    })
    .catch(() => {
      clearTimeout(timeoutId);
      return false;
    });
}