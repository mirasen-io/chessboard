import { expect } from '@playwright/test';
import { clickMove, test } from './helpers';

test('shows the configured promotion chooser and commits the selected piece', async ({ page }) => {
	await page.goto('/5-promotion');
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();
	await clickMove(page, 'e2', 'e8');
	await expect(page.locator('[data-chessboard-id^="promotion-piece-"]')).toHaveCount(2);
	await expect(page.locator('.board')).toHaveScreenshot('svelte-promotion-chooser.png');
	const promotionSquare = await page
		.locator('[data-chessboard-id="promotion-piece-3"]')
		.boundingBox();
	if (!promotionSquare) throw new Error('Promotion piece is not visible');
	await page.mouse.click(
		promotionSquare.x + promotionSquare.width / 2,
		promotionSquare.y + promotionSquare.height / 2
	);
	await expect(page.locator('[data-chessboard-id="piece-3-60"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toHaveCount(0);
	await expect(page.locator('[data-chessboard-id^="promotion-piece-"]')).toHaveCount(0);

	await page.getByRole('button', { name: 'Reset position' }).click();
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();
});

test('auto promotes a configured pawn to a queen', async ({ page }) => {
	await page.goto('/5-promotion');
	await page.getByRole('button', { name: 'Toggle auto promotion: Off' }).click();
	await expect(page.getByRole('button', { name: 'Toggle auto promotion: On' })).toBeVisible();
	await clickMove(page, 'f7', 'f8');
	await expect(page.locator('[data-chessboard-id="piece-5-61"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id^="promotion-piece-"]')).toHaveCount(0);
});
