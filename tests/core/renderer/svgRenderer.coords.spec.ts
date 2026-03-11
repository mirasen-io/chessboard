import { describe, expect, it } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { DEFAULT_RENDER_CONFIG } from '../../../src/core/renderer/types';
import { DirtyLayer, StateSnapshot } from '../../../src/core/state/types';

describe('SvgRenderer coordinates rendering', () => {
	it('renders 16 coordinate labels total (8 ranks + 8 files)', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'white',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		// Total labels should be 16 (8 ranks + 8 files)
		const labels = Array.from(coordsRoot.querySelectorAll('text'));
		expect(labels.length).toBe(16);

		renderer.unmount();
	});

	it('renders rank labels on visual left edge for white orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'white',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// Rank labels should be anchored to a-file squares for white orientation
		const rankLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'start');
		expect(rankLabels.length).toBe(8);

		// Verify semantic mapping: rank labels "8" through "1" map to squares a8 through a1
		const expectedMapping = [
			{ text: '8', square: 'a8' },
			{ text: '7', square: 'a7' },
			{ text: '6', square: 'a6' },
			{ text: '5', square: 'a5' },
			{ text: '4', square: 'a4' },
			{ text: '3', square: 'a3' },
			{ text: '2', square: 'a2' },
			{ text: '1', square: 'a1' }
		];

		for (const { text, square } of expectedMapping) {
			const label = labels.find((el) => el.textContent === text);
			expect(label).toBeDefined();
			expect(label?.getAttribute('data-square')).toBe(square);
		}

		renderer.unmount();
	});

	it('renders file labels on visual bottom edge for white orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'white',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// File labels should be anchored to rank 1 squares for white orientation
		const fileLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'end');
		expect(fileLabels.length).toBe(8);

		// Verify semantic mapping: file labels "a" through "h" map to squares a1 through h1
		const expectedMapping = [
			{ text: 'a', square: 'a1' },
			{ text: 'b', square: 'b1' },
			{ text: 'c', square: 'c1' },
			{ text: 'd', square: 'd1' },
			{ text: 'e', square: 'e1' },
			{ text: 'f', square: 'f1' },
			{ text: 'g', square: 'g1' },
			{ text: 'h', square: 'h1' }
		];

		for (const { text, square } of expectedMapping) {
			const label = labels.find((el) => el.textContent === text);
			expect(label).toBeDefined();
			expect(label?.getAttribute('data-square')).toBe(square);
		}

		renderer.unmount();
	});

	it('renders rank labels on visual left edge for black orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'black',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'black');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// Rank labels should be anchored to h-file squares for black orientation
		const rankLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'start');
		expect(rankLabels.length).toBe(8);

		// Verify semantic mapping: rank labels "1" through "8" map to squares h1 through h8
		const expectedMapping = [
			{ text: '1', square: 'h1' },
			{ text: '2', square: 'h2' },
			{ text: '3', square: 'h3' },
			{ text: '4', square: 'h4' },
			{ text: '5', square: 'h5' },
			{ text: '6', square: 'h6' },
			{ text: '7', square: 'h7' },
			{ text: '8', square: 'h8' }
		];

		for (const { text, square } of expectedMapping) {
			const label = labels.find((el) => el.textContent === text);
			expect(label).toBeDefined();
			expect(label?.getAttribute('data-square')).toBe(square);
		}

		renderer.unmount();
	});

	it('renders file labels on visual bottom edge for black orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'black',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'black');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// File labels should be anchored to rank 8 squares for black orientation
		const fileLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'end');
		expect(fileLabels.length).toBe(8);

		// Verify semantic mapping: file labels "h" through "a" map to squares h8 through a8
		const expectedMapping = [
			{ text: 'h', square: 'h8' },
			{ text: 'g', square: 'g8' },
			{ text: 'f', square: 'f8' },
			{ text: 'e', square: 'e8' },
			{ text: 'd', square: 'd8' },
			{ text: 'c', square: 'c8' },
			{ text: 'b', square: 'b8' },
			{ text: 'a', square: 'a8' }
		];

		for (const { text, square } of expectedMapping) {
			const label = labels.find((el) => el.textContent === text);
			expect(label).toBeDefined();
			expect(label?.getAttribute('data-square')).toBe(square);
		}

		renderer.unmount();
	});

	it('uses square-contrast coloring by default', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'white',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// Check a few specific labels
		// a8 (sq=56) is light square, should use dark color for contrast (dark text on light square)
		const a8Label = labels.find((el) => el.textContent === '8');
		expect(a8Label?.getAttribute('fill')).toBe(DEFAULT_RENDER_CONFIG.coords?.dark); // default coords.dark

		// a1 (sq=0) is dark square, should use light color for contrast (light text on dark square)
		const a1Label = labels.find((el) => el.textContent === '1');
		expect(a1Label?.getAttribute('fill')).toBe(DEFAULT_RENDER_CONFIG.coords?.light); // default coords.light

		renderer.unmount();
	});

	it('uses explicit RenderConfig.coords when provided', () => {
		const opts = {
			config: {
				coords: {
					light: '#ff0000', // red text on dark squares
					dark: '#00ff00' // green text on light squares
				}
			}
		};
		const renderer = new SvgRenderer(opts);
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const state: StateSnapshot = {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			orientation: 'white',
			turn: 'white',
			selected: null,
			movability: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// Check that labels use the custom colors based on square type
		// a8 (sq=56) is light square, should use coords.dark (dark text on light square)
		const a8Label = labels.find((el) => el.textContent === '8');
		expect(a8Label?.getAttribute('fill')).toBe(opts.config?.coords?.dark);

		// a1 (sq=0) is dark square, should use coords.light (light text on dark square)
		const a1Label = labels.find((el) => el.textContent === '1');
		expect(a1Label?.getAttribute('fill')).toBe(opts.config?.coords?.light);

		renderer.unmount();
	});
});
