import { Order, OrderStatus } from '@/types';
import { motion } from 'framer-motion';
import { Eye, MoreVertical, Filter } from 'lucide-react';
import { Button, Badge, Modal, Input } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatPrice, formatDate } from '@/utils/format';
import { OrderStatus as OrderStatusComponent } from '@/components/order';
import { useState } from 'react';

interface OrderTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  filterStatus?: OrderStatus | 'all';
  onFilterChange: (status: OrderStatus | 'all') => void;
}

export function OrderTable({ 
  orders, 
  onViewOrder, 
  onUpdateStatus,
  filterStatus,
  onFilterChange 
}: OrderTableProps) {
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<Order | null>(null);

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'Preparing', label: 'Preparing' },
    { value: 'Ready for Pickup', label: 'Ready for Pickup' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    onUpdateStatus(orderId, status);
    setShowStatusModal(null);
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterStatus || 'all'}
            onChange={(e) => onFilterChange(e.target.value as OrderStatus | 'all')}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Completed">Completed</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Order ID</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Items</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Payment</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
            <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order, index) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() => onViewOrder(order)}
            >
              <td className="p-3">
                <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
                  #{order.trackingId}
                </span>
              </td>
              <td className="p-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {order.paymentMethod.replace('-', ' ')}
                  </p>
                </div>
              </td>
              <td className="p-3 max-w-xs">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
              </td>
              <td className="p-3 font-medium text-gray-900 dark:text-white">
                {formatPrice(order.total)}
              </td>
              <td className="p-3">
                <Badge variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warning' : 'danger'} size="sm">
                  {order.paymentStatus}
                </Badge>
              </td>
              <td className="p-3">
                <OrderStatusComponent status={order.orderStatus} size="sm" />
              </td>
              <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(order.createdAt, 'short')}
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewOrder(order);
                    }}
                    className="text-gray-400 hover:text-blue-600"
                    aria-label="View order"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusModal(order);
                    }}
                    className="text-gray-400 hover:text-amber-600"
                    aria-label="Update status"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
        </div>
      )}

      <AnimatePresence>
        {viewOrder && (
          <Modal
            isOpen
            onClose={() => setViewOrder(null)}
            title={`Order #${viewOrder.trackingId}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="font-medium">{viewOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="font-medium capitalize">{viewOrder.paymentMethod.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Status</p>
                  <Badge variant={viewOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {viewOrder.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order Status</p>
                  <OrderStatusComponent status={viewOrder.orderStatus} size="md" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Placed</p>
                  <p className="font-medium">{formatDate(viewOrder.createdAt, 'full')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Updated</p>
                  <p className="font-medium">{formatDate(viewOrder.updatedAt, 'full')}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3">Items</h4>
                <ul className="space-y-2" role="list">
                  {viewOrder.items.map((item, i) => (
                    <li key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.notes && <p className="text-xs text-amber-600 italic">{item.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                        <p className="font-medium">{formatPrice(item.subtotal)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end space-x-4 text-lg font-bold">
                  <span>Total: {formatPrice(viewOrder.total)}</span>
                </div>
              </div>

              {viewOrder.notes && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> {viewOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatusModal && (
          <Modal
            isOpen
            onClose={() => setShowStatusModal(null)}
            title="Update Order Status"
            description={`Order #${showStatusModal.trackingId}`}
          >
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={showStatusModal.orderStatus === option.value ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => handleStatusChange(showStatusModal.id, option.value)}
                  className="justify-start"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence } from 'framer-motion';