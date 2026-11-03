import { expect } from '@playwright/test';
import { squareCenter, test } from './helpers';

test('draws an arrow, clears annotations, and leaves pieces unchanged', async ({ page }) => {
	await page.goto('/0-debug');
	const arrows = page.locator('[data-chessboard-id^="annotation-arrow-committed-"]');
	const circles = page.locator('[data-chessboard-id^="annotation-circle-committed-"]');
	await expect(arrows).toHaveCount(5);
	const initialArrows = await arrows.count();
	await expect(circles).toHaveCount(10);
	const initialCircles = await circles.count();
	const marker = await squareCenter(page, 'h3');
	await page.mouse.click(marker.x, marker.y, { button: 'right' });
	await expect(circles).toHaveCount(initialCircles + 1);

	const source = await squareCenter(page, 'a3');
	const target = await squareCenter(page, 'a5');
	await page.mouse.move(source.x, source.y);
	await page.mouse.down({ button: 'right' });
	await page.mouse.move(target.x, target.y, { steps: 3 });
	await page.mouse.up({ button: 'right' });
	await expect(arrows).toHaveCount(initialArrows + 1);
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();

	await page.getByRole('button', { name: 'Reset position' }).click();
	await expect(arrows).toHaveCount(0);
	await expect(circles).toHaveCount(0);
	await expect(page.locator('[data-chessboard-id="piece-1-12"]')).toBeAttached();
});
