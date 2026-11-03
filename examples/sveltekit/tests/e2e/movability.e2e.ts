import { expect } from '@playwright/test';
import { clickMove, test } from './helpers';

test('allows configured moves and rejects unconfigured destinations', async ({ page }) => {
	await page.goto('/4-setMovability');
	const initialPawn = page.locator('[data-chessboard-id="piece-1-12"]');
	await expect(initialPawn).toBeAttached();

	await clickMove(page, 'e2', 'e4');
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toHaveCount(0);

	await page.getByRole('button', { name: 'Reset position' }).click();
	const source = await page.locator('[data-chessboard-id="square-12"]').boundingBox();
	const disallowed = await page.locator('[data-chessboard-id="square-36"]').boundingBox();
	if (!source || !disallowed) throw new Error('Expected squares are not rendered');
	await page.mouse.click(source.x + source.width / 2, source.y + source.height / 2);
	await expect(page.locator('[data-chessboard-id="selected-square-highlight"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="legal-move-from-28-to-28"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="legal-move-from-36-to-36"]')).toHaveCount(0);
	await page.mouse.click(disallowed.x + disallowed.width / 2, disallowed.y + disallowed.height / 2);
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="piece-1-36"]')).toHaveCount(0);
});
