import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface PlatformHeroProps {
  title: string;
  description: string;
  icon: ElementType;
  gradient: string;
  agentCount: number;
  status: 'active' | 'building' | 'ready';
  onSettingsClick?: () => void;
  showBackButton?: boolean;
}

export default function PlatformHero({
  title,
  description, 
  icon: Icon,
  gradient,
  agentCount,
  status,
  onSettingsClick,
  showBackButton = true
}: PlatformHeroProps) {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'building': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ready': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className={`bg-gradient-to-r ${gradient} text-white border-0`}>
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/dashboard')}
                  className="text-white hover:bg-white/20"
                  data-testid="button-back-to-dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center" data-testid="hero-icon-container">
                <Icon className="h-8 w-8 text-white" data-testid="hero-icon" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2" data-testid="hero-title">{title}</h1>
                <p className="text-white/90 text-lg max-w-2xl" data-testid="hero-description">{description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={`${getStatusColor(status)} border-0`} data-testid="hero-status-badge">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  <span className="text-white/80 text-sm" data-testid="hero-agent-count">
                    {agentCount} agents active
                  </span>
                </div>
              </div>
            </div>
            
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                className="text-white hover:bg-white/20"
                data-testid="button-platform-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}