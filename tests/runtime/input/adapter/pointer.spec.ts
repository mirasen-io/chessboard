import { describe, expect, it, vi } from 'vitest';
import {
	adapterOnLostPointerCapture,
	adapterOnPointerCancel,
	adapterOnPointerDown,
	adapterOnPointerUp,
	pointerEventDestroy,
	releaseCapture
} from '../../../../src/runtime/input/adapter/pointer.js';
import type { InputAdapterInternal } from '../../../../src/runtime/input/adapter/types.js';

function createMockState(): InputAdapterInternal {
	const container = document.createElement('div');
	container.setPointerCapture = vi.fn();
	container.releasePointerCapture = vi.fn();
	container.hasPointerCapture = vi.fn(() => true);
	return {
		container,
		getRenderGeometry: () => null,
		controller: { onEvent: vi.fn() },
		activePointerId: null
	};
}

function makePointerEvent(type: string, opts?: { pointerId?: number; isPrimary?: boolean }) {
	return new PointerEvent(type, {
		pointerId: opts?.pointerId ?? 1,
		isPrimary: opts?.isPrimary ?? true
	});
}

describe('adapter pointer capture', () => {
	describe('adapterOnPointerDown', () => {
		it('sets activePointerId and calls setPointerCapture for primary pointer', () => {
			const state = createMockState();
			const e = makePointerEvent('pointerdown', { pointerId: 5, isPrimary: true });

			adapterOnPointerDown(state, e);

			expect(state.activePointerId).toBe(5);
			expect(state.container.setPointerCapture).toHaveBeenCalledWith(5);
		});

		it('ignores non-primary pointers', () => {
			const state = createMockState();
			const e = makePointerEvent('pointerdown', { pointerId: 2, isPrimary: false });

			adapterOnPointerDown(state, e);

			expect(state.activePointerId).toBeNull();
			expect(state.container.setPointerCapture).not.toHaveBeenCalled();
		});

		it('ignores if already tracking a pointer', () => {
			const state = createMockState();
			state.activePointerId = 1;
			const e = makePointerEvent('pointerdown', { pointerId: 3, isPrimary: true });

			adapterOnPointerDown(state, e);

			expect(state.activePointerId).toBe(1); // unchanged
			expect(state.container.setPointerCapture).not.toHaveBeenCalled();
		});
	});

	describe('adapterOnPointerUp', () => {
		it('releases capture for matching pointerId', () => {
			const state = createMockState();
			state.activePointerId = 5;
			const e = makePointerEvent('pointerup', { pointerId: 5 });

			adapterOnPointerUp(state, e);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).toHaveBeenCalledWith(5);
		});

		it('ignores non-matching pointerId', () => {
			const state = createMockState();
			state.activePointerId = 5;
			const e = makePointerEvent('pointerup', { pointerId: 99 });

			adapterOnPointerUp(state, e);

			expect(state.activePointerId).toBe(5); // unchanged
			expect(state.container.releasePointerCapture).not.toHaveBeenCalled();
		});
	});

	describe('adapterOnPointerCancel', () => {
		it('releases capture for matching pointerId', () => {
			const state = createMockState();
			state.activePointerId = 7;
			const e = makePointerEvent('pointercancel', { pointerId: 7 });

			adapterOnPointerCancel(state, e);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).toHaveBeenCalledWith(7);
		});

		it('ignores non-matching pointerId', () => {
			const state = createMockState();
			state.activePointerId = 7;
			const e = makePointerEvent('pointercancel', { pointerId: 99 });

			adapterOnPointerCancel(state, e);

			expect(state.activePointerId).toBe(7); // unchanged
		});
	});

	describe('adapterOnLostPointerCapture', () => {
		it('clears activePointerId when pointerId matches and hasPointerCapture is true', () => {
			const state = createMockState();
			state.activePointerId = 7;
			const e = makePointerEvent('lostpointercapture', { pointerId: 7 });

			adapterOnLostPointerCapture(state, e);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).toHaveBeenCalledWith(7);
		});

		it('clears activePointerId when pointerId matches and hasPointerCapture is false', () => {
			const state = createMockState();
			state.activePointerId = 7;
			(state.container.hasPointerCapture as ReturnType<typeof vi.fn>).mockReturnValue(false);
			const e = makePointerEvent('lostpointercapture', { pointerId: 7 });

			adapterOnLostPointerCapture(state, e);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).not.toHaveBeenCalled();
		});

		it('ignores non-matching pointerId', () => {
			const state = createMockState();
			state.activePointerId = 7;
			const e = makePointerEvent('lostpointercapture', { pointerId: 99 });

			adapterOnLostPointerCapture(state, e);

			expect(state.activePointerId).toBe(7); // unchanged
			expect(state.container.releasePointerCapture).not.toHaveBeenCalled();
		});
	});

	describe('releaseCapture', () => {
		it('no-op when activePointerId is null', () => {
			const state = createMockState();
			state.activePointerId = null;

			releaseCapture(state);

			expect(state.container.releasePointerCapture).not.toHaveBeenCalled();
		});

		it('releases and clears when active', () => {
			const state = createMockState();
			state.activePointerId = 3;

			releaseCapture(state);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).toHaveBeenCalledWith(3);
		});
	});

	describe('pointerEventDestroy', () => {
		it('releases capture if active pointer exists', () => {
			const state = createMockState();
			state.activePointerId = 10;

			pointerEventDestroy(state);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).toHaveBeenCalledWith(10);
		});

		it('no-op if no active pointer', () => {
			const state = createMockState();
			state.activePointerId = null;

			pointerEventDestroy(state);

			expect(state.activePointerId).toBeNull();
			expect(state.container.releasePointerCapture).not.toHaveBeenCalled();
		});
	});
});
