/**
 * Content Studio Platform Page - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use platforms/ContentStudio.tsx directly.
 * This wrapper delegates to the main Content Studio platform for enhanced capabilities.
 */

import ContentStudio from './platforms/ContentStudio';
import type { FC } from 'react';

console.warn('⚠️  Content Studio Platform: Using compatibility wrapper - consider migrating to platforms/ContentStudio');

const ContentStudioPlatform: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Compatibility Mode</p>
                <p className="text-xs text-yellow-700">This page redirects to the main Content Studio platform. Consider updating your bookmarks.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delegate to main Content Studio platform */}
        <ContentStudio />
      </div>
    </div>
  );
};

export default ContentStudioPlatform;