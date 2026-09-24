import { Order } from '@/types';
import { motion } from 'framer-motion';
import { Printer, CheckCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { OrderStatus } from './OrderStatus';
import { formatPrice, formatDate } from '@/utils/format';

interface ReceiptProps {
  order: Order;
  onPrint?: () => void;
  onClose?: () => void;
}

export function Receipt({ order, onPrint, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">HandaTala</h1>
        <p className="text-gray-500 dark:text-gray-400">Canteen Food Ordering</p>
      </div>

      <Card className="mb-6" padding="md">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
            <p className="font-mono text-xl font-bold text-gray-900 dark:text-gray-100">
              #{order.trackingId}
            </p>
          </div>
          <OrderStatus status={order.orderStatus} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(order.createdAt, 'full')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {order.paymentMethod.replace('-', ' ')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment Status</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {order.paymentStatus}
            </p>
          </div>
          {order.customerName !== 'Guest Customer' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {order.customerName}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Items</h3>
          <ul className="space-y-2" role="list">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.total !== order.subtotal && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Service Fee</span>
                <span>{formatPrice(order.total - order.subtotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {order.notes && (
        <Card className="mb-6" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Special Instructions</h3>
          <p className="text-gray-600 dark:text-gray-400 italic">{order.notes}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />} fullWidth>
          Print Receipt
        </Button>
        <Button onClick={onClose} fullWidth>
          Done
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Thank you for ordering from HandaTala!
      </p>
    </motion.div>
  );
}