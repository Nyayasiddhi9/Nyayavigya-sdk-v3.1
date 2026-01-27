/**
 * AI Game Builder Page - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use platforms/GameBuilder.tsx directly.
 * This wrapper delegates to the main Game Builder platform for enhanced capabilities.
 */

import GameBuilder from './platforms/GameBuilder';
import type { FC } from 'react';

console.warn('⚠️  AI Game Builder Page: Using compatibility wrapper - consider migrating to platforms/GameBuilder');

const AIGameBuilder: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Compatibility Mode</p>
                <p className="text-xs text-yellow-700">This page redirects to the main Game Builder platform. Consider updating your bookmarks.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delegate to main Game Builder platform */}
        <GameBuilder />
      </div>
    </div>
  );
};

export default AIGameBuilder;