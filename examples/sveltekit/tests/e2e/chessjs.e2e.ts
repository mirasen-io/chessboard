import { expect } from '@playwright/test';
import { clickMove, test } from './helpers';

test('reflects a legal move and accepts a random computer reply', async ({ page }) => {
	await page.clock.install();
	await page.goto('/6-chessjs');
	await clickMove(page, 'e2', 'e4');
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
	await expect(page.getByText('Computer thinking…')).toBeVisible();
	await page.clock.fastForward(1_100);
	await expect(page.locator('.status')).not.toContainText('Computer thinking');
});

test('reset cancels the pending reply for the previous game', async ({ page }) => {
	await page.clock.install();
	await page.goto('/6-chessjs');
	await clickMove(page, 'e2', 'e4');
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
	await page.getByRole('button', { name: 'Reset game' }).click();
	await page.clock.fastForward(1_200);
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="piece-9-52"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toHaveCount(0);
	await expect(page.getByText('Your move')).toBeVisible();
});
