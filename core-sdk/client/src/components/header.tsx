import { Bell, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <Brain className="text-white w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">WAI Orchestration</h1>
                <p className="text-xs text-muted-foreground">v9.0 Production</p>
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-1 ml-8">
              <a 
                href="#dashboard" 
                className="px-4 py-2 rounded-md bg-primary/10 text-primary font-medium text-sm"
                data-testid="nav-dashboard"
              >
                Dashboard
              </a>
              <a 
                href="#agents" 
                className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors"
                data-testid="nav-agents"
              >
                Agents
              </a>
              <a 
                href="#providers" 
                className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors"
                data-testid="nav-providers"
              >
                Providers
              </a>
              <a 
                href="#pipelines" 
                className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors"
                data-testid="nav-pipelines"
              >
                Pipelines
              </a>
              <a 
                href="#analytics" 
                className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors"
                data-testid="nav-analytics"
              >
                Analytics
              </a>
              <a 
                href="#india" 
                className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center"
                data-testid="nav-india"
              >
                <span className="w-4 h-2 india-flag-colors rounded-sm mr-2"></span>
                India
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="status-indicator status-healthy"></span>
              <span className="text-muted-foreground">All Systems Operational</span>
            </div>
            
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </Button>
            
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
