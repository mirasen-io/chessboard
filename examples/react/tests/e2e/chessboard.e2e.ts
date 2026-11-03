import { expect } from '@playwright/test';
import { clickMove, dragMove, INITIAL_FEN, squareCenter, test } from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
});

test('renders the board and its existing e2 annotation', async ({ page }) => {
	await expect(page.locator('[data-chessboard-id^="annotation-circle-committed-"]')).toHaveCount(1);
	await expect(page.locator('.status code')).toHaveText(INITIAL_FEN);
});

test('commits legal click moves and leaves invalid destinations uncommitted', async ({ page }) => {
	await page.clock.install();
	await clickMove(page, 'e2', 'a5');
	await expect(page.locator('.status code')).toHaveText(INITIAL_FEN);

	await clickMove(page, 'e2', 'e4');
	await expect(page.locator('.status code')).toHaveText(
		'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
	);
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
});

test('commits a fast pointer drag and cleans up its lifted piece', async ({ page }) => {
	await dragMove(page, 'e2', 'e4');
	await expect(page.locator('.status code')).toContainText('4P3');
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
	await expect(page.locator('[data-chessboard-id="dragged-piece"]')).toHaveCount(0);
});

test('cancels a release outside the board and supports a flipped move', async ({ page }) => {
	const source = await squareCenter(page, 'e2');
	const board = await page.locator('[data-chessboard-id="svg-root"]').boundingBox();
	if (!board) throw new Error('Chessboard is not visible');
	await page.mouse.move(source.x, source.y);
	await page.mouse.down();
	await page.mouse.move(board.x - 20, board.y + board.height / 2);
	await page.mouse.up();
	await expect(page.locator('[data-chessboard-id="dragged-piece"]')).toHaveCount(0);
	await expect(page.locator('.status code')).toHaveText(INITIAL_FEN);

	await page.getByRole('button', { name: 'Flip board' }).click();
	const flippedE2 = await squareCenter(page, 'e2');
	const flippedE4 = await squareCenter(page, 'e4');
	expect(flippedE2.y).toBeLessThan(flippedE4.y);
	await clickMove(page, 'e2', 'e4');
	await expect(page.locator('.status code')).toContainText('4P3');

	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(page.locator('.status code')).toHaveText(INITIAL_FEN);
});

test('reset cancels the pending random computer reply', async ({ page }) => {
	await page.clock.install();
	await clickMove(page, 'e2', 'e4');
	await expect(page.getByText('Computer thinking…')).toBeVisible();
	await page.getByRole('button', { name: 'Reset' }).click();
	await page.clock.fastForward(1_000);
	await expect(page.locator('.status code')).toHaveText(INITIAL_FEN);
	await expect(page.getByText('Your move')).toBeVisible();
});
