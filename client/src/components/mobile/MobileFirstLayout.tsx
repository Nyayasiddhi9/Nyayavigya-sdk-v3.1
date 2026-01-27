// Phase 1 Mobile Excellence - Mobile-First Layout Component
// Principal Engineer & Release Captain Implementation

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, Mic, MicOff, Search, Bell, Settings } from 'lucide-react';
import { VoiceCommandInterface } from '../mobile/VoiceCommandInterface';
import { TouchGestureHandler } from '../mobile/TouchGestureHandler';
import { OfflineIndicator } from '../mobile/OfflineIndicator';

interface MobileFirstLayoutProps {
  children: React.ReactNode;
  className?: string;
  showVoiceControls?: boolean;
  enableGestures?: boolean;
}

export const MobileFirstLayout: React.FC<MobileFirstLayoutProps> = ({
  children,
  className,
  showVoiceControls = true,
  enableGestures = true
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const content = (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900",
      "flex flex-col",
      className
    )}>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700/50"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            
            <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              IIMX
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OfflineIndicator isOnline={isOnline} />
            
            {showVoiceControls && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceActive(!voiceActive)}
                className={cn(
                  "p-2 hover:bg-slate-700/50 transition-colors",
                  voiceActive && "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                )}
              >
                {voiceActive ? <Mic size={18} /> : <MicOff size={18} />}
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="p-2 hover:bg-slate-700/50">
              <Search size={18} />
            </Button>
            
            <Button variant="ghost" size="sm" className="p-2 hover:bg-slate-700/50">
              <Bell size={18} />
            </Button>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search platforms, projects, templates..."
              className="w-full px-4 py-2 pl-10 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/25"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <nav className="fixed top-0 left-0 bottom-0 w-64 bg-slate-800 border-r border-slate-700">
          <div className="p-4">
            <div className="font-bold text-xl mb-6 text-white">IIMX Platform</div>
            
            <div className="space-y-2">
              {/* Navigation items optimized for touch */}
              <a href="/" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Dashboard
              </a>
              
              <a href="/code-studio" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Code Studio
              </a>
              
              <a href="/ai-assistant-builder" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                AI Assistant Builder
              </a>
              
              <a href="/content-studio" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Content Studio
              </a>
              
              <a href="/game-builder" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-red-500 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Game Builder
              </a>
              
              <a href="/business-studio" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Business Studio
              </a>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TouchGestureHandler enabled={enableGestures} onSwipeLeft={() => setSidebarOpen(true)}>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </TouchGestureHandler>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-slate-800/90 backdrop-blur-lg border-t border-slate-700/50">
        <div className="grid grid-cols-5 gap-1">
          <a href="/" className="flex flex-col items-center py-2 px-1 text-blue-400">
            <div className="w-6 h-6 mb-1">🏠</div>
            <span className="text-xs">Home</span>
          </a>
          <a href="/code-studio" className="flex flex-col items-center py-2 px-1 text-slate-400">
            <div className="w-6 h-6 mb-1">💻</div>
            <span className="text-xs">Code</span>
          </a>
          <a href="/ai-assistant-builder" className="flex flex-col items-center py-2 px-1 text-slate-400">
            <div className="w-6 h-6 mb-1">🤖</div>
            <span className="text-xs">AI</span>
          </a>
          <a href="/content-studio" className="flex flex-col items-center py-2 px-1 text-slate-400">
            <div className="w-6 h-6 mb-1">✨</div>
            <span className="text-xs">Content</span>
          </a>
          <a href="/game-builder" className="flex flex-col items-center py-2 px-1 text-slate-400">
            <div className="w-6 h-6 mb-1">🎮</div>
            <span className="text-xs">Games</span>
          </a>
        </div>
      </div>

      {/* Voice Command Interface */}
      {showVoiceControls && (
        <VoiceCommandInterface 
          isActive={voiceActive} 
          onToggle={setVoiceActive}
        />
      )}
    </div>
  );

  return enableGestures ? (
    <TouchGestureHandler enabled={enableGestures}>
      {content}
    </TouchGestureHandler>
  ) : content;
};