import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Wrench, Workflow, Settings, Menu, X, Code, MessageSquare } from 'lucide-react';
import GlobalHeader from '@/components/GlobalHeader';
import SuperAgentChat from './superagent/Chat';
import SuperAgentToolMarketplace from './superagent/ToolMarketplace';
import SuperAgentWorkflowBuilder from './superagent/WorkflowBuilder';
import SuperAgentSettings from './superagent/Settings';
import SuperAgentIDE from './superagent/IDE';

export default function SuperAgent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] flex flex-col">
      {/* Global Header with Platform Switcher */}
      <GlobalHeader />
      
      <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-[hsl(222,47%,15%)] border-r border-white/10 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-400" />
              <h1 className="text-lg font-bold text-white">AI Super Agent</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid="nav-chat"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('ide')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'ide'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid="nav-ide"
            >
              <Code className="w-5 h-5" />
              <span>IDE Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'tools'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid="nav-tools"
            >
              <Wrench className="w-5 h-5" />
              <span>Tools (93)</span>
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'workflows'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid="nav-workflows"
            >
              <Workflow className="w-5 h-5" />
              <span>Workflows</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid="nav-settings"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Agent Status */}
        <div className="p-4 mt-auto border-t border-white/10">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-400">267+ Agents Active</span>
            </div>
            <p className="text-xs text-gray-400">23 LLM Providers Connected</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-[hsl(222,47%,15%)] border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                data-testid="button-open-sidebar"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {activeTab === 'chat' && 'Multi-Modal Chat'}
              {activeTab === 'ide' && 'AI IDE Workspace'}
              {activeTab === 'tools' && 'Tool Marketplace'}
              {activeTab === 'workflows' && 'Visual Workflow Builder'}
              {activeTab === 'settings' && 'Settings & Configuration'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-gray-300 hover:bg-white/10"
              data-testid="button-new-conversation"
            >
              New Conversation
            </Button>
          </div>
        </div>

        {/* Content Area - Conditionally render based on activeTab */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <SuperAgentChat />
          ) : activeTab === 'ide' ? (
            <SuperAgentIDE />
          ) : activeTab === 'tools' ? (
            <SuperAgentToolMarketplace />
          ) : activeTab === 'workflows' ? (
            <SuperAgentWorkflowBuilder />
          ) : activeTab === 'settings' ? (
            <SuperAgentSettings />
          ) : (
            <SuperAgentChat />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
