/**
 * Software Development Page - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use platforms/CodeStudio.tsx directly.
 * This wrapper delegates to the main CodeStudio platform for enhanced capabilities.
 */

import CodeStudio from './platforms/CodeStudio';
import type { FC } from 'react';

console.warn('⚠️  Software Development Page: Using compatibility wrapper - consider migrating to platforms/CodeStudio');

const SoftwareDevelopment: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Compatibility Mode</p>
                <p className="text-xs text-yellow-700">This page redirects to the main CodeStudio platform. Consider updating your bookmarks.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delegate to main CodeStudio platform */}
        <CodeStudio />
      </div>
    </div>
  );
};

export default SoftwareDevelopment;