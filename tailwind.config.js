/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
                heading: ['var(--font-avantgarde)', 'system-ui', 'sans-serif'],
                body: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // INFINOX Typography Scale
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '1' }],
                '6xl': ['3.75rem', { lineHeight: '1' }],
                // Custom heading sizes matching INFINOX
                'h1': ['3.5rem', { lineHeight: '1.1', fontWeight: '400' }],
                'h2': ['2.75rem', { lineHeight: '1.2', fontWeight: '400' }],
                'h3': ['2.25rem', { lineHeight: '1.3', fontWeight: '400' }],
                'h4': ['1.875rem', { lineHeight: '1.4', fontWeight: '400' }],
                'h5': ['1.5rem', { lineHeight: '1.5', fontWeight: '400' }],
                'h6': ['1.25rem', { lineHeight: '1.6', fontWeight: '400' }],
                'body-lg': ['1.125rem', { lineHeight: '1.75' }],
                'body-base': ['1rem', { lineHeight: '1.625' }],
                'body-sm': ['0.875rem', { lineHeight: '1.5' }],
            },
            fontWeight: {
                'light': '300',
                'normal': '400',
                'medium': '500',
                'semibold': '600',
                'bold': '700',
                'extrabold': '800',
                'black': '900',
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'none': 'none',
            },
            colors: {
                brand: {
                    50: '#C8F300', // Flat scale for now as per guidelines
                    500: '#C8F300',
                    900: '#C8F300',
                    DEFAULT: '#C8F300',
                },
                neutral: {
                    50: '#F1F6EC',
                    500: '#F1F6EC',
                    900: '#F1F6EC',
                },
                dark: {
                    base: '#081428',
                    DEFAULT: '#081428',
                }
            }
        },
    },
    plugins: [],
}
