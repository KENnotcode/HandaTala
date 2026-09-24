'use client';

import { motion } from 'framer-motion';
import { ChefHat, Truck, CheckCircle, RefreshCw, Bell, Volume2, VolumeX } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { QueueColumn } from './QueueColumn';
import { useQueueStore } from '@/store/queueStore';
import { OrderStatus } from '@/types';
import { cn } from '@/utils/cn';
import { useEffect } from 'react';

export function QueueBoard() {
  const { 
    preparingOrders, 
    readyOrders, 
    completedOrders, 
    fetchQueue, 
    moveToReady, 
    moveToCompleted,
    isLoading 
  } = useQueueStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchQueue();
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchQueue, autoRefresh]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        fetchQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchQueue]);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    if (status === 'Ready for Pickup') {
      moveToReady(orderId);
      if (soundEnabled) playNotificationSound();
    } else if (status === 'Completed') {
      moveToCompleted(orderId);
      if (soundEnabled) playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hV0pQ==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              leftIcon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            >
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';