'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface AnimatedButtonProps {
  state: ButtonState;
  onClick: (e: React.MouseEvent) => void;
  idleText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function AnimatedButton({
  state,
  onClick,
  idleText = '🗑️ Delete',
  successText = '✓ Deleted',
  errorText = '✗ Failed',
  variant = 'destructive',
  size = 'sm',
  className = '',
}: AnimatedButtonProps) {
  const buttonContent = {
    idle: idleText,
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    success: successText,
    error: errorText,
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={state !== 'idle'}
      className={`relative overflow-hidden ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 25 }}
          key={state}
          className="flex items-center justify-center"
        >
          {buttonContent[state]}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
