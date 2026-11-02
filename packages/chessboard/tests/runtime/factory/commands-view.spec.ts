import { describe, expect, it } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import { ColorCode } from '../../../src/state/board/types/internal.js';

function createTestRuntime() {
	return createRuntime({ element: document.createElement('div') });
}

describe('runtime view commands', () => {
	describe('setOrientation', () => {
		it('default orientation is white after creation', () => {
			const runtime = createTestRuntime();
			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.view.orientation).toBe(ColorCode.White);
		});

		it('returns true when changing orientation to black', () => {
			const runtime = createTestRuntime();
			const result = runtime.setOrientation('black');
			expect(result).toBe(true);
		});

		it('returns false when orientation is already the same', () => {
			const runtime = createTestRuntime();
			const result = runtime.setOrientation('white');
			expect(result).toBe(false);
		});

		it('snapshot reflects new orientation after setOrientation', () => {
			const runtime = createTestRuntime();
			runtime.setOrientation('black');
			expect(runtime.getSnapshot().state.view.orientation).toBe(ColorCode.Black);
		});

		it('can toggle orientation back and forth', () => {
			const runtime = createTestRuntime();
			runtime.setOrientation('black');
			expect(runtime.getSnapshot().state.view.orientation).toBe(ColorCode.Black);

			runtime.setOrientation('white');
			expect(runtime.getSnapshot().state.view.orientation).toBe(ColorCode.White);
		});
	});
});
