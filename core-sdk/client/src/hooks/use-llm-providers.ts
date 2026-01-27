'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// WAI SDK API Client for comprehensive orchestration system
const waiSDKClient = {
  getLLMProviders: () => apiRequest('/api/v9/llm-providers'),
  getLLMProvider: (id: string) => apiRequest(`/api/v9/llm-providers/${id}`),
  getLLMModels: () => apiRequest('/api/v9/llm-models'),
  getLLMUsageAnalytics: () => apiRequest('/api/v9/analytics/llm-usage'),
  toggleLLMProvider: (providerId: string, enabled: boolean) => 
    apiRequest(`/api/v9/llm-providers/${providerId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    }),
  updateLLMProviderLimits: (providerId: string, limits: any) =>
    apiRequest(`/api/v9/llm-providers/${providerId}/limits`, {
      method: 'PUT', 
      body: JSON.stringify({ limits })
    })
};

export function useLLMProviders() {
  return useQuery({
    queryKey: ['llm', 'providers'],
    queryFn: () => waiSDKClient.getLLMProviders(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useLLMProvider(providerId: string) {
  return useQuery({
    queryKey: ['llm', 'providers', providerId],
    queryFn: () => waiSDKClient.getLLMProvider(providerId),
    enabled: !!providerId,
  });
}

export function useLLMModels() {
  return useQuery({
    queryKey: ['llm', 'models'],
    queryFn: () => waiSDKClient.getLLMModels(),
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

export function useLLMUsageAnalytics() {
  return useQuery({
    queryKey: ['llm', 'usage', 'analytics'],
    queryFn: () => waiSDKClient.getLLMUsageAnalytics(),
    refetchInterval: 30000,
  });
}

export function useToggleLLMProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, enabled }: { providerId: string; enabled: boolean }) =>
      waiSDKClient.toggleLLMProvider(providerId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm', 'providers'] });
    },
  });
}

export function useUpdateLLMProviderLimits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, limits }: { providerId: string; limits: any }) =>
      waiSDKClient.updateLLMProviderLimits(providerId, limits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm', 'providers'] });
    },
  });
}