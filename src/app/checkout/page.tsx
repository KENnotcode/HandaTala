'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Wallet, CheckCircle, ChevronRight } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';
import { CartButton } from '@/components/cart';
import { useCartStore } from '@/store/cartStore';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { items, clearCart, getItemCount, getSubtotal, getTotal } = useCartStore();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const total = getTotal();

  const [step, setStep] = useState<'payment' | 'confirm' | 'success'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'counter'>('online');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [order, setOrder] = useState<{ trackingId: string } | null>(null);

  const paymentMethods = [
    {
      id: 'online',
      label: 'Pay Online',
      description: 'Pay with card, e-wallet, or bank transfer',
      icon: CreditCard,
      color: 'blue',
    },
    {
      id: 'counter',
      label: 'Pay at Counter',
      description: 'Pay cash or card when you pick up',
      icon: Wallet,
      color: 'amber',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await orderService.createOrder(
        items,
        paymentMethod,
        customerName,
        notes
      );
      
      if (result.success && result.data) {
        const newOrder = result.data;
        setOrder({ trackingId: newOrder.trackingId });
        
        if (paymentMethod === 'online') {
          const paymentResult = await paymentService.initializeCheckout(newOrder);
          if (paymentResult.success && paymentResult.data) {
            // Simulate payment processing
            setTimeout(async () => {
              await paymentService.simulatePaymentCallback(paymentResult.data!.payment.id, true);
              setStep('success');
              clearCart();
              setIsProcessing(false);
              toast.success('Order placed successfully!');
            }, 1500);
          }
        } else {
          setStep('success');
          clearCart();
          setIsProcessing(false);
          toast.success('Order placed! Pay at counter when you pick up.');
        }
      }
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      setIsProcessing(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <CartButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Cart is empty
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add some items to your cart before checking out.
          </p>
          <Link href="/menu">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (step === 'success' && order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CartButton />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Order Placed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your order has been confirmed. Track your order using the tracking number below.
            </p>
            
            <Card className="mb-8 p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tracking Number</p>
                <p className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                  #{order.trackingId}
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge variant="success" size="md">
                  {paymentMethod === 'online' ? 'Paid' : 'Pay at Counter'}
                </Badge>
              </div>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/order/${order.trackingId}`}>
                <Button size="lg" leftIcon={<ChevronRight className="w-4 h-4" />}>
                  Track Order
                </Button>
              </Link>
              <Link href="/menu">
                <Button variant="outline" size="lg">
                  Continue Ordering
                </Button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CartButton />
      
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/cart" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Cart</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {itemCount} items
              </span>
              <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payment Method</h2>
                  <div className="grid gap-3">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
                          paymentMethod === method.id
                            ? `border-${method.color}-500 bg-${method.color}-50 dark:border-${method.color}-500 dark:bg-${method.color}-900/20`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn('p-3 rounded-xl', `bg-${method.color}-100 dark:bg-${method.color}-900/30 text-${method.color}-600 dark:text-${method.color}-400`)}>
                            <method.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{method.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{method.description}</p>
                          </div>
                          {paymentMethod === method.id && (
                            <CheckCircle className={cn('w-5 h-5', `text-${method.color}-600`)} />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Customer Details</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <Input
                        label="Your Name"
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        autoFocus
                      />
                      <Input
                        label="Order Notes (Optional)"
                        placeholder="Any special instructions for the kitchen?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </form>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="sticky top-24 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                
                <ul className="space-y-3 mb-4 max-h-60 overflow-y-auto" role="list">
                  {items.map((item) => (
                    <li key={item.menuItemId} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {formatPrice(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">₱0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  fullWidth
                  size="lg"
                  className="mt-6"
                  isLoading={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
                </Button>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  By placing your order, you agree to our Terms of Service.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}