import React, { useState, useEffect } from 'react';

interface CrosshairProps {
  className?: string;
  size?: number;
  color?: string;
  thickness?: number;
  variant?: 'precision' | 'laser' | 'target' | 'scan';
}

export function Crosshair({ 
  className = "",
  size = 40,
  color = '#ff0000',
  thickness = 2,
  variant = 'precision'
}: CrosshairProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  const crosshairStyle: React.CSSProperties = {
    position: 'fixed',
    left: mousePosition.x - size / 2,
    top: mousePosition.y - size / 2,
    width: size,
    height: size,
    pointerEvents: 'none',
    zIndex: 9999,
    mixBlendMode: variant === 'laser' ? 'difference' : 'normal',
    transition: 'all 0.1s ease-out',
  };

  const horizontalLineStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: thickness,
    background: color,
    transform: 'translateY(-50%)',
  };

  const verticalLineStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: thickness,
    background: color,
    transform: 'translateX(-50%)',
  };

  const renderTargetCircles = () => {
    if (variant !== 'target') return null;
    
    return (
      <>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.8,
          height: size * 0.8,
          border: `${thickness}px solid ${color}`,
          borderRadius: '50%',
          opacity: 0.6
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.4,
          height: size * 0.4,
          border: `${thickness}px solid ${color}`,
          borderRadius: '50%',
          opacity: 0.4
        }} />
      </>
    );
  };

  const renderScanEffect = () => {
    if (variant !== 'scan') return null;
    
    return (
      <div style={{
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        border: `1px solid ${color}`,
        borderRadius: '50%',
        animation: 'crosshair-scan 2s linear infinite',
        opacity: 0.7
      }} />
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes crosshair-scan {
            0%, 100% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>
      <div
        className={`crosshair ${className}`}
        style={crosshairStyle}
      >
        {/* Horizontal line */}
        <div style={horizontalLineStyle} />
        
        {/* Vertical line */}
        <div style={verticalLineStyle} />
        
        {/* Variant-specific elements */}
        {renderTargetCircles()}
        {renderScanEffect()}
      </div>
    </>
  );
}
