import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'media',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0B1220',
          50:  '#E8EBF0',
          100: '#D1D7E1',
          200: '#A3AFC3',
          300: '#7587A5',
          400: '#475F87',
          500: '#1E3055',
          600: '#172543',
          700: '#111C32',
          800: '#0B1220',
          900: '#060C15',
        },
        glow: {
          DEFAULT: '#FF8A3D',
          50:  '#FFF4EC',
          100: '#FFE9D9',
          200: '#FFD3B3',
          300: '#FFBC8C',
          400: '#FFA666',
          500: '#FF8A3D',
          600: '#FF6B05',
          700: '#CC5500',
          800: '#993F00',
          900: '#662A00',
        },
        offwhite: {
          DEFAULT: '#F7F5F1',
          50: '#FFFFFF',
          100: '#FDFCFA',
          200: '#F7F5F1',
          300: '#EDE9E2',
          400: '#E3DDD3',
          500: '#D9D1C4',
          600: '#C5BAA7',
          700: '#B1A38A',
          800: '#9D8C6D',
          900: '#7A6B50',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(ellipse at 50% 0%, rgba(255,138,61,0.15) 0%, transparent 70%)',
        'glow-card':   'radial-gradient(ellipse at 50% 100%, rgba(255,138,61,0.08) 0%, transparent 60%)',
        'midnight-gradient': 'linear-gradient(180deg, #0B1220 0%, #0F1A2E 100%)',
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'marquee':        'marquee 30s linear infinite',
        'marquee-rev':    'marquee-rev 30s linear infinite',
        'counter':        'counter 2s ease-out forwards',
        'fade-up':        'fade-up 0.6s ease-out forwards',
        'glow-pulse':     'glow-pulse 3s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-rev': {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      boxShadow: {
        'glow-sm':  '0 0 20px -5px rgba(255,138,61,0.4)',
        'glow-md':  '0 0 40px -10px rgba(255,138,61,0.5)',
        'glow-lg':  '0 0 80px -20px rgba(255,138,61,0.4)',
        'glow-xl':  '0 0 120px -20px rgba(255,138,61,0.5)',
        'card':     '0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 32px -8px rgba(0,0,0,0.6)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.08) inset, 0 16px 48px -8px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
