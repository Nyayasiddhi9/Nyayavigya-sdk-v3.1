// Phase 1 Mobile Excellence - Offline Indicator Component
// Principal Engineer & Release Captain Implementation

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineIndicatorProps {
  isOnline: boolean;
  className?: string;
  showDetails?: boolean;
}

interface NetworkInfo {
  type: string;
  downlink: number;
  effectiveType: string;
  rtt: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  className,
  showDetails = false
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'failed'>('idle');
  const [pendingActions, setPendingActions] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Get network information if available
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          type: connection.type || 'unknown',
          downlink: connection.downlink || 0,
          effectiveType: connection.effectiveType || 'unknown',
          rtt: connection.rtt || 0
        });
      }
    };

    updateNetworkInfo();

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  useEffect(() => {
    // Check for pending offline actions
    const checkPendingActions = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(['offline_actions'], 'readonly');
        const store = tx.objectStore('offline_actions');
        const request = store.count();
        request.onsuccess = () => setPendingActions(request.result);
      } catch (error) {
        console.error('Failed to check pending actions:', error);
      }
    };

    checkPendingActions();

    // Listen for sync events
    const handleSync = () => {
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('idle');
        checkPendingActions();
      }, 2000);
    };

    window.addEventListener('online', handleSync);
    
    return () => {
      window.removeEventListener('online', handleSync);
    };
  }, [isOnline]);

  // IndexedDB helper
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('iimx-offline-store', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const getConnectionQuality = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!networkInfo) return 'fair';
    
    const { effectiveType, rtt } = networkInfo;
    
    if (effectiveType === '4g' && rtt < 100) return 'excellent';
    if (effectiveType === '4g' || (effectiveType === '3g' && rtt < 200)) return 'good';
    if (effectiveType === '3g' || rtt < 500) return 'fair';
    return 'poor';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-400';
    if (syncStatus === 'syncing') return 'text-yellow-400';
    if (pendingActions > 0) return 'text-orange-400';
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    if (syncStatus === 'syncing') {
      return <Loader2 size={16} className="animate-spin" />;
    }
    
    if (!isOnline) {
      return <WifiOff size={16} />;
    }
    
    if (pendingActions > 0) {
      return <CloudOff size={16} />;
    }
    
    return <Wifi size={16} />;
  };

  const getStatusText = () => {
    if (syncStatus === 'syncing') return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (pendingActions > 0) return `${pendingActions} pending`;
    return 'Online';
  };

  const manualSync = async () => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    
    try {
      // Trigger background sync if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('background-sync');
        }
      }
      
      // Force refresh of pending actions count
      setTimeout(async () => {
        try {
          const db = await openDB();
          const tx = db.transaction(['offline_actions'], 'readonly');
          const store = tx.objectStore('offline_actions');
          const countRequest = store.count();
          countRequest.onsuccess = () => setPendingActions(countRequest.result);
          setSyncStatus('idle');
        } catch (error) {
          setSyncStatus('failed');
        }
      }, 1000);
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('failed');
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={showDetails ? () => setShowTooltip(!showTooltip) : manualSync}
        disabled={syncStatus === 'syncing'}
        className={cn(
          "p-2 hover:bg-slate-700/50 transition-colors",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
      </Button>

      {/* Tooltip/Details */}
      {showDetails && showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 z-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Connection Status</span>
              <span className={cn("text-sm", getStatusColor())}>
                {getStatusText()}
              </span>
            </div>

            {networkInfo && isOnline && (
              <>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Type:</span>
                  <span>{networkInfo.effectiveType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Speed:</span>
                  <span>{networkInfo.downlink} Mbps</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Latency:</span>
                  <span>{networkInfo.rtt}ms</span>
                </div>
              </>
            )}

            {pendingActions > 0 && (
              <div className="flex justify-between text-xs text-orange-400">
                <span>Pending Actions:</span>
                <span>{pendingActions}</span>
              </div>
            )}

            {!isOnline && (
              <div className="text-xs text-slate-400">
                Your work is saved locally and will sync when connection is restored.
              </div>
            )}

            {isOnline && pendingActions > 0 && (
              <Button
                size="sm"
                onClick={manualSync}
                disabled={syncStatus === 'syncing'}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Connection quality indicator dots */}
      {isOnline && !showDetails && (
        <div className="absolute -top-1 -right-1 flex gap-px">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-1 rounded-full",
                i < ['poor', 'fair', 'good', 'excellent'].indexOf(getConnectionQuality()) + 1
                  ? getStatusColor().replace('text-', 'bg-')
                  : 'bg-slate-600'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};