import {defineConfig} from 'vitest/config';
export default defineConfig({define:{'import.meta.env.VITE_REVIEW_MODE':'"true"'},test:{environment:'node',include:['review/emulator.spec.js'],testTimeout:20000}});
