import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
	use: {
		baseURL: 'http://127.0.0.1:4173',
		browserName: 'chromium',
		viewport: { width: 1365, height: 1000 },
		deviceScaleFactor: 1,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
