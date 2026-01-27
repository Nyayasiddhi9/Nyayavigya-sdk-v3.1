import { useEffect, useState } from "react";

interface HyperspeedProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Hyperspeed({ className = "", size = 'md', color = 'primary' }: HyperspeedProps) {
  const [lines, setLines] = useState<Array<{ id: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const generateLines = () => {
      const newLines = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        duration: 1 + Math.random() * 2
      }));
      setLines(newLines);
    };

    generateLines();
    const interval = setInterval(generateLines, 3000);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`absolute w-full h-0.5 bg-${color}-400 opacity-0 animate-pulse`}
            style={{
              top: `${Math.random() * 100}%`,
              left: '-100%',
              animationDelay: `${line.delay}s`,
              animationDuration: `${line.duration}s`,
              transform: 'rotate(45deg)',
              background: `linear-gradient(90deg, transparent, currentColor, transparent)`
            }}
          />
        ))}
      </div>
      
      {/* Central glow */}
      <div className={`absolute inset-2 bg-${color}-500/20 rounded-full animate-pulse`} />
      <div className={`absolute inset-4 bg-${color}-400/40 rounded-full animate-ping`} />
    </div>
  );
}
