/**
 * Professional Video Design System for Wizards Incubator
 * Industry-standard typography, colors, and visual hierarchy
 */

export const VideoDesignSystem = {
  // Professional Typography
  typography: {
    title: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '72px',
      fontWeight: 'bold',
      letterSpacing: '-0.02em',
      lineHeight: 1.1
    },
    heading: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '48px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      lineHeight: 1.2
    },
    subheading: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '36px',
      fontWeight: '500',
      letterSpacing: '0em',
      lineHeight: 1.3
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      fontWeight: '400',
      letterSpacing: '0.01em',
      lineHeight: 1.5
    },
    metric: {
      fontFamily: 'JetBrains Mono, "Courier New", monospace',
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '0em',
      lineHeight: 1.4
    }
  },

  // Professional Color Palette
  colors: {
    brand: {
      primary: '#7c3aed',      // Purple - main brand color
      secondary: '#a78bfa',     // Light purple
      accent: '#c084fc',        // Bright purple accent
      dark: '#5b21b6',         // Dark purple
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)'
    },
    neutral: {
      white: '#ffffff',
      nearWhite: '#f9fafb',
      lightGray: '#e5e7eb',
      gray: '#9ca3af',
      darkGray: '#374151',
      nearBlack: '#1f2937',
      black: '#000000'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    overlay: {
      dark80: 'rgba(0, 0, 0, 0.8)',
      dark60: 'rgba(0, 0, 0, 0.6)',
      dark40: 'rgba(0, 0, 0, 0.4)',
      light80: 'rgba(255, 255, 255, 0.8)',
      light40: 'rgba(255, 255, 255, 0.4)'
    }
  },

  // Animation & Transitions
  motion: {
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s'
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      linear: 'linear'
    }
  },

  // Layout & Spacing
  spacing: {
    scene: {
      padding: 80,
      titleMargin: 120,
      contentMargin: 200
    }
  },

  // Video Specifications
  video: {
    resolution: {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9'
    },
    quality: {
      bitrate: '8000k',
      fps: 30,
      codec: 'h264',
      preset: 'slow',  // Best quality
      profile: 'high'
    }
  }
};

// Scene Templates for Professional Video
export const SceneTemplates = {
  opening: {
    background: VideoDesignSystem.colors.brand.gradient,
    titleColor: VideoDesignSystem.colors.neutral.white,
    subtitleColor: VideoDesignSystem.colors.neutral.nearWhite,
    overlayOpacity: 0.9
  },
  
  content: {
    background: VideoDesignSystem.colors.neutral.nearBlack,
    titleColor: VideoDesignSystem.colors.brand.primary,
    bodyColor: VideoDesignSystem.colors.neutral.white,
    accentColor: VideoDesignSystem.colors.brand.accent,
    overlayOpacity: 0.85
  },
  
  metrics: {
    background: VideoDesignSystem.colors.neutral.black,
    numberColor: VideoDesignSystem.colors.brand.primary,
    labelColor: VideoDesignSystem.colors.neutral.lightGray,
    highlightColor: VideoDesignSystem.colors.semantic.success
  },
  
  closing: {
    background: VideoDesignSystem.colors.brand.gradient,
    ctaColor: VideoDesignSystem.colors.neutral.white,
    buttonColor: VideoDesignSystem.colors.semantic.success,
    overlayOpacity: 0.95
  }
};

export default VideoDesignSystem;
