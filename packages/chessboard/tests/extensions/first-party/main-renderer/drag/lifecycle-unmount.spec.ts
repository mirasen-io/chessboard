import { describe, expect, it } from 'vitest';
import { createMainRendererDrag } from '../../../../../src/extensions/first-party/main-renderer/drag/factory.js';
import {
	createDragLayer,
	createDragTransientVisualsContext,
	createDragUpdateContext,
	createLiftedPieceDragSession,
	createMockRuntimeSurface,
	createTestDragConfigGetter
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import { createTestPieceSymbolResolver } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';
const resolver = createTestPieceSymbolResolver();
const getDragConfig = createTestDragConfigGetter();

describe('drag lifecycle – unmount', () => {
	it('removes dragged image node from the layer', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver, getDragConfig);
		const layer = createDragLayer();

		// Start drag and render
		drag.onUpdate(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));
		drag.renderTransientVisuals(createDragTransientVisualsContext(), layer);
		expect(layer.children.length).toBe(1);

		drag.unmount();

		expect(layer.children.length).toBe(0);
	});

	it('calls transientVisuals.unsubscribe unconditionally', () => {
		const { surface, unsubscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver, getDragConfig);

		// Start drag so subscribe is called
		drag.onUpdate(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));

		drag.unmount();

		// unsubscribe is called by unmount (unconditionally per source)
		expect(unsubscribe).toHaveBeenCalled();
	});

	it('calls unsubscribe even when drag was not active', () => {
		const { surface, unsubscribe } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver, getDragConfig);

		// Never started a drag
		drag.unmount();

		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('after unmount, renderTransientVisuals does not create a node', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver, getDragConfig);
		const layer = createDragLayer();

		// Start drag, render, then unmount
		drag.onUpdate(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));
		drag.renderTransientVisuals(createDragTransientVisualsContext(), layer);
		drag.unmount();

		// Attempt to render after unmount — drag is inactive
		drag.renderTransientVisuals(createDragTransientVisualsContext(), layer);
		expect(layer.children.length).toBe(0);
	});

	it('does not throw when called with no active drag and no node', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver, getDragConfig);

		expect(() => drag.unmount()).not.toThrow();
	});

	it('does not throw when called after already being unmounted', () => {
		const { surface } = createMockRuntimeSurface();
		const drag = createMainRendererDrag(surface, resolver, getDragConfig);
		const layer = createDragLayer();

		drag.onUpdate(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));
		drag.renderTransientVisuals(createDragTransientVisualsContext(), layer);
		drag.unmount();

		expect(() => drag.unmount()).not.toThrow();
	});
});
