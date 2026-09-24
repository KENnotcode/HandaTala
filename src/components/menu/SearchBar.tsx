import { Search, X } from 'lucide-react';
import { motion, useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search food...', className }: SearchBarProps) {
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    setShowClear(value.length > 0);
  }, [value]);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          leftIcon={<Search className="w-5 h-5" />}
          rightIcon={showClear && (
            <motion.button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              whileTap={{ scale: 0.8 }}
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        />
      </motion.div>
    </div>
  );
}