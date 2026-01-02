import { useRef, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

export const useSwipe = (options: SwipeOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefault = true
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  }, [preventDefault]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  }, [preventDefault]);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Определяем направление свайпа
    if (absDeltaX > absDeltaY) {
      // Горизонтальный свайп
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Вертикальный свайп
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

