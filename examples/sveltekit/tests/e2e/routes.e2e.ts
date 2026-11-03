import { expect } from '@playwright/test';
import { squareCenter, test } from './helpers';

for (const route of [
	'/0-debug',
	'/1-free',
	'/2-custom-ext-list',
	'/3-setOnUIMove',
	'/4-setMovability',
	'/5-promotion',
	'/6-chessjs'
]) {
	test(`${route} renders a usable chessboard`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
		await expect(page.locator('[data-chessboard-id^="square-"]')).toHaveCount(64);
	});
}

test('navigation away and back remounts a working free board', async ({ page }) => {
	await page.goto('/1-free');
	await expect(page.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
	await page.getByRole('link', { name: '2 · Custom extensions' }).click();
	await expect(page).toHaveURL(/\/2-custom-ext-list$/);
	await expect(page.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
	await page.getByRole('link', { name: '1 · Free' }).click();
	await expect(page).toHaveURL(/\/1-free$/);
	await expect(page.locator('[data-chessboard-id="svg-root"]')).toBeVisible();
	await expect(page.locator('[data-chessboard-id="svg-root"]')).toHaveCount(1);
	const source = await squareCenter(page, 'e2');
	const target = await squareCenter(page, 'e4');
	await page.mouse.click(source.x, source.y);
	await page.mouse.click(target.x, target.y);
	await expect(page.locator('[data-chessboard-id="piece-1-28"]')).toBeAttached();
});
