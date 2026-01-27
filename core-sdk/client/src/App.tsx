import { useState, useEffect, lazy, Suspense } from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundaryWithRetry } from './components/ErrorBoundaryWithRetry';
import { AssistantDrawer } from './components/AssistantDrawer';
import { LanguageProvider } from './contexts/LanguageContext';
import OrchestrationDashboard from './pages/orchestration-dashboard';
import NotFound from './pages/not-found';
import Login from './pages/Login';
import Homepage from './pages/Homepage';
import IndexLanding from './pages/IndexLanding';
// Platform specific pages - Clean 5 Platform Architecture
import CodeStudio from './pages/platforms/CodeStudio';
import AIAssistantBuilderPlatform from './pages/platforms/AIAssistantBuilder';
import ContentStudio from './pages/platforms/ContentStudio';
import GameBuilder from './pages/platforms/GameBuilder';
import BusinessStudioPlatform from './pages/platforms/BusinessStudio';
// Admin & Management Console - Enterprise Management Interface
import AdminConsole from './pages/admin-console';
import StudioConsole from './pages/studio-console';
import RealtimeDashboard from './pages/realtime-dashboard';
import AgentOrchestration from './pages/AgentOrchestration';
import AgentRegistry from './pages/AgentRegistry';
import ModelCatalog from './pages/ModelCatalog';
import StartupDetail from './pages/startup-detail';
import JourneyGuidePage from './pages/journey-guide-page';
import WizardsIncubatorPlatform from './pages/WizardsIncubatorPlatform';
import ApplicationForm from './pages/ApplicationForm';
import InvestorDiscovery from './pages/InvestorDiscovery';
import InvestorProfile from './pages/InvestorProfile';
import FounderLogin from './pages/founder-login';
import FounderSignup from './pages/founder-signup';
import FounderOnboarding from './pages/founder-onboarding';
import FounderDashboard from './pages/founder-dashboard';
import CreditsDashboard from './pages/credits-dashboard';
import QuickStartGuide from './pages/QuickStartGuide';
import Studios from './pages/studios';
import StudioDetail from './pages/studio-detail';
import InvestorMatching from './pages/investor-matching';
import AdminConsoleWizards from './pages/admin-console-wizards';
import SDLCDashboard from './pages/sdlc-dashboard';
import CompetitorAnalysis from './pages/competitor-analysis';
import MVPTimelineTracker from './pages/mvp-timeline-tracker';
import AgentActivityDashboard from './pages/agent-activity-dashboard';

// Studio workspaces - lazy loaded
const IdeationLabWorkspace = lazy(() => import('./pages/studios/ideation-lab'));
const EngineeringForgeWorkspace = lazy(() => import('./pages/studios/engineering-forge'));
const MarketIntelligenceWorkspace = lazy(() => import('./pages/studios/market-intelligence'));
const ProductBlueprintWorkspace = lazy(() => import('./pages/studios/product-blueprint'));
const ExperienceDesignWorkspace = lazy(() => import('./pages/studios/experience-design'));
const QualityAssuranceLabWorkspace = lazy(() => import('./pages/studios/quality-assurance-lab'));
const LaunchCommandWorkspace = lazy(() => import('./pages/studios/launch-command'));
const GrowthEngineWorkspace = lazy(() => import('./pages/studios/growth-engine'));
const OperationsHubWorkspace = lazy(() => import('./pages/studios/operations-hub'));
const DeploymentStudioWorkspace = lazy(() => import('./pages/studios/deployment-studio'));
import { handleError, logError } from './lib/errorHandler';
import { AuthProvider } from './contexts/AuthContext';
import HelpButton from './components/help/HelpButton';
// P0 Orchestration Dashboards
import A2ACollaborationDashboard from './pages/orchestration/A2ACollaborationDashboard';
import BMADWorkflowVisualizer from './pages/orchestration/BMADWorkflowVisualizer';
import MemoryBrowserCAM from './pages/orchestration/MemoryBrowserCAM';
import GRPOTrainingDashboard from './pages/orchestration/GRPOTrainingDashboard';
import PolicyManagementConsole from './pages/orchestration/PolicyManagementConsole';
import EnforcementMonitoring from './pages/EnforcementMonitoring';
import CAMDashboardPage from './pages/orchestration/CAMDashboardPage';
import P1AIQualityTest from './pages/p1-ai-quality-test';
import SuperAgent from './pages/SuperAgent';
import ShaktiAI from './pages/ShaktiAI';
import MultimodalStudio from './pages/multimodal/MultimodalStudio';
import WaiSdkAdmin from './pages/wai-sdk-admin';
import UniversalChat from './pages/UniversalChat';
import WAIOrchestrationHub from './pages/wai-orchestration-hub';
import GlobalAgentChat from './pages/GlobalAgentChat';
import WAIAdminDashboard from './pages/WAIAdminDashboard';

// Demo Mode Pages (No Login Required)
import DemoStudios from './pages/demo/studios';
import DemoStudioWorkspace from './pages/demo/studios/[studioId]';

// Redirect Component for SPA-friendly navigation
const RedirectTo = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
};

// Error Fallback Component
const ErrorFallback = ({ error, context, resetError }: { error: Error; context: string; resetError: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
      <div className="text-red-600 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Critical Error</h1>
      <p className="text-gray-600 mb-4">Context: {context}</p>
      <p className="text-sm text-gray-500 mb-6">{error.message}</p>
      <button 
        onClick={resetError}
        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Reload Application
      </button>
    </div>
  </div>
);

interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Wizards Incubator Platform - AI-Powered Startup Accelerator';

    const checkAuthentication = async () => {
      try {
        // First, check localStorage for stored user and token
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Hydrate user from localStorage immediately for instant UI
            setUser({
              id: userData.id,
              name: userData.name || userData.email,
              email: userData.email,
              avatar: userData.avatar,
              role: userData.role,
              subscriptionTier: userData.subscriptionTier || userData.subscriptionPlan || 'alpha',
              subscriptionStatus: userData.subscriptionStatus || 'active'
            });

            // Then validate token with backend and get canonical user data
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              },
              credentials: 'include'
            });

            if (response.ok) {
              // Token is valid - update with server's canonical data
              const serverData = await response.json();
              if (serverData.user) {
                const canonicalUser = {
                  id: serverData.user.id,
                  name: serverData.user.name || serverData.user.email,
                  email: serverData.user.email,
                  avatar: serverData.user.avatar || serverData.user.avatarUrl,
                  role: serverData.user.role,
                  subscriptionTier: serverData.user.subscriptionTier || serverData.user.subscriptionPlan || 'alpha',
                  subscriptionStatus: serverData.user.subscriptionStatus || 'active'
                };
                
                // Replace localStorage and state with server data (source of truth)
                localStorage.setItem('user', JSON.stringify(canonicalUser));
                setUser(canonicalUser);
              }
            } else {
              // Token is invalid/expired - clear everything and log out
              console.warn('Token validation failed - logging out');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch (parseError) {
            console.error('Failed to parse stored user:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    // Clear localStorage on logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Wizards Incubator Platform...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('critical')) {
    return <ErrorFallback error={new Error(error)} context="App Initialization" resetError={() => window.location.reload()} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <AuthProvider user={user} login={handleLoginSuccess} logout={handleLogout}>
        <ErrorBoundaryWithRetry>
          <div className="min-h-screen bg-background">
            <Router>
              <Switch>
                {/* SHAKTI AI - Universal Agent Platform - Public Access */}
                <Route path="/shakti-ai/:workspace" component={ShaktiAI} />
                <Route path="/shakti-ai" component={ShaktiAI} />
                
                {/* AI Super Agent Platform - Public Access (Legacy) */}
                <Route path="/superagent" component={SuperAgent} />
                <Route path="/superagent/demo" component={SuperAgent} />
                
                {/* WAI SDK Admin Dashboard - Comprehensive Platform Management */}
                <Route path="/wai-admin" component={WaiSdkAdmin} />
                
                {/* WAI Admin Dashboard - Multi-Tenant Organization Management */}
                <Route path="/wai-admin-dashboard" component={WAIAdminDashboard} />
                <Route path="/org-admin" component={WAIAdminDashboard} />
                
                {/* WAI Orchestration Hub - Unified Enterprise Dashboard */}
                <Route path="/wai-hub" component={WAIOrchestrationHub} />
                <Route path="/orchestration-hub" component={WAIOrchestrationHub} />
                
                {/* Universal Chat Interface - WAI SDK Orchestration Console */}
                <Route path="/chat" component={UniversalChat} />
                <Route path="/universal-chat" component={UniversalChat} />
                
                {/* Global Agent Chat - World-Class Agent Interface */}
                <Route path="/global-chat" component={GlobalAgentChat} />
                <Route path="/agent-chat" component={GlobalAgentChat} />
                
                {/* Multimodal AI Studio - Vision, Speech, Document Processing */}
                <Route path="/multimodal" component={MultimodalStudio} />
                
                {/* Demo Mode Routes - No Login Required */}
                <Route path="/demo/studios" component={DemoStudios} />
                <Route path="/demo/studios/:studioId" component={DemoStudioWorkspace} />
                
                {/* Authentication Routes - Redirect to dashboard if already logged in */}
                <Route path="/founder-login">
                  {() => user ? <RedirectTo to="/founder-dashboard" /> : <FounderLogin />}
                </Route>
                <Route path="/founder-signup">
                  {() => user ? <RedirectTo to="/founder-dashboard" /> : <FounderSignup />}
                </Route>
                <Route path="/founder-onboarding" component={FounderOnboarding} />
                <Route path="/login">
                  {() => user ? <RedirectTo to="/founder-dashboard" /> : <Login onLoginSuccess={handleLoginSuccess} />}
                </Route>
                
                {/* Founder Dashboard - Protected Route with Auth Check */}
                <Route path="/founder-dashboard">
                  {() => user ? <FounderDashboard /> : <RedirectTo to="/founder-login" />}
                </Route>
                <Route path="/dashboard">
                  {() => user ? <RedirectTo to="/founder-dashboard" /> : <RedirectTo to="/founder-login" />}
                </Route>
                
                {/* Master Index - Landing page with platform selection */}
                <Route path="/" exact component={IndexLanding} />
                
                {/* Legacy Homepage - redirects to master index */}
                <Route path="/home" component={Homepage} />
            
            {/* Protected Routes - Require Authentication */}
            {user && (
              <>
                {/* Wizards Incubator Platform - Main Homepage */}
                <Route path="/wizards-platform" component={WizardsIncubatorPlatform} />
            
            {/* Credits Dashboard */}
            <Route path="/credits" component={CreditsDashboard} />
            
            {/* Quick Start Guide for Beta Users */}
            <Route path="/quick-start" component={QuickStartGuide} />
            
            {/* Studios */}
            <Route path="/studios" component={Studios} />
            
            {/* Studio Interfaces - Interactive Workspaces (MUST come BEFORE :studioId route) */}
            <Route path="/studios/ideation-lab/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <IdeationLabWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/engineering-forge/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <EngineeringForgeWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/market-intelligence/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <MarketIntelligenceWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/product-blueprint/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <ProductBlueprintWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/experience-design/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <ExperienceDesignWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/quality-assurance-lab/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <QualityAssuranceLabWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/launch-command/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <LaunchCommandWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/growth-engine/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                  <GrowthEngineWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/operations-hub/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>}>
                  <OperationsHubWorkspace />
                </Suspense>
              )}
            </Route>
            <Route path="/studios/deployment-studio/work">
              {() => (
                <Suspense fallback={<div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
                  <DeploymentStudioWorkspace />
                </Suspense>
              )}
            </Route>
            
            {/* Studio Detail Page (MUST come AFTER specific workspace routes) */}
            <Route path="/studios/:studioId" component={StudioDetail} />
            
            {/* Investor Matching Platform */}
            <Route path="/investor-matching" component={InvestorMatching} />
            
            {/* Competitor Analysis Dashboard */}
            <Route path="/competitor-analysis" component={CompetitorAnalysis} />
            
            {/* 14-Day MVP Timeline Tracker */}
            <Route path="/mvp-timeline" component={MVPTimelineTracker} />
            
            {/* Real-time Agent Activity Dashboard */}
            <Route path="/agent-activity" component={AgentActivityDashboard} />
            
            {/* Admin Console for Wizards Platform */}
            <Route path="/admin/wizards" component={AdminConsoleWizards} />
            
            {/* SDLC Automation Dashboard */}
            <Route path="/sdlc" component={SDLCDashboard} />
            <Route path="/sdlc-dashboard" component={SDLCDashboard} />
            
            {/* Orchestration Layer - Admin/Technical Dashboard */}
            <Route path="/orchestration-dashboard" component={OrchestrationDashboard} />
            <Route path="/login">
              {() => <Login onLoginSuccess={handleLoginSuccess} />}
            </Route>
            <Route path="/auth">
              {() => <Login onLoginSuccess={handleLoginSuccess} />}
            </Route>
            
            {/* Clean 5 Platform Architecture - WAI DevStudio v9.0 */}
            <Route path="/platforms/code-studio" component={CodeStudio} />
            <Route path="/platforms/content-studio" component={ContentStudio} />
            <Route path="/platforms/ai-assistant-builder" component={AIAssistantBuilderPlatform} />
            <Route path="/platforms/game-builder" component={GameBuilder} />
            <Route path="/platforms/business-studio" component={BusinessStudioPlatform} />
            
            {/* Direct platform routes for easier access */}
            <Route path="/code-studio" component={CodeStudio} />
            <Route path="/content-studio" component={ContentStudio} />
            <Route path="/ai-assistant-builder" component={AIAssistantBuilderPlatform} />
            <Route path="/game-builder" component={GameBuilder} />
            <Route path="/business-studio" component={BusinessStudioPlatform} />
            
            {/* Admin & Management Console Routes - Enterprise Management */}
            <Route path="/admin-console" component={AdminConsole} />
            <Route path="/admin" component={AdminConsole} />
            <Route path="/studio-console" component={StudioConsole} />
            <Route path="/studio" component={StudioConsole} />
            <Route path="/realtime-dashboard" component={RealtimeDashboard} />
            <Route path="/dashboard/realtime" component={RealtimeDashboard} />
            <Route path="/management" component={AdminConsole} />
            
            {/* Agent Orchestration - 105+ Agents with ROMA Architecture */}
            <Route path="/agent-orchestration" component={AgentOrchestration} />
            <Route path="/admin/agents" component={AgentRegistry} />
            <Route path="/admin/models" component={ModelCatalog} />
            <Route path="/model-catalog" component={ModelCatalog} />
            <Route path="/agents" component={AgentOrchestration} />
            <Route path="/orchestration" component={AgentOrchestration} />
            
            {/* Wizards Incubator - Unified Routes */}
            {/* Dashboard redirects to unified /founder-dashboard */}
            <Route path="/wizards">
              {() => <RedirectTo to="/founder-dashboard" />}
            </Route>
            <Route path="/wizards/dashboard">
              {() => <RedirectTo to="/founder-dashboard" />}
            </Route>
            <Route path="/incubator">
              {() => <RedirectTo to="/founder-dashboard" />}
            </Route>
            
            {/* Single Startup Detail View */}
            <Route path="/startups/:id" component={StartupDetail} />
            
            {/* Journey Guide - 14-Day MVP Roadmap */}
            <Route path="/journey-guide/:startupId" component={JourneyGuidePage} />
            
            {/* Other Wizards Routes */}
            <Route path="/wizards/apply" component={ApplicationForm} />
            <Route path="/wizards/investors" component={InvestorDiscovery} />
            <Route path="/wizards/investors/:id" component={InvestorProfile} />
            <Route path="/apply" component={ApplicationForm} />
            <Route path="/investors" component={InvestorDiscovery} />
            <Route path="/investors/:id" component={InvestorProfile} />
            
            {/* P0 Orchestration Dashboards - A2A, BMAD, CAM, GRPO, Parlant */}
            <Route path="/orchestration/a2a" component={A2ACollaborationDashboard} />
            <Route path="/orchestration/bmad" component={BMADWorkflowVisualizer} />
            <Route path="/orchestration/cam" component={CAMDashboardPage} />
            <Route path="/orchestration/memory" component={MemoryBrowserCAM} />
            <Route path="/orchestration/grpo" component={GRPOTrainingDashboard} />
            <Route path="/orchestration/policies" component={PolicyManagementConsole} />
            <Route path="/orchestration/enforcement" component={EnforcementMonitoring} />
            <Route path="/enforcement" component={EnforcementMonitoring} />
            
            {/* P1 AI Quality Enhancement Testing */}
            <Route path="/test/p1-quality" component={P1AIQualityTest} />
            <Route path="/p1-test" component={P1AIQualityTest} />
            </>
            )}
            
            {/* Fallback Route */}
            <Route component={NotFound} />
          </Switch>
          <HelpButton />
        </Router>
        </div>
        <Toaster />
        <AssistantDrawer />
      </ErrorBoundaryWithRetry>
      </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}