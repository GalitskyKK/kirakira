/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Включаем класс-основанную темную тему
  theme: {
    extend: {
      screens: {
        xs: '375px', // Маленькие мобильные устройства
      },
      colors: {
        // Soft pastels + iridescent accents palette
        // Main brand colors - soft, gender-neutral
        kira: {
          50: '#fdf4ff', // Softest lavender
          100: '#fae8ff', // Light lavender
          200: '#f5d0fe', // Soft lilac
          300: '#f0a9fe', // Pastel pink-lavender
          400: '#e879f9', // Vibrant pastel purple
          500: '#d946ef', // Kira brand color - iridescent purple
          600: '#c026d3', // Deep pastel purple
          700: '#a21caf', // Rich purple
          800: '#86198f', // Deep purple
          900: '#701a75', // Darkest purple
        },
        // Garden-inspired soft greens
        garden: {
          50: '#f0fdfa', // Softest mint
          100: '#ccfbf1', // Light mint
          200: '#99f6e4', // Soft aquamarine
          300: '#5eead4', // Pastel turquoise
          400: '#2dd4bf', // Vibrant pastel teal
          500: '#14b8a6', // Main garden color
          600: '#0d9488', // Deep teal
          700: '#0f766e', // Rich teal
          800: '#115e59', // Deep teal
          900: '#134e4a', // Darkest teal
        },
        // Iridescent accent colors (shimmer effects)
        shine: {
          iridescent: '#8B5CF6', // Iridescent purple
          pearl: '#F5F5DC', // Pearl white
          aurora: '#A8E6CF', // Aurora green
          opal: '#FFD4E5', // Opal pink
          perlaqua: '#B4F8C8', // Pearl aqua
        },
        // Mood palette - refined pastels
        mood: {
          joy: '#FFD89B', // Warm pastel yellow
          calm: '#B4E8E8', // Peaceful pastel cyan
          stress: '#FFAAA5', // Soft coral red
          sadness: '#C5D4E8', // Cool pastel blue
          anger: '#FFB3BA', // Soft rose
          anxiety: '#E6D5F7', // Soft pastel purple
        },
        // Neutral palette - clean, minimal
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        grow: 'grow 0.3s ease-out',
        // Iridescent & shimmer effects
        shimmer: 'shimmer 2s linear infinite',
        sparkle: 'sparkle 3s ease-in-out infinite',
        'sparkle-slow': 'sparkle 5s ease-in-out infinite',
        'iridescent-shift': 'iridescentShift 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        grow: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
        // Shimmer effect for iridescent accents
        shimmer: {
          '0%': {
            backgroundPosition: '-200% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        // Sparkle effect (kira = glittering)
        sparkle: {
          '0%, 100%': {
            opacity: '0.4',
            transform: 'scale(0.8) rotate(0deg)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.2) rotate(180deg)',
          },
        },
        // Iridescent color shift
        iridescentShift: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        // Glow pulse for interactive elements
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(217, 70, 239, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(217, 70, 239, 0.6)',
          },
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
