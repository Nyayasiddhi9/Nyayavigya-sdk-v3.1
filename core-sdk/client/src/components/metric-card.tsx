import { Timer, CheckCircle, DollarSign, Network } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  target?: string;
  icon: "stopwatch" | "check-circle" | "dollar-sign" | "network-wired";
  status: "healthy" | "warning" | "error";
  change?: {
    value: string;
    direction: "up" | "down";
  };
  progress?: number;
}

const iconMap = {
  "stopwatch": Timer,
  "check-circle": CheckCircle,
  "dollar-sign": DollarSign,
  "network-wired": Network,
};

const statusColors = {
  healthy: "bg-green-500/10 text-green-400",
  warning: "bg-amber-500/10 text-amber-400", 
  error: "bg-red-500/10 text-red-400",
};

const progressColors = {
  healthy: "bg-primary",
  warning: "bg-amber-400",
  error: "bg-red-400",
};

export default function MetricCard({
  title,
  value,
  unit,
  target,
  icon,
  status,
  change,
  progress = 0,
}: MetricCardProps) {
  const Icon = iconMap[icon];
  
  return (
    <div className="bg-card metric-card rounded-lg p-6" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${statusColors[status]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
        <span className="status-indicator status-healthy"></span>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-foreground" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}{unit === "count" ? "" : unit}
        </p>
        <div className="flex items-center space-x-2">
          {change && (
            <span className={`text-xs ${change.direction === "up" ? "text-green-400" : "text-green-400"}`}>
              {change.direction === "up" ? "↑" : "↓"} {change.value}
            </span>
          )}
          {target && (
            <span className="text-xs text-muted-foreground">{target}</span>
          )}
        </div>
        {progress > 0 && (
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${progressColors[status]}`} 
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
