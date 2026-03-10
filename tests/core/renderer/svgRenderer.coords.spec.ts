import { describe, expect, it } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { DEFAULT_RENDER_CONFIG } from '../../../src/core/renderer/types';
import { DirtyLayer, Square, StateSnapshot } from '../../../src/core/state/types';

describe('SvgRenderer coordinates rendering', () => {
	it('renders 16 coordinate labels total (8 ranks + 8 files)', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'white',
			turn: 'white',
			selected: null
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

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'white',
			turn: 'white',
			selected: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// First 8 labels should be rank labels (text-anchor='start')
		const rankLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'start');
		expect(rankLabels.length).toBe(8);

		// Verify labels are "8", "7", "6", "5", "4", "3", "2", "1" in order
		const rankTexts = rankLabels.map((el) => el.textContent);
		expect(rankTexts).toEqual(['8', '7', '6', '5', '4', '3', '2', '1']);

		// Verify they're positioned on a-file squares (visual left edge)
		// a8=56, a7=48, a6=40, a5=32, a4=24, a3=16, a2=8, a1=0
		const expectedSquares: Square[] = [56, 48, 40, 32, 24, 16, 8, 0];
		for (let i = 0; i < 8; i++) {
			const sq = expectedSquares[i];
			const rect = geometry.squareRect(sq);
			const label = rankLabels[i];
			const x = parseFloat(label.getAttribute('x')!);
			const y = parseFloat(label.getAttribute('y')!);
			// Should be near top-left corner of square (with small offset of 3px)
			expect(x).toBeCloseTo(rect.x + 3, 0);
			expect(y).toBeCloseTo(rect.y + 3, 0);
		}

		renderer.unmount();
	});

	it('renders file labels on visual bottom edge for white orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'white',
			turn: 'white',
			selected: null
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// Last 8 labels should be file labels (text-anchor='end')
		const fileLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'end');
		expect(fileLabels.length).toBe(8);

		// Verify labels are "a", "b", "c", "d", "e", "f", "g", "h" in order
		const fileTexts = fileLabels.map((el) => el.textContent);
		expect(fileTexts).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);

		// Verify they're positioned on rank 1 squares (visual bottom edge)
		// a1=0, b1=1, c1=2, d1=3, e1=4, f1=5, g1=6, h1=7
		const expectedSquares: Square[] = [0, 1, 2, 3, 4, 5, 6, 7];
		for (let i = 0; i < 8; i++) {
			const sq = expectedSquares[i];
			const rect = geometry.squareRect(sq);
			const label = fileLabels[i];
			const x = parseFloat(label.getAttribute('x')!);
			const y = parseFloat(label.getAttribute('y')!);
			// Should be near bottom-right corner of square (with small offset of 3px)
			expect(x).toBeCloseTo(rect.x + rect.size - 3, 0);
			expect(y).toBeCloseTo(rect.y + rect.size - 3, 0);
		}

		renderer.unmount();
	});

	it('renders rank labels on visual left edge for black orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'black',
			turn: 'white',
			selected: null
		};

		const geometry = makeRenderGeometry(800, 'black');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// First 8 labels should be rank labels
		const rankLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'start');
		expect(rankLabels.length).toBe(8);

		// Verify labels are "1", "2", "3", "4", "5", "6", "7", "8" in order
		const rankTexts = rankLabels.map((el) => el.textContent);
		expect(rankTexts).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);

		// Verify they're positioned on h-file squares (visual left edge for black)
		// h1=7, h2=15, h3=23, h4=31, h5=39, h6=47, h7=55, h8=63
		const expectedSquares: Square[] = [7, 15, 23, 31, 39, 47, 55, 63];
		for (let i = 0; i < 8; i++) {
			const sq = expectedSquares[i];
			const rect = geometry.squareRect(sq);
			const label = rankLabels[i];
			const x = parseFloat(label.getAttribute('x')!);
			const y = parseFloat(label.getAttribute('y')!);
			// Should be near top-left corner of square (with small offset of 3px)
			expect(x).toBeCloseTo(rect.x + 3, 0);
			expect(y).toBeCloseTo(rect.y + 3, 0);
		}

		renderer.unmount();
	});

	it('renders file labels on visual bottom edge for black orientation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'black',
			turn: 'white',
			selected: null
		};

		const geometry = makeRenderGeometry(800, 'black');
		const invalidation = { layers: DirtyLayer.Board };

		renderer.render(state, geometry, invalidation);

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// Last 8 labels should be file labels
		const fileLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'end');
		expect(fileLabels.length).toBe(8);

		// Verify labels are "h", "g", "f", "e", "d", "c", "b", "a" in order
		const fileTexts = fileLabels.map((el) => el.textContent);
		expect(fileTexts).toEqual(['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']);

		// Verify they're positioned on rank 8 squares (visual bottom edge for black)
		// h8=63, g8=62, f8=61, e8=60, d8=59, c8=58, b8=57, a8=56
		const expectedSquares: Square[] = [63, 62, 61, 60, 59, 58, 57, 56];
		for (let i = 0; i < 8; i++) {
			const sq = expectedSquares[i];
			const rect = geometry.squareRect(sq);
			const label = fileLabels[i];
			const x = parseFloat(label.getAttribute('x')!);
			const y = parseFloat(label.getAttribute('y')!);
			// Should be near bottom-right corner of square (with small offset of 3px)
			expect(x).toBeCloseTo(rect.x + rect.size - 3, 0);
			expect(y).toBeCloseTo(rect.y + rect.size - 3, 0);
		}

		renderer.unmount();
	});

	it('uses square-contrast coloring by default', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'white',
			turn: 'white',
			selected: null
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

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		const state: StateSnapshot = {
			pieces,
			ids,
			orientation: 'white',
			turn: 'white',
			selected: null
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
