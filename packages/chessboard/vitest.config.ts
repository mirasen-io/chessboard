import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const MONOREPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.spec.ts'],
		coverage: {
			reportsDirectory: './coverage-test',
			provider: 'v8',
			include: ['src/**/*.{js,ts}'],
			reporter: ['text', 'html', 'clover', 'json', ['lcov', { projectRoot: MONOREPO_ROOT }]]
		}
	}
});
