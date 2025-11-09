/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Green Primary Theme (New - for authenticated pages)
        green: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5fe9ce',
          400: '#2dd4b4',
          500: '#72e3ad', // Primary green from prototype
          600: '#14b8a6',
          700: '#0f9384',
          800: '#115e59',
          900: '#134e4a',
        },
        // Orange/Red Theme (Keep for landing pages)
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Orange-500
          600: '#ea580c', // Orange-600
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Map primary to orange for backward compatibility (landing pages)
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Orange-500
          600: '#ea580c', // Orange-600
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Red-500
          600: '#dc2626', // Red-600
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Amber-500
          600: '#d97706', // Amber-600
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Green gradients (New - for authenticated pages)
        'gradient-green': 'linear-gradient(135deg, #72e3ad 0%, #14b8a6 100%)',
        'gradient-green-soft': 'linear-gradient(135deg, #ccfbef 0%, #72e3ad 100%)',
        // Orange gradients (Keep for landing pages)
        'gradient-primary': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #fbbf24 100%)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(12,100%,60%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(45,100%,70%,1) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(249, 115, 22, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.8)' },
        },
        pulseOrange: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'], // Outfit primary, Inter fallback
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'], // Keep Inter available for landing pages
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '4xl': '2rem',
      },
      spacing: {
        18: '4.5rem',   // 72px
        88: '22rem',    // 352px
        128: '32rem',   // 512px
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        xs: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        sm: '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Green-themed shadows
        'green-sm': '0 2px 8px 0 rgba(114, 227, 173, 0.15)',
        'green-md': '0 4px 12px 0 rgba(114, 227, 173, 0.2)',
        'green-lg': '0 8px 24px 0 rgba(114, 227, 173, 0.25)',
      },
      fontSize: {
        // Display sizes
        'display-lg': ['64px', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        // Heading sizes
        'heading-1': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-2': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-4': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        // Body sizes
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        // Label sizes
        'label-lg': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'label-sm': ['10px', { lineHeight: '1.4', fontWeight: '500' }],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
