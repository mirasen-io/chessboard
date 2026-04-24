import { describe, expect, it } from 'vitest';
import { ColorCode } from '../../../src/state/board/types/internal.js';
import { viewSetOrientation } from '../../../src/state/view/reducers.js';
import type { ViewStateInternal } from '../../../src/state/view/types/internal.js';

describe('viewSetOrientation', () => {
	it('changes orientation and returns true', () => {
		const state: ViewStateInternal = { orientation: ColorCode.White };
		const result = viewSetOrientation(state, ColorCode.Black);
		expect(result).toBe(true);
		expect(state.orientation).toBe(ColorCode.Black);
	});

	it('returns false when orientation is already the same', () => {
		const state: ViewStateInternal = { orientation: ColorCode.White };
		const result = viewSetOrientation(state, ColorCode.White);
		expect(result).toBe(false);
		expect(state.orientation).toBe(ColorCode.White);
	});
});
