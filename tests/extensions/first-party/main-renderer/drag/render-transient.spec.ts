import { describe, expect, it } from 'vitest';
import { rendererDragRenderTransientVisuals } from '../../../../../src/extensions/first-party/main-renderer/drag/render.js';
import type { MainRendererDragInternal } from '../../../../../src/extensions/first-party/main-renderer/drag/types.js';
import type { MainRendererConfigDrag } from '../../../../../src/extensions/first-party/main-renderer/types/template.js';
import {
	type NonEmptyPieceCode,
	PieceCode
} from '../../../../../src/state/board/types/internal.js';
import { queryByDataChessboardId } from '../../../../test-utils/dom/svg.js';
import {
	createDragLayer,
	createDragTransientVisualsContext,
	createMockRuntimeSurface,
	createTestDragConfigGetter
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import { createTestPieceSymbolResolver } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

function createInactiveState(): MainRendererDragInternal {
	const { surface } = createMockRuntimeSurface();
	return {
		runtimeSurface: surface,
		resolver,
		getDragConfig: createTestDragConfigGetter(),
		isDragActive: false,
		pieceCode: null,
		pieceNode: null
	};
}

function createActiveState(
	pieceCode: NonEmptyPieceCode = PieceCode.WhiteKing,
	dragConfig?: Partial<MainRendererConfigDrag>
): MainRendererDragInternal {
	const { surface } = createMockRuntimeSurface();
	return {
		runtimeSurface: surface,
		resolver,
		getDragConfig: createTestDragConfigGetter(dragConfig),
		isDragActive: true,
		pieceCode,
		pieceNode: null
	};
}

function createActiveStateNoPiece(): MainRendererDragInternal {
	const { surface } = createMockRuntimeSurface();
	return {
		runtimeSurface: surface,
		resolver,
		getDragConfig: createTestDragConfigGetter(),
		isDragActive: true,
		pieceCode: null,
		pieceNode: null
	};
}

describe('drag transient render – inactive', () => {
	it('no-op when drag is inactive', () => {
		const state = createInactiveState();
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext();

		rendererDragRenderTransientVisuals(state, ctx, layer);

		expect(layer.children.length).toBe(0);
	});

	it('no-op when active but pieceCode is null', () => {
		const state = createActiveStateNoPiece();
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext();

		rendererDragRenderTransientVisuals(state, ctx, layer);

		expect(layer.children.length).toBe(0);
	});
});

describe('drag transient render – creates dragged use element', () => {
	it('creates a use element on first render when active with pieceCode', () => {
		const state = createActiveState();
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext({ boardClampedPoint: { x: 200, y: 200 } });

		rendererDragRenderTransientVisuals(state, ctx, layer);

		expect(layer.children.length).toBe(1);
		expect(layer.children[0].tagName).toBe('use');
	});

	it('sets data-chessboard-id to dragged-piece', () => {
		const state = createActiveState();
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext();

		rendererDragRenderTransientVisuals(state, ctx, layer);

		expect(queryByDataChessboardId(layer, 'dragged-piece')).not.toBeNull();
	});

	it('positions element centered around boardClampedPoint', () => {
		const state = createActiveState();
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, point at (200, 150)
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// x = 200 - 50/2 = 175, y = 150 - 50/2 = 125
		expect(el.getAttribute('x')).toBe('175');
		expect(el.getAttribute('y')).toBe('125');
	});

	it('sets width and height from geometry.squareSize', () => {
		const state = createActiveState();
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext({ sceneSize: 400 }); // squareSize = 50

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		expect(el.getAttribute('width')).toBe('50');
		expect(el.getAttribute('height')).toBe('50');
	});

	it('uses resolver symbol href as href', () => {
		const state = createActiveState(PieceCode.BlackQueen);
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext();

		rendererDragRenderTransientVisuals(state, ctx, layer);

		expect(layer.children[0].getAttribute('href')).toBe(resolver.getHref(PieceCode.BlackQueen));
	});

	it('appends element to the provided layer element', () => {
		const state = createActiveState();
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext();

		rendererDragRenderTransientVisuals(state, ctx, layer);

		expect(layer.children[0].parentElement).toBe(layer);
	});
});

describe('drag transient render – subsequent renders', () => {
	it('updates existing node position without creating duplicate', () => {
		const state = createActiveState();
		const layer = createDragLayer();

		// First render
		const ctx1 = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 100, y: 100 }
		});
		rendererDragRenderTransientVisuals(state, ctx1, layer);
		expect(layer.children.length).toBe(1);
		expect(layer.children[0].getAttribute('x')).toBe('75'); // 100 - 25

		// Second render with different position
		const ctx2 = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 300, y: 200 }
		});
		rendererDragRenderTransientVisuals(state, ctx2, layer);

		expect(layer.children.length).toBe(1);
		expect(layer.children[0].getAttribute('x')).toBe('275'); // 300 - 25
		expect(layer.children[0].getAttribute('y')).toBe('175'); // 200 - 25
	});

	it('updates width/height when geometry changes', () => {
		const state = createActiveState();
		const layer = createDragLayer();

		// First render with 400px scene (squareSize=50)
		rendererDragRenderTransientVisuals(
			state,
			createDragTransientVisualsContext({ sceneSize: 400 }),
			layer
		);
		expect(layer.children[0].getAttribute('width')).toBe('50');

		// Second render with 800px scene (squareSize=100)
		rendererDragRenderTransientVisuals(
			state,
			createDragTransientVisualsContext({ sceneSize: 800 }),
			layer
		);
		expect(layer.children[0].getAttribute('width')).toBe('100');
	});
});

describe('drag transient render – pieceScale', () => {
	it('default desktop pieceScale=1 keeps width/height equal to squareSize (regression literals)', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1,
			pieceAnchor: 'center'
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, point at (200, 150)
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// Prior implementation produced exactly these strings for these inputs.
		expect(el.getAttribute('width')).toBe('50');
		expect(el.getAttribute('height')).toBe('50');
		expect(el.getAttribute('x')).toBe('175'); // 200 - 50/2
		expect(el.getAttribute('y')).toBe('125'); // 150 - 50/2
	});

	it('custom pieceScale scales width/height and centers around point (anchor=center)', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1.5,
			pieceAnchor: 'center'
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, point at (200, 150)
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// renderedSize = 50 * 1.5 = 75
		expect(el.getAttribute('width')).toBe('75');
		expect(el.getAttribute('height')).toBe('75');
		expect(el.getAttribute('x')).toBe('162.5'); // 200 - 75/2
		expect(el.getAttribute('y')).toBe('112.5'); // 150 - 75/2
	});

	it('center anchor with scale holds across two distinct pointer positions', () => {
		const layer = createDragLayer();
		const config = { pieceScale: 1.2, pieceAnchor: 'center' as const };

		// Position 1
		const state1 = createActiveState(PieceCode.WhiteKing, config);
		rendererDragRenderTransientVisuals(
			state1,
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 100, y: 100 }
			}),
			layer
		);
		// renderedSize = 50 * 1.2 = 60
		expect(state1.pieceNode!.getAttribute('width')).toBe('60');
		expect(state1.pieceNode!.getAttribute('x')).toBe('70'); // 100 - 30
		expect(state1.pieceNode!.getAttribute('y')).toBe('70'); // 100 - 30

		// Position 2 — fresh state to avoid update-path / create-path mixing
		const layer2 = createDragLayer();
		const state2 = createActiveState(PieceCode.WhiteKing, config);
		rendererDragRenderTransientVisuals(
			state2,
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 250, y: 175 }
			}),
			layer2
		);
		expect(state2.pieceNode!.getAttribute('width')).toBe('60');
		expect(state2.pieceNode!.getAttribute('x')).toBe('220'); // 250 - 30
		expect(state2.pieceNode!.getAttribute('y')).toBe('145'); // 175 - 30
	});
});

describe('drag transient render – pieceAnchor=bottom', () => {
	it('positions visual above the pointer', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1.2,
			pieceAnchor: 'bottom'
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, point at (200, 150)
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// renderedSize = 50 * 1.2 = 60
		expect(el.getAttribute('width')).toBe('60');
		expect(el.getAttribute('height')).toBe('60');
		expect(el.getAttribute('x')).toBe('170'); // 200 - 30
		// y = 150 - 60 = 90 (bottom-center anchor: pointer at bottom-center of visual)
		expect(el.getAttribute('y')).toBe('90');
	});

	it('bottom anchor without offset produces bottom-center values', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1.5,
			pieceAnchor: 'bottom'
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, point at (200, 150)
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		expect(el.getAttribute('width')).toBe('75');
		expect(el.getAttribute('height')).toBe('75');
		expect(el.getAttribute('x')).toBe('162.5');
		expect(el.getAttribute('y')).toBe('75');
	});

	it('bottom anchor formula holds across pointer positions', () => {
		const config = { pieceScale: 1.5, pieceAnchor: 'bottom' as const };

		const layer1 = createDragLayer();
		const state1 = createActiveState(PieceCode.WhiteKing, config);
		rendererDragRenderTransientVisuals(
			state1,
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 100, y: 100 }
			}),
			layer1
		);
		// renderedSize = 75; x = 100 - 37.5 = 62.5; y = 100 - 75 = 25
		expect(state1.pieceNode!.getAttribute('x')).toBe('62.5');
		expect(state1.pieceNode!.getAttribute('y')).toBe('25');

		const layer2 = createDragLayer();
		const state2 = createActiveState(PieceCode.WhiteKing, config);
		rendererDragRenderTransientVisuals(
			state2,
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 300, y: 250 }
			}),
			layer2
		);
		// x = 300 - 37.5 = 262.5; y = 250 - 75 = 175
		expect(state2.pieceNode!.getAttribute('x')).toBe('262.5');
		expect(state2.pieceNode!.getAttribute('y')).toBe('175');
	});
});

describe('drag transient render – pieceAnchorOffsetY', () => {
	it('default offset 0 leaves desktop center anchor unchanged', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1,
			pieceAnchor: 'center',
			pieceAnchorOffsetY: 0
		});
		const layer = createDragLayer();
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		expect(el.getAttribute('x')).toBe('175');
		expect(el.getAttribute('y')).toBe('125');
	});

	it('positive offset shifts the lifted piece down (center anchor)', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1,
			pieceAnchor: 'center',
			pieceAnchorOffsetY: 0.2
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, anchorOffsetY = 50 * 0.2 = 10
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// y = 150 - 50/2 + 10 = 135
		expect(el.getAttribute('y')).toBe('135');
		// x is unchanged by Y offset
		expect(el.getAttribute('x')).toBe('175');
	});

	it('negative offset shifts the lifted piece up (center anchor)', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1,
			pieceAnchor: 'center',
			pieceAnchorOffsetY: -0.1
		});
		const layer = createDragLayer();
		// anchorOffsetY = 50 * -0.1 = -5
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// y = 150 - 25 + (-5) = 120
		expect(el.getAttribute('y')).toBe('120');
	});

	it('mobile-default offset shifts bottom anchor down by squareSize * 0.14', () => {
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 1.5,
			pieceAnchor: 'bottom',
			pieceAnchorOffsetY: 0.14
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50, renderedSize = 75, anchorOffsetY = 50 * 0.14 = 7
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 150 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		expect(el.getAttribute('width')).toBe('75');
		expect(el.getAttribute('height')).toBe('75');
		expect(el.getAttribute('x')).toBe('162.5'); // unaffected
		// y = 150 - 75 + 7 = 82
		expect(el.getAttribute('y')).toBe('82');
	});

	it('offset Y is measured in board square units (scales with squareSize)', () => {
		const config = {
			pieceScale: 1.5,
			pieceAnchor: 'bottom' as const,
			pieceAnchorOffsetY: 0.1
		};

		// 400px scene → squareSize=50; anchorOffsetY = 50 * 0.1 = 5
		const layer1 = createDragLayer();
		const state1 = createActiveState(PieceCode.WhiteKing, config);
		rendererDragRenderTransientVisuals(
			state1,
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 200, y: 150 }
			}),
			layer1
		);
		// renderedSize = 75; y = 150 - 75 + 5 = 80
		expect(state1.pieceNode!.getAttribute('y')).toBe('80');

		// 800px scene → squareSize=100; anchorOffsetY = 100 * 0.1 = 10
		const layer2 = createDragLayer();
		const state2 = createActiveState(PieceCode.WhiteKing, config);
		rendererDragRenderTransientVisuals(
			state2,
			createDragTransientVisualsContext({
				sceneSize: 800,
				boardClampedPoint: { x: 400, y: 300 }
			}),
			layer2
		);
		// renderedSize = 150; y = 300 - 150 + 10 = 160
		expect(state2.pieceNode!.getAttribute('y')).toBe('160');
	});
});

describe('drag transient render – viewport overflow', () => {
	it('mobile-style drag near the top rank produces a negative y, intentionally rendering above the viewport', () => {
		// Mirrors the mobile preset used by the renderer: scale 2, bottom anchor,
		// 0.14 squareSize lift. With the pointer clamped to the top rank, the
		// lifted piece must extend above y=0; this contract is the reason the
		// root SVG opts into `overflow: visible` so the visual is not clipped.
		const state = createActiveState(PieceCode.WhiteKing, {
			pieceScale: 2,
			pieceAnchor: 'bottom',
			pieceAnchorOffsetY: 0.14
		});
		const layer = createDragLayer();
		// 400px scene → squareSize = 50. Pointer near the top edge of the board.
		const ctx = createDragTransientVisualsContext({
			sceneSize: 400,
			boardClampedPoint: { x: 200, y: 25 }
		});

		rendererDragRenderTransientVisuals(state, ctx, layer);

		const el = layer.children[0];
		// renderedSize = 100, anchorOffsetY = 7, y = 25 - 100 + 7 = -68
		expect(Number(el.getAttribute('y'))).toBeLessThan(0);
	});
});
