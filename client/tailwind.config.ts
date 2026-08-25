import type { Config } from 'tailwindcss';

// Color palette per docs/architecture.md design system section.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        module: {
          customers: '#8b5cf6',
          sales: '#2563eb',
          inventory: '#059669',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
