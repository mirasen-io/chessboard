import { expect, test as base, type Page } from '@playwright/test';

export const test = base.extend<{ browserErrors: string[] }>({
	browserErrors: [
		async ({ page }, use) => {
			const errors: string[] = [];
			page.on('pageerror', (error) => errors.push(error.message));
			page.on('console', (message) => {
				if (message.type() === 'error') errors.push(message.text());
			});
			await use(errors);
			expect(errors).toEqual([]);
		},
		{ auto: true }
	]
});

export async function squareCenter(page: Page, square: string): Promise<{ x: number; y: number }> {
	const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
	const rank = Number(square[1]) - 1;
	const squareId = rank * 8 + file;
	const squareLocator = page.locator(`[data-chessboard-id="square-${squareId}"]`);
	await expect(squareLocator).toBeAttached();
	const box = await squareLocator.boundingBox();
	if (!box) throw new Error(`Square ${square} is not rendered`);
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export async function clickMove(page: Page, from: string, to: string): Promise<void> {
	const source = await squareCenter(page, from);
	const destination = await squareCenter(page, to);
	await page.mouse.click(source.x, source.y);
	await page.mouse.click(destination.x, destination.y);
}

export async function dragMove(page: Page, from: string, to: string): Promise<void> {
	const source = await squareCenter(page, from);
	const destination = await squareCenter(page, to);
	await page.mouse.move(source.x, source.y);
	await page.mouse.down();
	await page.mouse.move(destination.x, destination.y, { steps: 3 });
	await page.mouse.up();
}
