import { expect } from '@playwright/test';
import { test } from './helpers';

test('initial annotated board matches its visual baseline', async ({ page }) => {
	await page.goto('/');
	const board = page.locator('[data-chessboard-id="svg-root"]');
	await expect(board).toBeVisible();
	await expect(board).toHaveScreenshot('react-initial-annotated-board.png');
});
