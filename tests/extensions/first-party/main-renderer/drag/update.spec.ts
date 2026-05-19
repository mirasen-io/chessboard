import { describe, expect, it } from 'vitest';
import { createMainRendererDrag } from '../../../../../src/extensions/first-party/main-renderer/drag/factory.js';
import { PieceCode, type Square } from '../../../../../src/state/board/types/internal.js';
import {
	createDragLayer,
	createDragTransientVisualsContext,
	createDragUpdateContext,
	createLiftedPieceDragSession,
	createMockRuntimeSurface
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import { createTestPieceSymbolResolver } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

describe('drag update – no-op when inactive', () => {
	it('does not subscribe or unsubscribe when no drag and was inactive', () => {
		const { surface, subscribe, unsubscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);

		const ctx = createDragUpdateContext({ dragSession: null });
		drag.onUpdate(ctx);

		expect(subscribe).not.toHaveBeenCalled();
		expect(unsubscribe).not.toHaveBeenCalled();
	});

	it('does not activate for release-targeting drag type', () => {
		const { surface, subscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);

		const ctx = createDragUpdateContext({
			dragSession: {
				owner: 'core',
				type: 'release-targeting',
				sourceSquare: 4 as Square,
				sourcePieceCode: PieceCode.WhiteKing,
				targetSquare: 20 as Square,
				pointerPosition: { x: 100, y: 100 }
			}
		});
		drag.onUpdate(ctx);

		expect(subscribe).not.toHaveBeenCalled();
	});

	it('does not activate for pending lifted-piece drag', () => {
		const { surface, subscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);

		const ctx = createDragUpdateContext({
			dragSession: {
				owner: 'core',
				type: 'lifted-piece-drag',
				phase: 'pending',
				sourceSquare: 4 as Square,
				sourcePieceCode: PieceCode.WhiteKing,
				targetSquare: 4 as Square,
				startButton: 0,
				startPoint: { x: 0, y: 0 },
				thresholdPx: 4
			}
		});
		drag.onUpdate(ctx);

		expect(subscribe).not.toHaveBeenCalled();
	});
});

describe('drag update – drag start', () => {
	it('subscribes to transient visuals on lifted-piece drag start', () => {
		const { surface, subscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);

		const ctx = createDragUpdateContext({ dragSession: createLiftedPieceDragSession() });
		drag.onUpdate(ctx);

		expect(subscribe).toHaveBeenCalledTimes(1);
	});

	it('stores piece URL observable via subsequent transient render', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);
		const layer = createDragLayer();

		// Start drag
		const updateCtx = createDragUpdateContext({
			dragSession: createLiftedPieceDragSession(4 as Square, PieceCode.WhiteKing)
		});
		drag.onUpdate(updateCtx);

		// Render transient visuals — should create image with correct href
		const renderCtx = createDragTransientVisualsContext({ boardClampedPoint: { x: 100, y: 100 } });
		drag.renderTransientVisuals(renderCtx, layer);

		expect(layer.children.length).toBe(1);
		expect(layer.children[0].getAttribute('href')).toBe(resolver.getHref(PieceCode.WhiteKing));
	});

	it('does not resubscribe on repeated update during same active drag', () => {
		const { surface, subscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);

		const ctx = createDragUpdateContext({ dragSession: createLiftedPieceDragSession() });
		drag.onUpdate(ctx);
		drag.onUpdate(ctx);
		drag.onUpdate(ctx);

		expect(subscribe).toHaveBeenCalledTimes(1);
	});
});

describe('drag update – drag end', () => {
	it('unsubscribes from transient visuals when drag ends', () => {
		const { surface, unsubscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);

		// Start drag
		const startCtx = createDragUpdateContext({ dragSession: createLiftedPieceDragSession() });
		drag.onUpdate(startCtx);

		// End drag
		const endCtx = createDragUpdateContext({ dragSession: null });
		drag.onUpdate(endCtx);

		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('removes existing drag image node from layer', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);
		const layer = createDragLayer();

		// Start drag and render
		const startCtx = createDragUpdateContext({ dragSession: createLiftedPieceDragSession() });
		drag.onUpdate(startCtx);
		drag.renderTransientVisuals(createDragTransientVisualsContext(), layer);
		expect(layer.children.length).toBe(1);

		// End drag
		const endCtx = createDragUpdateContext({ dragSession: null });
		drag.onUpdate(endCtx);

		expect(layer.children.length).toBe(0);
	});

	it('after drag end, subsequent transient render does not create node', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver);
		const layer = createDragLayer();

		// Start and end drag
		drag.onUpdate(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));
		drag.onUpdate(createDragUpdateContext({ dragSession: null }));

		// Attempt to render — should be inactive
		drag.renderTransientVisuals(createDragTransientVisualsContext(), layer);
		expect(layer.children.length).toBe(0);
	});
});
