import { Fragment, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'right' | 'left' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
}: DrawerProps) {
  const sizeStyles = {
    sm: position === 'bottom' ? 'h-64' : 'w-64',
    md: position === 'bottom' ? 'h-96' : 'w-96',
    lg: position === 'bottom' ? 'h-[80vh]' : 'w-[32rem]',
    full: position === 'bottom' ? 'h-[90vh]' : 'w-full max-w-md',
  };

  const positionStyles = {
    right: 'right-0',
    left: 'left-0',
    bottom: 'bottom-0',
  };

  const animateStyles = {
    right: { x: [300, 0], exit: { x: 300 } },
    left: { x: [-300, 0], exit: { x: -300 } },
    bottom: { y: [300, 0], exit: { y: 300 } },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Fragment>
        <motion.div
          className="fixed inset-0 bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <motion.div
          className={`
            fixed z-50 flex flex-col bg-white dark:bg-gray-800 shadow-xl
            ${positionStyles[position]} ${sizeStyles[size]}
            ${position === 'bottom' ? 'w-full rounded-t-2xl' : 'h-full rounded-l-2xl'}
            ${position === 'left' ? 'rounded-r-2xl' : ''}
          `}
          initial={animateStyles[position]}
          animate={{ x: 0, y: 0 }}
          exit={animateStyles[position]}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'drawer-title' : undefined}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              {title && (
                <h2 id="drawer-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </motion.div>
      </Fragment>
    </AnimatePresence>
  );
}