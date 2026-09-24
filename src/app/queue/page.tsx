'use client';

import { QueueBoard } from '@/components/queue';
import { useAuthStore } from '@/store/authStore';

export default function QueuePage() {
  const { checkAuth } = useAuthStore();

  // Queue page is accessible to kitchen staff too
  // We'll just show the queue board

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <QueueBoard />
    </div>
  );
}