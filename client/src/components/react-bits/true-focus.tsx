import React, { useState, useRef } from 'react';

interface TrueFocusProps {
  children: React.ReactNode;
  className?: string;
  focusRadius?: number;
  intensity?: number;
  variant?: 'spotlight' | 'blur' | 'zoom' | 'highlight';
}

export function TrueFocus({ 
  children,
  className = "",
  focusRadius = 100,
  intensity = 0.8,
  variant = 'spotlight'
}: TrueFocusProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const getOverlayStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      transition: 'all 0.1s ease-out',
    };

    switch (variant) {
      case 'spotlight':
        return {
          ...baseStyle,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent ${focusRadius}px, rgba(0,0,0,${intensity}) ${focusRadius + 50}px)`
        };
      
      case 'blur':
        return {
          ...baseStyle,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent ${focusRadius}px, rgba(255,255,255,0.1) ${focusRadius + 50}px)`,
          backdropFilter: `blur(${intensity * 10}px)`,
          WebkitBackdropFilter: `blur(${intensity * 10}px)`
        };
      
      case 'zoom':
        return {
          ...baseStyle,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent ${focusRadius}px, rgba(0,0,0,${intensity * 0.5}) ${focusRadius + 100}px)`,
          transform: `scale(${1 + intensity * 0.05})`,
          transformOrigin: `${mousePosition.x}px ${mousePosition.y}px`
        };
      
      case 'highlight':
        return {
          ...baseStyle,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, ${intensity * 0.3}) 0px, rgba(59, 130, 246, ${intensity * 0.1}) ${focusRadius}px, transparent ${focusRadius + 50}px)`
        };
      
      default:
        return baseStyle;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`true-focus-container ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="true-focus-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      
      <div
        className="true-focus-overlay"
        style={getOverlayStyle()}
      />
    </div>
  );
}
