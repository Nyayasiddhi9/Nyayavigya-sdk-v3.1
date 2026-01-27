import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LlmProvider } from "@shared/schema";

export default function ProviderStatus() {
  const { data: providers, isLoading } = useQuery<LlmProvider[]>({
    queryKey: ["/api/providers"],
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">LLM Providers</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No providers configured</p>
        </div>
      </div>
    );
  }

  const totalModels = providers.reduce((sum, p) => sum + (Array.isArray(p.models) ? p.models.length : 0), 0);
  const topProviders = providers.slice(0, 3);
  const otherProviders = providers.slice(3);

  return (
    <div className="bg-card rounded-lg p-6" data-testid="provider-status">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">LLM Providers</h3>
        <span className="text-sm text-muted-foreground" data-testid="provider-summary">
          {providers.length} Providers • {totalModels} Models
        </span>
      </div>
      
      <div className="space-y-4">
        {topProviders.map((provider) => (
          <div 
            key={provider.id} 
            className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
            data-testid={`provider-${provider.name.toLowerCase()}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-md flex items-center justify-center">
                <span className="status-indicator status-healthy"></span>
              </div>
              <div>
                <p className="font-medium text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(provider.models) 
                    ? provider.models.slice(0, 2).map(m => m.name).join(", ")
                    : "Models available"
                  }
                  {Array.isArray(provider.models) && provider.models.length > 2 && 
                    `, +${provider.models.length - 2} more`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground" data-testid={`latency-${provider.name.toLowerCase()}`}>
                {provider.latencyMs}ms
              </span>
              <p className="text-xs text-green-400">Latency</p>
            </div>
          </div>
        ))}

        {/* Other Providers Summary */}
        {otherProviders.length > 0 && (
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-md p-3 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <Server className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{otherProviders.length} More Providers</p>
                  <p className="text-xs text-muted-foreground">
                    {otherProviders.slice(0, 3).map(p => p.name).join(", ")}
                    {otherProviders.length > 3 && "..."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">
                  {otherProviders.reduce((sum, p) => sum + (Array.isArray(p.models) ? p.models.length : 0), 0)}
                </span>
                <p className="text-xs text-primary">Models</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
