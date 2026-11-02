import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const MONOREPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
	test: {
		environment: 'jsdom',
		coverage: {
			reportsDirectory: './coverage-test',
			provider: 'v8',
			include: ['src/**/*.{js,ts,tsx}'],
			reporter: ['text', 'html', 'clover', 'json', ['lcov', { projectRoot: MONOREPO_ROOT }]]
		}
	}
});
