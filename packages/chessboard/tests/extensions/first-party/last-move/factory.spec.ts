import { describe, expect, it, vi } from 'vitest';
import { createLastMove } from '../../../../src/extensions/first-party/last-move/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/last-move/types.js';
import type { RuntimeReadonlyMutationSession } from '../../../../src/runtime/mutation/types.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

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

function createSlotRoots() {
	return {
		underPieces: document.createElementNS('http://www.w3.org/2000/svg', 'g')
	};
}

function createGeometry() {
	return {
		sceneSize: { width: 400, height: 400 },
		boardRect: { x: 0, y: 0, width: 400, height: 400 },
		squareSize: 50,
		orientation: 0,
		getSquareRect: (sq: number) => ({
			x: (sq % 8) * 50,
			y: Math.floor(sq / 8) * 50,
			width: 50,
			height: 50
		})
	};
}

function createRenderableUpdateContext(opts: {
	causes?: string[];
	lastMove?: { from: number; to: number } | null;
}) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation(opts.causes ?? []),
			currentFrame: {
				isMounted: true,
				state: {
					change: {
						lastMove: opts.lastMove ?? null
					}
				},
				layout: {
					sceneSize: { width: 400, height: 400 },
					orientation: 0,
					geometry: createGeometry(),
					layoutEpoch: 1
				}
			},
			invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		markDirty
	};
}

function createRenderContext(opts: {
	lastMove?: { from: number; to: number } | null;
	dirtyLayers?: number;
}) {
	return {
		currentFrame: {
			state: {
				change: {
					lastMove: opts.lastMove ?? null
				}
			},
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? 1 }
	} as never;
}

describe('createLastMove', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createLastMove();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('lastMove');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const def = createLastMove();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
		);
		expect(instance.id).toBe(EXTENSION_ID);
		expect(instance.mount).toBeDefined();
		expect(instance.unmount).toBeDefined();
		expect(instance.destroy).toBeDefined();
		expect(instance.onUpdate).toBeDefined();
		expect(instance.render).toBeDefined();
	});

	describe('onUpdate invalidation', () => {
		it('marks dirty when setLastMove mutation occurs and frame is renderable', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.change.setLastMove'],
				lastMove: { from: 12, to: 28 }
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1); // DirtyLayer.Highlight = 1
		});

		it('marks dirty on layout.refreshGeometry', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry'],
				lastMove: { from: 12, to: 28 }
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('does not mark dirty when no relevant mutation occurs', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.board.setPosition'],
				lastMove: { from: 12, to: 28 }
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('render', () => {
		it('renders nothing when there is no last move', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ lastMove: null }));

			expect(roots.underPieces.children.length).toBe(0);
		});

		it('renders two rects when last move exists', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			// e2 (12) -> e4 (28)
			instance.render!(createRenderContext({ lastMove: { from: 12, to: 28 } }));

			expect(roots.underPieces.children.length).toBe(2);
			const rectFrom = roots.underPieces.children[0];
			const rectTo = roots.underPieces.children[1];
			expect(rectFrom.tagName).toBe('rect');
			expect(rectTo.tagName).toBe('rect');
			expect(rectFrom.getAttribute('data-chessboard-id')).toBe('last-move-square-from-highlight');
			expect(rectTo.getAttribute('data-chessboard-id')).toBe('last-move-square-to-highlight');
		});

		it('removes rects when last move becomes null', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ lastMove: { from: 12, to: 28 } }));
			expect(roots.underPieces.children.length).toBe(2);

			instance.render!(createRenderContext({ lastMove: null }));
			expect(roots.underPieces.children.length).toBe(0);
		});

		it('updates rect positions when last move changes', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ lastMove: { from: 0, to: 8 } }));
			const rectFrom = roots.underPieces.children[0];
			expect(rectFrom.getAttribute('x')).toBe('0');
			expect(rectFrom.getAttribute('y')).toBe('0');

			// Change to d2 (3) -> d4 (19)
			instance.render!(createRenderContext({ lastMove: { from: 3, to: 19 } }));
			expect(rectFrom.getAttribute('x')).toBe('150');
		});
	});

	describe('lifecycle', () => {
		it('unmount clears slot root children', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({ lastMove: { from: 12, to: 28 } }));

			instance.unmount!();

			expect(roots.underPieces.children.length).toBe(0);
		});

		it('destroy clears slot root children', () => {
			const def = createLastMove();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({ lastMove: { from: 12, to: 28 } }));

			instance.destroy!();

			expect(roots.underPieces.children.length).toBe(0);
		});
	});
});
