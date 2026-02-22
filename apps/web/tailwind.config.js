/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Tertiary: Dark Gray (#141414 base for background)
                gray: {
                    950: '#141414',
                    900: '#1c1c1c',
                    850: '#222222',
                    800: '#2a2a2a',
                    750: '#333333',
                    700: '#404040',
                    600: '#525252',
                    500: '#737373',
                    400: '#a3a3a3',
                    300: '#d4d4d4',
                    200: '#e5e5e5',
                    100: '#f5f5f5',
                    50: '#fafafa',
                },
                // Primary: Yellow/Variable driven mapping to 'accent'
                accent: {
                    50: 'rgb(var(--color-accent-50) / <alpha-value>)',
                    100: 'rgb(var(--color-accent-100) / <alpha-value>)',
                    200: 'rgb(var(--color-accent-200) / <alpha-value>)',
                    300: 'rgb(var(--color-accent-300) / <alpha-value>)',
                    400: 'rgb(var(--color-accent-400) / <alpha-value>)',
                    500: 'rgb(var(--color-accent-500) / <alpha-value>)',
                    600: 'rgb(var(--color-accent-600) / <alpha-value>)',
                    700: 'rgb(var(--color-accent-700) / <alpha-value>)',
                    800: 'rgb(var(--color-accent-800) / <alpha-value>)',
                    900: 'rgb(var(--color-accent-900) / <alpha-value>)',
                    950: 'rgb(var(--color-accent-950) / <alpha-value>)',
                },
                // Secondary: Blue (#1A5EDB)
                secondary: {
                    50: '#f0f5fe',
                    100: '#e4edfd',
                    200: '#c3daf9',
                    300: '#92bef4',
                    400: '#5a9bed',
                    500: '#347ce6',
                    600: '#1A5EDB', // Base Secondary
                    700: '#1d4bb8',
                    800: '#1d4196',
                    900: '#1c3977',
                    950: '#162548',
                },
                // Status colors
                success: { DEFAULT: '#22c55e', light: '#dcfce7', dark: '#15803d' },
                warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#b45309' },
                danger: { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
                info: { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8' },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                xl: '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                glass: '0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
                glow: '0 0 24px rgba(99,102,241,0.25)',
                card: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in-up': 'slideInUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
            },
            keyframes: {
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                slideInUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')({ strategy: 'class' }),
        require('@tailwindcss/typography'),
    ],
};
