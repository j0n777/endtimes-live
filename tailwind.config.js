/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./main.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"Share Tech Mono"', 'monospace'],
                sans: ['"Inter"', 'sans-serif'],
            },
            colors: {
                tactical: {
                    900: '#1a1614', // Desert night - almost black with brown tint
                    800: '#2d2520', // Dark desert
                    700: '#3d342d', // Medium desert brown
                    500: '#c19a6b', // Desert tan - PRIMARY (replaces green)
                    alert: '#dc2626', // Red (keep)
                    warn: '#ea580c', // Amber (keep)
                }
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'radar-scan': 'spin 4s linear infinite',
            }
        },
    },
    plugins: [],
}
