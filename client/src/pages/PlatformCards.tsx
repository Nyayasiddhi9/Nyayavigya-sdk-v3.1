/**
 * Platform Cards Component - Display available WAI platform cards
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';



interface WAIIntegration {
  enabled: boolean;
  agents: number;
  providers: number;
  orchestration: string;
}

interface PlatformCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'development' | 'testing' | 'ready' | 'deployed' | 'production';
  url: string;
  features: string[];
  targetUsers: string[];
  screenshots?: string[];
  demoUrl?: string;
  launchAction: 'embedded' | 'new_tab' | 'modal';
  waiIntegration?: WAIIntegration;
}

interface PlatformCardsResponse {
  success: boolean;
  platforms: PlatformCard[];
  totalPlatforms: number;
  readyPlatforms: number;
  testingPlatforms: number;
}

export const PlatformCards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCard | null>(null);

  const { data: platformsData, isLoading, error } = useQuery<PlatformCardsResponse>({
    queryKey: ['/api/platforms/cards'],
    queryFn: () => apiRequest('/api/platforms/cards'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Debug logging
  React.useEffect(() => {
    if (error) {
      console.error('Platform loading error:', error);
    }
    if (platformsData) {
      console.log('Platforms loaded successfully:', platformsData);
    }
  }, [error, platformsData]);

  const platforms = platformsData?.platforms || [];
  const categories = ['all', ...Array.from(new Set(platforms.map((p: PlatformCard) => p.category)))];
  
  const filteredPlatforms = selectedCategory === 'all' 
    ? platforms 
    : platforms.filter((p: PlatformCard) => p.category === selectedCategory);

  // Debug logging
  console.log('Platform Cards Debug:', {
    isLoading,
    error,
    platformsData,
    platforms: platforms.length,
    categories,
    filteredPlatforms: filteredPlatforms.length
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200';
      case 'ready': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'testing': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'development': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'deployed': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'development': return 'text-blue-600 dark:text-blue-400';
      case 'creative': return 'text-purple-600 dark:text-purple-400';
      case 'design': return 'text-orange-600 dark:text-orange-400';
      case 'business': return 'text-green-600 dark:text-green-400';
      case 'conversation': return 'text-red-600 dark:text-red-400';
      case 'gaming': return 'text-indigo-600 dark:text-indigo-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handlePlatformLaunch = (platform: PlatformCard) => {
    switch (platform.launchAction) {
      case 'embedded':
        // For embedded, we'll show a modal or navigate to the platform
        setSelectedPlatform(platform);
        break;
      case 'new_tab':
        window.open(platform.url, '_blank');
        break;
      case 'modal':
        setSelectedPlatform(platform);
        break;
      default:
        window.location.href = platform.url;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Platform Cards Error Details:', error);
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
          Failed to Load Platforms
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">
          Unable to load platform cards. Please try refreshing the page.
        </p>
        <details className="text-left bg-red-100 dark:bg-red-800/20 p-3 rounded border">
          <summary className="cursor-pointer text-red-800 dark:text-red-200 font-medium text-sm">Show Error Details</summary>
          <pre className="text-xs text-red-700 dark:text-red-300 mt-2 overflow-auto max-h-32">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              WAI Platform Suite
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Specialized AI-powered platforms for different use cases and industries
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {platformsData?.totalPlatforms || 0} Platforms Available
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✅ {platformsData?.readyPlatforms || 0} Ready
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              🧪 {platformsData?.testingPlatforms || 0} Testing
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <span className="text-xl">🚀</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Production</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {platforms.filter((p: PlatformCard) => p.status === 'ready').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-xl">🧪</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Testing</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {platforms.filter((p: PlatformCard) => p.status === 'testing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-xl">🔨</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Development</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {platforms.filter((p: PlatformCard) => p.status === 'development').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-xl">🌟</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {platformsData?.totalPlatforms || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlatforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
            onClick={() => handlePlatformLaunch(platform)}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{platform.icon}</div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(platform.status)}`}>
                    {platform.status}
                  </span>
                </div>
              </div>

              {/* Title and Description */}
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {platform.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {platform.description}
              </p>

              {/* Category */}
              <div className="mb-4">
                <span className={`text-sm font-medium capitalize ${getCategoryColor(platform.category)}`}>
                  {platform.category}
                </span>
              </div>

              {/* Features */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {platform.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {platform.features.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{platform.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Target Users */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Users:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {platform.targetUsers.join(', ')}
                </p>
              </div>

              {/* WAI Integration Badge */}
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">🧠 WAI Integration</span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      v5.1
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {platform.id === 'code-studio' ? '100+' : 
                     platform.id === 'game-studio' ? '90+' : 
                     platform.id === 'business-studio' ? '95+' : 
                     platform.id === 'conversation-studio' ? '85+' : '75+'} Agents
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium">
                {platform.status === 'production' ? '🚀 Launch Platform' : 
                 platform.status === 'ready' ? 'Launch Platform' : 
                 platform.status === 'testing' ? 'Try Beta' : 
                 'View Details'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Detail Modal */}
      {selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedPlatform.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedPlatform.name}
                    </h2>
                    <span className={`text-sm font-medium capitalize ${getCategoryColor(selectedPlatform.category)}`}>
                      {selectedPlatform.category} Platform
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedPlatform.status)}`}>
                  {selectedPlatform.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedPlatform.description}
              </p>

              {/* WAI Integration Details */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">🧠 Unified WAI Integration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">AI Agents</p>
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                      {selectedPlatform.id === 'code-studio' ? '100+' : 
                       selectedPlatform.id === 'game-studio' ? '90+' : 
                       selectedPlatform.id === 'business-studio' ? '95+' : 
                       selectedPlatform.id === 'conversation-studio' ? '85+' : '75+'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">LLM Providers</p>
                    <p className="text-xl font-bold text-purple-800 dark:text-purple-200">14+</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Orchestration</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">v5.1</p>
                  </div>
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">Status</p>
                    <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Production Ready</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlatform.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Users */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Target Users</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.targetUsers.map((user, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {user}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                {selectedPlatform.demoUrl && (
                  <button
                    onClick={() => window.open(selectedPlatform.demoUrl, '_blank')}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    View Demo
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedPlatform(null);
                    window.open(selectedPlatform.url, '_blank');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Launch Platform
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};