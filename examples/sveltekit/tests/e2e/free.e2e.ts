import { expect } from '@playwright/test';
import { dragMove, squareCenter, test } from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/1-free');
	await expect(page.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
});

test('supports click moves, selection, reset, and flipped orientation', async ({ page }) => {
	const selected = await squareCenter(page, 'e2');
	await page.mouse.click(selected.x, selected.y);
	await expect(page.locator('[data-chessboard-id="selected-square-highlight"]')).toBeAttached();
	const destination = await squareCenter(page, 'e4');
	await page.mouse.click(destination.x, destination.y);
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();

	await page.getByRole('button', { name: 'Orientation: white' }).click();
	await expect(page.getByRole('button', { name: 'Orientation: black' })).toBeVisible();
	const e2 = await squareCenter(page, 'e2');
	const e4 = await squareCenter(page, 'e4');
	expect(e2.y).toBeLessThan(e4.y);
	await page.getByRole('button', { name: 'Reset position' }).click();
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toHaveCount(0);
});

test('commits a pointer drag and clears the overlay after an outside cancellation', async ({
	page
}) => {
	await dragMove(page, 'e2', 'e4');
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="dragged-piece"]')).toHaveCount(0);

	const source = await squareCenter(page, 'd2');
	const board = await page.locator('[data-chessboard-id="svg-root"]').boundingBox();
	if (!board) throw new Error('Chessboard is not visible');
	await page.mouse.move(source.x, source.y);
	await page.mouse.down();
	await page.mouse.move(board.x + board.width + 20, board.y + board.height / 2);
	await page.mouse.up();
	await expect(page.locator('[data-chessboard-id="dragged-piece"]')).toHaveCount(0);
	await expect(page.locator('[data-chessboard-id="piece-1-11"]')).toBeAttached();
});

test('selecting a square exposes its selection state', async ({ page }) => {
	const selected = await squareCenter(page, 'e2');
	await page.mouse.click(selected.x, selected.y);
	await expect(page.locator('[data-chessboard-id="selected-square-highlight"]')).toHaveCount(1);
});
