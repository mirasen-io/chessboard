import { describe, expect, it, vi } from 'vitest';
import type { SceneRenderGeometry } from '../../../../src/layout/geometry/types.js';
import { makeScenePointerEvent } from '../../../../src/runtime/input/adapter/helpers.js';
import type { InputAdapterInternal } from '../../../../src/runtime/input/adapter/types.js';
import { ColorCode } from '../../../../src/state/board/types/internal.js';

function createMockState(opts?: {
	containerRect?: DOMRect;
	geometry?: SceneRenderGeometry | null;
}): InputAdapterInternal {
	const container = document.createElement('div');
	container.getBoundingClientRect = vi.fn(() => opts?.containerRect ?? new DOMRect(0, 0, 400, 400));
	return {
		container,
		getRenderGeometry: () => opts?.geometry ?? null,
		controller: { onEvent: vi.fn() },
		activePointerId: null
	};
}

function createMockGeometry(orientation: ColorCode = ColorCode.White): SceneRenderGeometry {
	return {
		sceneSize: { width: 400, height: 400 },
		orientation,
		boardRect: { x: 0, y: 0, width: 400, height: 400 },
		squareSize: 50,
		getSquareRect: vi.fn()
	};
}

function createPointerEvent(opts: {
	type?: string;
	clientX?: number;
	clientY?: number;
	pointerId?: number;
	isPrimary?: boolean;
}): PointerEvent {
	return new PointerEvent(opts.type ?? 'pointermove', {
		clientX: opts.clientX ?? 0,
		clientY: opts.clientY ?? 0,
		pointerId: opts.pointerId ?? 1,
		isPrimary: opts.isPrimary ?? true
	});
}

describe('makeScenePointerEvent', () => {
	it('converts client coordinates to scene-relative point', () => {
		const state = createMockState({
			containerRect: new DOMRect(100, 50, 400, 400)
		});
		const e = createPointerEvent({ type: 'pointermove', clientX: 200, clientY: 150 });

		const result = makeScenePointerEvent(state, e);

		// 200 - 100 = 100, 150 - 50 = 100
		expect(result.point.x).toBe(100);
		expect(result.point.y).toBe(100);
	});

	it('clamps point to scene rect boundaries', () => {
		const state = createMockState({
			containerRect: new DOMRect(0, 0, 400, 400)
		});
		// Point outside container to the left/top
		const e = createPointerEvent({ type: 'pointermove', clientX: -50, clientY: -30 });

		const result = makeScenePointerEvent(state, e);

		expect(result.clampedPoint.x).toBe(0);
		expect(result.clampedPoint.y).toBe(0);
	});

	it('without geometry: boardClampedPoint and targetSquare are null', () => {
		const state = createMockState({ geometry: null });
		const e = createPointerEvent({ type: 'pointermove', clientX: 100, clientY: 100 });

		const result = makeScenePointerEvent(state, e);

		expect(result.boardClampedPoint).toBeNull();
		expect(result.targetSquare).toBeNull();
	});

	it('with geometry white orientation: maps point to correct square', () => {
		const geometry = createMockGeometry(ColorCode.White);
		const state = createMockState({ geometry });
		// Point at (25, 375) → xIndex=0, yIndex=7 → file=0, rank=0 → square a1 = 0
		const e = createPointerEvent({ type: 'pointermove', clientX: 25, clientY: 375 });

		const result = makeScenePointerEvent(state, e);

		expect(result.targetSquare).toBe(0); // a1
	});

	it('with geometry white orientation: maps e4 correctly', () => {
		const geometry = createMockGeometry(ColorCode.White);
		const state = createMockState({ geometry });
		// e4 is file=4, rank=3 → white: xIndex=4, yIndex=7-3=4
		// point at (225, 225) → xIndex=4, yIndex=4 → file=4, rank=3 → square 3*8+4 = 28
		const e = createPointerEvent({ type: 'pointermove', clientX: 225, clientY: 225 });

		const result = makeScenePointerEvent(state, e);

		expect(result.targetSquare).toBe(28); // e4
	});

	it('with geometry black orientation: maps point to correct square', () => {
		const geometry = createMockGeometry(ColorCode.Black);
		const state = createMockState({ geometry });
		// Point at (25, 25) → xIndex=0, yIndex=0 → black: file=7-0=7, rank=0 → square 0*8+7 = 7 (h1)
		const e = createPointerEvent({ type: 'pointermove', clientX: 25, clientY: 25 });

		const result = makeScenePointerEvent(state, e);

		expect(result.targetSquare).toBe(7); // h1
	});

	it('point outside board rect gives targetSquare null', () => {
		const geometry = createMockGeometry(ColorCode.White);
		const state = createMockState({
			containerRect: new DOMRect(0, 0, 600, 600),
			geometry
		});
		// Board rect is 0,0,400,400. Point at (500, 300) is outside board.
		const e = createPointerEvent({ type: 'pointermove', clientX: 500, clientY: 300 });

		const result = makeScenePointerEvent(state, e);

		expect(result.targetSquare).toBeNull();
	});

	it('with geometry: boardClampedPoint is not null', () => {
		const geometry = createMockGeometry(ColorCode.White);
		const state = createMockState({ geometry });
		const e = createPointerEvent({ type: 'pointermove', clientX: 100, clientY: 100 });

		const result = makeScenePointerEvent(state, e);

		expect(result.boardClampedPoint).not.toBeNull();
	});
});
