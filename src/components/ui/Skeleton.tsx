import { HTMLAttributes, forwardRef } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      lines = 1,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

    const variantStyles = {
      text: 'h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={`${className}`} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseStyles} ${variantStyles[variant]} ${i === lines - 1 ? 'w-3/4' : 'w-full'} mb-2`}
              style={{ width, height: height || undefined }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        style={{ width, height: height || (variant === 'circular' ? width : undefined) }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';