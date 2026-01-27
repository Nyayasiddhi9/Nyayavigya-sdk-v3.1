import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Bot, 
  Database, 
  FolderKanban,
  Home
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PlatformAdminBarProps {
  platformName: string;
}

export default function PlatformAdminBar({ platformName }: PlatformAdminBarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-platform-name">
            / {platformName}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs" data-testid="badge-quick-access">
            Quick Access
          </Badge>
          
          <Link to="/admin-console">
            <Button variant="ghost" size="sm" data-testid="button-admin-console">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          
          <Link to="/admin-console">
            <Button variant="ghost" size="sm" data-testid="button-agent-registry" onClick={() => {
              setTimeout(() => {
                const agentTab = document.querySelector('[data-testid="nav-agents"]');
                if (agentTab) (agentTab as HTMLElement).click();
              }, 100);
            }}>
              <Bot className="h-4 w-4 mr-2" />
              Agents
            </Button>
          </Link>
          
          <Link to="/admin-console">
            <Button variant="ghost" size="sm" data-testid="button-model-catalog" onClick={() => {
              setTimeout(() => {
                const modelTab = document.querySelector('[data-testid="nav-models"]');
                if (modelTab) (modelTab as HTMLElement).click();
              }, 100);
            }}>
              <Database className="h-4 w-4 mr-2" />
              Models
            </Button>
          </Link>
          
          <Link to="/admin-console">
            <Button variant="ghost" size="sm" data-testid="button-projects" onClick={() => {
              setTimeout(() => {
                const projectsTab = document.querySelector('[data-testid="nav-projects"]');
                if (projectsTab) (projectsTab as HTMLElement).click();
              }, 100);
            }}>
              <FolderKanban className="h-4 w-4 mr-2" />
              Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
