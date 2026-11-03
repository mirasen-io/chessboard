import { expect } from '@playwright/test';
import { test } from './helpers';

test('free example initial board matches its visual baseline', async ({ page }) => {
	await page.goto('/1-free');
	const board = page.locator('.board');
	await expect(board.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
	await expect(board).toHaveScreenshot('svelte-free-initial-board.png');
});
