import { describe, expect, it, vi } from 'vitest';
import { createMainRendererBoard } from '../../../../../src/extensions/first-party/main-renderer/board/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import type { RuntimeReadonlyMutationSession } from '../../../../../src/runtime/mutation/types.js';
import type { RuntimeStateSnapshot } from '../../../../../src/state/types.js';

function createMockMutation(hasCauses: string[] = []): RuntimeReadonlyMutationSession {
	return {
		hasMutation(match?: { causes?: Iterable<string> }) {
			if (!match || !match.causes) return hasCauses.length > 0;
			for (const cause of match.causes) {
				if (hasCauses.includes(cause)) return true;
			}
			return false;
		},
		getPayloads: vi.fn(() => undefined),
		getAll: vi.fn(() => new Map())
	} as unknown as RuntimeReadonlyMutationSession;
}

function createGeometry(opts: { boardRect?: object; orientation?: number } = {}) {
	return {
		sceneSize: { width: 400, height: 400 },
		boardRect: opts.boardRect ?? { x: 0, y: 0, width: 400, height: 400 },
		squareSize: 50,
		orientation: opts.orientation ?? 0,
		getSquareRect: (sq: number) => ({
			x: (sq % 8) * 50,
			y: Math.floor(sq / 8) * 50,
			width: 50,
			height: 50
		})
	};
}

function createUpdateContext(opts: {
	causes?: string[];
	currentGeometry?: ReturnType<typeof createGeometry>;
	previousGeometry?: ReturnType<typeof createGeometry> | null;
	isMounted?: boolean;
}) {
	const markDirty = vi.fn();
	const currentGeometry = opts.currentGeometry ?? createGeometry();
	const isMounted = opts.isMounted ?? true;
	const hasGeometry = isMounted && currentGeometry !== null;

	return {
		context: {
			previousFrame:
				opts.previousGeometry !== undefined
					? opts.previousGeometry !== null
						? {
								isMounted: true,
								state: {} as RuntimeStateSnapshot,
								layout: { geometry: opts.previousGeometry }
							}
						: null
					: null,
			mutation: createMockMutation(opts.causes ?? []),
			currentFrame: {
				isMounted,
				state: {} as RuntimeStateSnapshot,
				layout: hasGeometry
					? {
							sceneSize: { width: 400, height: 400 },
							orientation: 0,
							geometry: currentGeometry,
							layoutEpoch: 1
						}
					: { sceneSize: null, orientation: null, geometry: null, layoutEpoch: 0 }
			},
			invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		markDirty
	};
}

function createRenderContext(opts: { dirtyLayers?: number }) {
	return {
		currentFrame: {
			state: {} as RuntimeStateSnapshot,
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? DirtyLayer.Board }
	} as never;
}

function createLayer(): SVGGElement {
	return document.createElementNS('http://www.w3.org/2000/svg', 'g');
}

describe('createMainRendererBoard', () => {
	describe('onUpdate', () => {
		it('marks Board | Coordinates dirty when geometry changes due to layout.refreshGeometry', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const { context, markDirty } = createUpdateContext({
				causes: ['layout.refreshGeometry'],
				currentGeometry: createGeometry({ boardRect: { x: 0, y: 0, width: 400, height: 400 } }),
				previousGeometry: null
			});

			board.onUpdate(context);

			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Board | DirtyLayer.Coordinates);
		});

		it('does not mark dirty when mutation is not layout.refreshGeometry', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const { context, markDirty } = createUpdateContext({
				causes: ['state.board.setPosition'],
				currentGeometry: createGeometry()
			});

			board.onUpdate(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('does not mark dirty when context is not renderable (no geometry)', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const { context, markDirty } = createUpdateContext({
				causes: ['layout.refreshGeometry'],
				isMounted: false
			});

			board.onUpdate(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('does not mark dirty when board rect and orientation are unchanged', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const geo = createGeometry({
				boardRect: { x: 0, y: 0, width: 400, height: 400 },
				orientation: 0
			});
			const { context, markDirty } = createUpdateContext({
				causes: ['layout.refreshGeometry'],
				currentGeometry: geo,
				previousGeometry: geo
			});

			board.onUpdate(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('marks dirty when board rect changes', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const { context, markDirty } = createUpdateContext({
				causes: ['layout.refreshGeometry'],
				currentGeometry: createGeometry({ boardRect: { x: 0, y: 0, width: 800, height: 800 } }),
				previousGeometry: createGeometry({ boardRect: { x: 0, y: 0, width: 400, height: 400 } })
			});

			board.onUpdate(context);

			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Board | DirtyLayer.Coordinates);
		});

		it('marks dirty when orientation changes', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const { context, markDirty } = createUpdateContext({
				causes: ['layout.refreshGeometry'],
				currentGeometry: createGeometry({ orientation: 8 }),
				previousGeometry: createGeometry({ orientation: 0 })
			});

			board.onUpdate(context);

			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Board | DirtyLayer.Coordinates);
		});
	});

	describe('render', () => {
		it('no-ops when Board dirty layer is not set', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const layer = createLayer();
			layer.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

			board.render(createRenderContext({ dirtyLayers: DirtyLayer.Pieces }), layer);

			expect(layer.children.length).toBe(1); // unchanged
		});

		it('clears previous children and creates 64 square rects', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const layer = createLayer();
			layer.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

			board.render(createRenderContext({ dirtyLayers: DirtyLayer.Board }), layer);

			expect(layer.children.length).toBe(64);
		});

		it('square rects have correct data-chessboard-id attributes', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const layer = createLayer();

			board.render(createRenderContext({ dirtyLayers: DirtyLayer.Board }), layer);

			expect(layer.children[0].getAttribute('data-chessboard-id')).toBe('square-0');
			expect(layer.children[63].getAttribute('data-chessboard-id')).toBe('square-63');
		});

		it('square rects use configured light/dark colors', () => {
			const board = createMainRendererBoard(() => ({ light: '#aaa', dark: '#333' }));
			const layer = createLayer();

			board.render(createRenderContext({ dirtyLayers: DirtyLayer.Board }), layer);

			// Square 0 (a1) is dark, square 1 (b1) is light
			expect(layer.children[0].getAttribute('fill')).toBe('#333');
			expect(layer.children[1].getAttribute('fill')).toBe('#aaa');
		});

		it('square rects use geometry square rectangles', () => {
			const board = createMainRendererBoard(() => ({ light: '#fff', dark: '#000' }));
			const layer = createLayer();

			board.render(createRenderContext({ dirtyLayers: DirtyLayer.Board }), layer);

			const firstRect = layer.children[0];
			expect(firstRect.getAttribute('x')).toBe('0');
			expect(firstRect.getAttribute('y')).toBe('0');
			expect(firstRect.getAttribute('width')).toBe('50');
			expect(firstRect.getAttribute('height')).toBe('50');
		});
	});
});
