import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Rules tests need the Firestore emulator; run them via `npm run test:rules`.
        exclude: ['**/node_modules/**', 'tests/rules/**'],
    },
});
