import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Cpu, MemoryStick, HardDrive, Zap, DollarSign, Clock } from 'lucide-react';

interface ResourceMetrics {
  cpu: {
    usage: number;
    cores: number;
    frequency: string;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    upload: string;
    download: string;
  };
  cost: {
    current: number;
    budget: number;
    percentage: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
  };
}

interface ResourceUsagePanelProps {
  metrics: ResourceMetrics;
  title?: string;
  showAlerts?: boolean;
}

export default function ResourceUsagePanel({ 
  metrics, 
  title = 'Resource Usage',
  showAlerts = true
}: ResourceUsagePanelProps) {
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card data-testid="card-resource-usage">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="resource-title">{title}</CardTitle>
          {showAlerts && (
            <div className="flex gap-1">
              {metrics.cpu.usage > 90 && <Badge variant="destructive" className="text-xs">High CPU</Badge>}
              {metrics.memory.percentage > 90 && <Badge variant="destructive" className="text-xs">Low Memory</Badge>}
              {metrics.cost.percentage > 80 && <Badge variant="outline" className="text-xs">Budget Alert</Badge>}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU Usage */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
            data-testid="resource-cpu-section"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">CPU Usage</span>
            </div>
            <Progress 
              value={metrics.cpu.usage} 
              className="h-2" 
              data-testid="progress-cpu-usage"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span data-testid="text-cpu-percentage" className={getUsageColor(metrics.cpu.usage)}>
                {metrics.cpu.usage}%
              </span>
              <span data-testid="text-cpu-details">
                {metrics.cpu.cores} cores @ {metrics.cpu.frequency}
              </span>
            </div>
          </motion.div>

          {/* Memory Usage */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
            data-testid="resource-memory-section"
          >
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <Progress 
              value={metrics.memory.percentage} 
              className="h-2" 
              data-testid="progress-memory-usage"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span data-testid="text-memory-percentage" className={getUsageColor(metrics.memory.percentage)}>
                {metrics.memory.percentage}%
              </span>
              <span data-testid="text-memory-details">
                {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
              </span>
            </div>
          </motion.div>

          {/* Storage Usage */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
            data-testid="resource-storage-section"
          >
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <Progress 
              value={metrics.storage.percentage} 
              className="h-2" 
              data-testid="progress-storage-usage"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span data-testid="text-storage-percentage" className={getUsageColor(metrics.storage.percentage)}>
                {metrics.storage.percentage}%
              </span>
              <span data-testid="text-storage-details">
                {formatBytes(metrics.storage.used)} / {formatBytes(metrics.storage.total)}
              </span>
            </div>
          </motion.div>

          {/* Cost Usage */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
            data-testid="resource-cost-section"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Budget</span>
            </div>
            <Progress 
              value={metrics.cost.percentage} 
              className="h-2" 
              data-testid="progress-cost-usage"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span data-testid="text-cost-percentage" className={getUsageColor(metrics.cost.percentage)}>
                {metrics.cost.percentage}%
              </span>
              <span data-testid="text-cost-details">
                ${metrics.cost.current} / ${metrics.cost.budget}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 pt-4 border-t"
          data-testid="resource-performance-section"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-500">Response Time</span>
              </div>
              <span className="text-sm font-medium" data-testid="text-response-time">
                {metrics.performance.responseTime}ms
              </span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-500">Throughput</span>
              </div>
              <span className="text-sm font-medium" data-testid="text-throughput">
                {metrics.performance.throughput}/s
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Upload</div>
              <span className="text-sm font-medium" data-testid="text-upload-speed">
                {metrics.network.upload}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Download</div>
              <span className="text-sm font-medium" data-testid="text-download-speed">
                {metrics.network.download}
              </span>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}