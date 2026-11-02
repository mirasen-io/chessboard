import { describe, expect, it } from 'vitest';
import { createMainRendererCoordinates } from '../../../../../src/extensions/first-party/main-renderer/coordinates/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import { createSvgElement } from '../../../../test-utils/dom/svg.js';
import {
	createCoordConfig,
	createCoordRenderContext,
	createCoordinatesLayer
} from '../../../../test-utils/extensions/first-party/main-renderer/coordinates.js';

describe('coordinates renderer – dirty layer gating', () => {
	it('no-ops when DirtyLayer.Coordinates is not set', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();
		// Pre-populate with a dummy child
		layer.appendChild(createSvgElement('text'));

		const context = createCoordRenderContext({ dirtyLayers: DirtyLayer.Board });
		coords.render(context, layer);

		// Layer is unchanged — still has 1 child from before
		expect(layer.children.length).toBe(1);
	});

	it('no-ops when dirtyLayers is 0', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();
		layer.appendChild(createSvgElement('text'));

		const context = createCoordRenderContext({ dirtyLayers: 0 });
		coords.render(context, layer);

		expect(layer.children.length).toBe(1);
	});

	it('renders 16 labels when DirtyLayer.Coordinates is set', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		const context = createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates });
		coords.render(context, layer);

		expect(layer.children.length).toBe(16);
	});

	it('renders when DirtyLayer.All includes Coordinates', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		const context = createCoordRenderContext({ dirtyLayers: DirtyLayer.All });
		coords.render(context, layer);

		expect(layer.children.length).toBe(16);
	});
});

describe('coordinates renderer – DOM replacement', () => {
	it('clears previous children before rendering fresh labels', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		// Add pre-existing children
		layer.appendChild(createSvgElement('text'));
		layer.appendChild(createSvgElement('rect'));
		expect(layer.children.length).toBe(2);

		const context = createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates });
		coords.render(context, layer);

		// Only the 16 coordinate labels remain
		expect(layer.children.length).toBe(16);
	});

	it('repeated render does not accumulate duplicate labels', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		const context = createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates });
		coords.render(context, layer);
		coords.render(context, layer);
		coords.render(context, layer);

		expect(layer.children.length).toBe(16);
	});
});
