import { useEffect, useState } from "react";

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}

export function AnimatedList<T>({ 
  items, 
  renderItem, 
  className = "", 
  delay = 0,
  stagger = 0.1 
}: AnimatedListProps<T>) {
  const [visibleItems, setVisibleItems] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleItems(prev => {
          if (prev < items.length) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, stagger * 1000);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [items.length, delay, stagger]);

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`transition-all duration-500 ${
            index < visibleItems
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
