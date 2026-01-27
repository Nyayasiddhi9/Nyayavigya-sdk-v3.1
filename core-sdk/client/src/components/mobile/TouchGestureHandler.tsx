// Phase 1 Mobile Excellence - Touch Gesture Handler
// Principal Engineer & Release Captain Implementation

import React, { useRef, useEffect, ReactNode } from 'react';

interface TouchGestureHandlerProps {
  children: ReactNode;
  enabled?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: (event: TouchEvent) => void;
  onPinch?: (scale: number) => void;
  className?: string;
  swipeThreshold?: number;
  longPressThreshold?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
  children,
  enabled = true,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onPinch,
  className,
  swipeThreshold = 50,
  longPressThreshold = 500
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number>(0);
  const lastPinchScaleRef = useRef<number>(1);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      };

      // Handle pinch gesture (two fingers)
      if (event.touches.length === 2 && onPinch) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        initialPinchDistanceRef.current = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }

      // Start long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress(event);
          // Provide haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, longPressThreshold);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Clear long press timer on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Handle pinch gesture
      if (event.touches.length === 2 && onPinch) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (initialPinchDistanceRef.current > 0) {
          const scale = currentDistance / initialPinchDistanceRef.current;
          
          // Only fire pinch event if scale changed significantly
          if (Math.abs(scale - lastPinchScaleRef.current) > 0.1) {
            onPinch(scale);
            lastPinchScaleRef.current = scale;
          }
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!touchStartRef.current || event.touches.length > 0) {
        // Reset pinch state when lifting fingers
        if (event.touches.length === 0) {
          initialPinchDistanceRef.current = 0;
          lastPinchScaleRef.current = 1;
        }
        return;
      }

      const touch = event.changedTouches[0];
      const touchEnd = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const deltaTime = touchEnd.timestamp - touchStartRef.current.timestamp;

      // Calculate swipe distance and velocity
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Determine swipe direction if distance and velocity are sufficient
      if (distance > swipeThreshold && velocity > 0.1) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(25);
            }
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(25);
            }
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(25);
            }
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(25);
            }
          }
        }
      }

      // Reset touch state
      touchStartRef.current = null;
      initialPinchDistanceRef.current = 0;
      lastPinchScaleRef.current = 1;
    };

    // Add event listeners with passive option for better performance
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [
    enabled,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onPinch,
    swipeThreshold,
    longPressThreshold
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        touchAction: enabled ? 'pan-y' : 'auto', // Allow vertical scrolling but handle horizontal gestures
        WebkitTouchCallout: 'none', // Disable callout on iOS
        WebkitUserSelect: 'none',   // Disable text selection
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
};