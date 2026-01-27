/**
 * React Bits - Animated Card Component
 * Beautiful glassmorphism cards with Framer Motion animations
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  hover?: boolean;
  glassmorphism?: boolean;
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  direction = 'up',
  hover = true,
  glassmorphism = true
}: AnimatedCardProps) {
  const directionVariants = {
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
    left: { x: -20, opacity: 0 },
    right: { x: 20, opacity: 0 }
  };

  const glassStyles = glassmorphism ? 
    'backdrop-blur-lg bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10' : 
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800';

  return (
    <motion.div
      initial={directionVariants[direction]}
      animate={{ 
        x: 0, 
        y: 0, 
        opacity: 1 
      }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover ? { 
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        'rounded-xl p-6 shadow-xl transition-all duration-300',
        glassStyles,
        className
      )}
    >
      {children}
    </motion.div>
  );
}
