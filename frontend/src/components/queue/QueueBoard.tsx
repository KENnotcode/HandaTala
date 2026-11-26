'use client';

import { ChefHat, Truck, CheckCircle, RefreshCw, Volume2, VolumeX, Clock, Inbox, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { QueueColumn } from './QueueColumn';
import { useQueueStore } from '@/store/queueStore';
import { OrderStatus } from '@/types';
import { cn } from '@/utils/cn';
import { playNotificationSound, unlockAudio } from '@/utils/audio';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';

export function QueueBoard() {
  const { 
    receivedOrders,
    preparingOrders, 
    readyOrders, 
    completedOrders, 
    cancelledOrders,
    fetchQueue, 
    moveToPreparing,
    moveToReady, 
    moveToCompleted,
    cancelOrder,
    isLoading 
  } = useQueueStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isInitialLoad = useRef(true);
  const knownReceivedIds = useRef<Set<string>>(new Set());

  // Unlock AudioContext on first user interaction anywhere on the document
  useEffect(() => {
    const handleUnlock = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleUnlock, { once: true });
    window.addEventListener('keydown', handleUnlock, { once: true });
    window.addEventListener('touchstart', handleUnlock, { once: true });
    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
  }, []);

  // Poll kitchen orders periodically (every 5 seconds when autoRefresh is active)
  useEffect(() => {
    fetchQueue();
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchQueue, autoRefresh]);

  // Real-time listener for order creation across tabs / windows
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('handatala_orders_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'ORDER_CREATED') {
            fetchQueue();
          }
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'handatala_latest_order') {
        fetchQueue();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchQueue]);

  // Re-fetch when user switches back to this tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        fetchQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchQueue]);

  // Play notification chime and show toast when a new order is received
  useEffect(() => {
    if (isLoading && isInitialLoad.current) {
      return;
    }

    if (isInitialLoad.current) {
      knownReceivedIds.current = new Set(receivedOrders.map((o) => o.id));
      isInitialLoad.current = false;
      return;
    }

    const newlyReceived = receivedOrders.filter((order) => !knownReceivedIds.current.has(order.id));

    if (newlyReceived.length > 0) {
      if (soundEnabled) {
        unlockAudio();
        playNotificationSound();
      }
      newlyReceived.forEach((order) => {
        toast.info(`New Order #${order.trackingId}`, {
          description: `${order.customerName} • ${order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`,
          duration: 5000,
        });
      });
    }

    knownReceivedIds.current = new Set(receivedOrders.map((o) => o.id));
  }, [receivedOrders, isLoading, soundEnabled]);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    if (status === 'Preparing') {
      moveToPreparing(orderId);
      if (soundEnabled) playNotificationSound();
    } else if (status === 'Ready for Pickup') {
      moveToReady(orderId);
      if (soundEnabled) playNotificationSound();
    } else if (status === 'Completed') {
      moveToCompleted(orderId);
      if (soundEnabled) playNotificationSound();
    } else if (status === 'Cancelled') {
      cancelOrder(orderId);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <header className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl 2xl:max-w-full mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <ChefHat className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kitchen Queue</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Monitor & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueue}
              disabled={isLoading}
              leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
            >
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              {autoRefresh ? 'Auto-refresh' : 'Manual'}
            </Button>
            <Button
              variant={soundEnabled ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) {
                  unlockAudio();
                  playNotificationSound();
                  toast.success('Sound enabled', { description: 'Test chime played' });
                } else {
                  toast.info('Sound muted');
                }
              }}
              leftIcon={soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            >
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-6">
        <div className="mx-auto h-full min-h-0 max-w-7xl 2xl:max-w-full">
          <div className="flex h-full min-h-0 gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain 2xl:grid 2xl:grid-cols-5">
            <QueueColumn
              title="Received"
              status="Received"
              orders={receivedOrders}
              onStatusChange={handleStatusChange}
              icon={<Inbox className="w-6 h-6" />}
              color="purple"
              emptyMessage="No received orders"
            />
            <QueueColumn
              title="Preparing"
              status="Preparing"
              orders={preparingOrders}
              onStatusChange={handleStatusChange}
              icon={<ChefHat className="w-6 h-6" />}
              color="blue"
              emptyMessage="No orders being prepared"
            />
            <QueueColumn
              title="Ready for Pickup"
              status="Ready for Pickup"
              orders={readyOrders}
              onStatusChange={handleStatusChange}
              icon={<Truck className="w-6 h-6" />}
              color="amber"
              emptyMessage="No orders ready"
            />
            <QueueColumn
              title="Completed"
              status="Completed"
              orders={completedOrders}
              onStatusChange={handleStatusChange}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
              emptyMessage="No completed orders"
            />
            <QueueColumn
              title="Cancelled"
              status="Cancelled"
              orders={cancelledOrders}
              onStatusChange={handleStatusChange}
              icon={<XCircle className="w-6 h-6" />}
              color="red"
              emptyMessage="No cancelled orders"
            />
          </div>
        </div>
      </main>
    </div>
  );
}