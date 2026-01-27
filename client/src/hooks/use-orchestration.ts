'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// WAI SDK API Client for comprehensive orchestration system
const waiSDKClient = {
  getSystemHealth: () => apiRequest('/api/v9/health'),
  getOrchestrationStatus: () => apiRequest('/api/v9/orchestration/status'),
  getActiveExecutions: () => apiRequest('/api/v9/executions/active'),
  executeTask: (task: any) => 
    apiRequest('/api/v9/orchestration/execute', {
      method: 'POST',
      body: JSON.stringify(task)
    })
};

export function useOrchestrationHistory() {
  return useQuery({
    queryKey: ['orchestration', 'history'],
    queryFn: () => waiSDKClient.getOrchestrationHistory(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useOrchestrationStatus(id: string) {
  return useQuery({
    queryKey: ['orchestration', 'status', id],
    queryFn: () => waiSDKClient.getOrchestrationStatus(id),
    enabled: !!id,
    refetchInterval: 5000, // Refresh every 5 seconds for active monitoring
  });
}

export function useExecuteOrchestration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: any) => waiSDKClient.executeOrchestration(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['llm'] });
    },
  });
}