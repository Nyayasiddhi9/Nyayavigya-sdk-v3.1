import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-in' | 'slide-up' | 'scale' | 'bounce';
  onClick?: () => void;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, delay = 0, animation = 'slide-up', onClick }, ref) => {
    const animations = {
      'fade-in': 'animate-fade-in',
      'slide-up': 'animate-slide-up',
      'scale': 'hover:scale-105 transition-transform duration-300',
      'bounce': 'animate-bounce-slow'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'wai-card rounded-2xl transition-all duration-300',
          animations[animation],
          onClick && 'cursor-pointer',
          className
        )}
        style={{ animationDelay: `${delay}s` }}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
