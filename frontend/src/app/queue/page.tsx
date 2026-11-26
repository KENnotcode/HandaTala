'use client';

import { useEffect } from 'react';
import { QueueBoard } from '@/components/queue';

export default function QueuePage() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 h-dvh overflow-hidden bg-gray-50 dark:bg-gray-900">
      <QueueBoard />
    </div>
  );
}