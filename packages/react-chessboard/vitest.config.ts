import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		coverage: {
			reportsDirectory: './coverage-test',
			provider: 'v8',
			include: ['src/**/*.{js,ts,tsx}'],
			reporter: ['text', 'html', 'clover', 'json', 'lcov']
		}
	}
});
