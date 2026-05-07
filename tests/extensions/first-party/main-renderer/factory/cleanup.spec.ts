import { describe, expect, it } from 'vitest';
import { createMainRenderer } from '../../../../../src/extensions/first-party/main-renderer/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import { PieceCode, SQUARE_COUNT } from '../../../../../src/state/board/types/internal.js';
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

describe('main-renderer – unmount cleanup', () => {
	it('unmount removes piece images from pieces slot root', () => {
		const { instance, slotRoots } = createMountedInstance();

		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[60] = PieceCode.BlackKing;

		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		instance.render!(ctx);
		expect(slotRoots.pieces.children.length).toBe(2);

		instance.unmount!();

		expect(slotRoots.pieces.children.length).toBe(0);
	});

	it('unmount removes drag images from drag slot root', () => {
		const { instance, slotRoots } = createMountedInstance();

		// Start drag and render
		instance.onUpdate!(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));
		instance.renderTransientVisuals!(
			createDragTransientVisualsContext({ boardClampedPoint: { x: 200, y: 200 } })
		);
		expect(slotRoots.drag.children.length).toBeGreaterThan(0);

		instance.unmount!();

		expect(slotRoots.drag.children.length).toBe(0);
	});

	it('unmount calls transientVisuals.unsubscribe', () => {
		const { instance, unsubscribe } = createMountedInstance();

		// Start a drag so subscribe was called
		instance.onUpdate!(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));

		instance.unmount!();

		expect(unsubscribe).toHaveBeenCalled();
	});

	it('after unmount, render throws mount guard error', () => {
		const { instance } = createMountedInstance();

		instance.unmount!();

		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });
		expect(() => instance.render!(ctx)).toThrow('Extension instance is not mounted yet');
	});
});

describe('main-renderer – destroy cleanup', () => {
	it('destroy cleans up same as unmount', () => {
		const { instance, slotRoots, unsubscribe } = createMountedInstance();

		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		instance.render!(ctx);

		instance.destroy!();

		expect(slotRoots.pieces.children.length).toBe(0);
		expect(unsubscribe).toHaveBeenCalled();
	});

	it('destroy followed by mount throws', () => {
		const mocks = createMainRendererRuntimeSurface();
		const def = createMainRenderer();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: mocks.surface })
		);
		mountMainRenderer(instance);

		instance.destroy!();

		expect(() => mountMainRenderer(instance)).toThrow('Extension is destroyed');
	});

	it('after destroy, render throws mount guard error', () => {
		const { instance } = createMountedInstance();

		instance.destroy!();

		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });
		expect(() => instance.render!(ctx)).toThrow('Extension instance is not mounted yet');
	});
});
