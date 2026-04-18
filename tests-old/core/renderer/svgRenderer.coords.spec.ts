import { describe, expect, it } from 'vitest';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { DEFAULT_RENDER_CONFIG } from '../../../src/core/renderer/types';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot } from '../../../src/core/state/boardTypes';

/** Minimal board snapshot for coordinate rendering tests (no pieces needed) */
const emptyBoard: BoardStateSnapshot = {
	pieces: new Uint8Array(64),
	ids: new Int16Array(64).fill(-1),
	turn: 'white',
	positionEpoch: 0
};

describe('SvgRenderer coordinates rendering', () => {
	it('renders 16 coordinate labels total (8 ranks + 8 files)', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

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

		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		const rankLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'start');
		expect(rankLabels.length).toBe(8);

		// Rank labels "8" through "1" map to squares a8 through a1
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

		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		const fileLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'end');
		expect(fileLabels.length).toBe(8);

		// File labels "a" through "h" map to squares a1 through h1
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

		// Orientation is passed via geometry, not board snapshot
		const geometry = makeRenderGeometry(800, 'black');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		const rankLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'start');
		expect(rankLabels.length).toBe(8);

		// Rank labels "1" through "8" map to squares h1 through h8
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

		// Orientation is passed via geometry, not board snapshot
		const geometry = makeRenderGeometry(800, 'black');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		const fileLabels = labels.filter((el) => el.getAttribute('text-anchor') === 'end');
		expect(fileLabels.length).toBe(8);

		// File labels "h" through "a" map to squares h8 through a8
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

		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// a8 (sq=56) is light square → dark text for contrast
		const a8Label = labels.find((el) => el.textContent === '8');
		expect(a8Label?.getAttribute('fill')).toBe(DEFAULT_RENDER_CONFIG.coords?.dark);

		// a1 (sq=0) is dark square → light text for contrast
		const a1Label = labels.find((el) => el.textContent === '1');
		expect(a1Label?.getAttribute('fill')).toBe(DEFAULT_RENDER_CONFIG.coords?.light);

		renderer.unmount();
	});

	it('uses explicit RenderConfig.coords when provided', () => {
		const opts = {
			config: {
				coords: {
					light: '#ff0000',
					dark: '#00ff00'
				}
			}
		};
		const renderer = new SvgRenderer(opts);
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board: emptyBoard,
			invalidation: { layers: DirtyLayer.Board, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		const labels = Array.from(coordsRoot.querySelectorAll('text'));

		// a8 (sq=56) is light square → coords.dark text
		const a8Label = labels.find((el) => el.textContent === '8');
		expect(a8Label?.getAttribute('fill')).toBe(opts.config?.coords?.dark);

		// a1 (sq=0) is dark square → coords.light text
		const a1Label = labels.find((el) => el.textContent === '1');
		expect(a1Label?.getAttribute('fill')).toBe(opts.config?.coords?.light);

		renderer.unmount();
	});
});
