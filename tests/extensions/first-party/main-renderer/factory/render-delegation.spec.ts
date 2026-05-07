import { describe, expect, it } from 'vitest';
import { createMainRenderer } from '../../../../../src/extensions/first-party/main-renderer/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import { PieceCode, SQUARE_COUNT } from '../../../../../src/state/board/types/internal.js';
import {
	createAnimationPrepareContext,
	createAnimationUpdateContext
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';
import {
	createDragTransientVisualsContext,
	createDragUpdateContext,
	createLiftedPieceDragSession
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import {
	createMainRendererRuntimeSurface,
	mountMainRenderer
} from '../../../../test-utils/extensions/first-party/main-renderer/factory.js';
import { createPiecesRenderContext } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';
import { createMockExtensionCreateInstanceOptions } from '../../../../test-utils/extensions/factory.js';

function createMountedInstance() {
	const mocks = createMainRendererRuntimeSurface();
	const def = createMainRenderer();
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: mocks.surface })
	);
	const slotRoots = mountMainRenderer(instance);
	return { instance, slotRoots, ...mocks };
}

describe('main-renderer render delegation – board/coordinates/pieces', () => {
	it('render with DirtyLayer.Board creates content in board slot root', () => {
		const { instance, slotRoots } = createMountedInstance();

		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });
		instance.render!(ctx);

		expect(slotRoots.board.children.length).toBeGreaterThan(0);
	});

	it('render with DirtyLayer.Coordinates creates content in coordinates slot root', () => {
		const { instance, slotRoots } = createMountedInstance();

		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Coordinates });
		instance.render!(ctx);

		expect(slotRoots.coordinates.children.length).toBeGreaterThan(0);
	});

	it('render with DirtyLayer.Pieces and occupied board creates images in pieces slot root', () => {
		const { instance, slotRoots } = createMountedInstance();

		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[60] = PieceCode.BlackKing;

		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		instance.render!(ctx);

		expect(slotRoots.pieces.children.length).toBe(2);
	});

	it('render does not create content in unrelated slots', () => {
		const { instance, slotRoots } = createMountedInstance();

		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });
		instance.render!(ctx);

		// Only board should have content
		expect(slotRoots.drag.children.length).toBe(0);
		expect(slotRoots.animation.children.length).toBe(0);
	});
});

describe('main-renderer render delegation – drag', () => {
	it('renderTransientVisuals during active drag creates content in drag slot root', () => {
		const { instance, slotRoots } = createMountedInstance();

		// Start drag via onUpdate
		const updateCtx = createDragUpdateContext({
			dragSession: createLiftedPieceDragSession()
		});
		instance.onUpdate!(updateCtx);

		// Render transient visuals
		const transientCtx = createDragTransientVisualsContext({
			boardClampedPoint: { x: 200, y: 200 }
		});
		instance.renderTransientVisuals!(transientCtx);

		expect(slotRoots.drag.children.length).toBeGreaterThan(0);
	});
});

describe('main-renderer render delegation – animation', () => {
	it('prepareAnimation creates content in animation slot root', () => {
		const { instance, slotRoots, submit } = createMountedInstance();

		// Trigger animation via onUpdate with a piece move
		const board1 = new Uint8Array(SQUARE_COUNT);
		board1[12] = PieceCode.WhitePawn;
		const board2 = new Uint8Array(SQUARE_COUNT);
		board2[28] = PieceCode.WhitePawn;

		const updateCtx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: { pieces: board1, turn: 0, positionEpoch: 0 },
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: { pieces: board2, turn: 0, positionEpoch: 0 },
				change: {
					lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn },
					deferredUIMoveRequest: null
				}
			}
		});
		instance.onUpdate!(updateCtx);

		// Prepare animation
		const sessionId = submit.mock.results[0].value.id;
		const prepCtx = createAnimationPrepareContext({
			submittedSessions: [{ id: sessionId }]
		});
		instance.prepareAnimation!(prepCtx);

		expect(slotRoots.animation.children.length).toBeGreaterThan(0);
	});
});
