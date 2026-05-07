import { describe, expect, it, vi } from 'vitest';
import { createSelectedSquare } from '../../../../src/extensions/first-party/selected-square/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/selected-square/types.js';
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
	selectedSquare?: number | null;
}) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation(opts.causes ?? []),
			currentFrame: {
				isMounted: true,
				state: {
					interaction: {
						selected: opts.selectedSquare != null ? { square: opts.selectedSquare } : null
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

function createRenderContext(opts: { selectedSquare?: number | null; dirtyLayers?: number }) {
	return {
		currentFrame: {
			state: {
				interaction: {
					selected: opts.selectedSquare != null ? { square: opts.selectedSquare } : null
				}
			},
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? 1 }
	} as never;
}

describe('createSelectedSquare', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createSelectedSquare();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('selectedSquare');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const def = createSelectedSquare();
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
		it('marks dirty when selected square mutation occurs and frame is renderable', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.interaction.setSelectedSquare'],
				selectedSquare: 4
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1); // DirtyLayer.Highlight = 1
		});

		it('marks dirty on state.interaction.clear', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.interaction.clear'],
				selectedSquare: null
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('marks dirty on layout.refreshGeometry', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry'],
				selectedSquare: 4
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('does not mark dirty when no relevant mutation occurs', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.board.setPosition'],
				selectedSquare: 4
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('render', () => {
		it('renders nothing when there is no selected square', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ selectedSquare: null }));

			expect(roots.underPieces.children.length).toBe(0);
		});

		it('renders a rect when selected square exists', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ selectedSquare: 0 }));

			expect(roots.underPieces.children.length).toBe(1);
			const rect = roots.underPieces.children[0];
			expect(rect.tagName).toBe('rect');
			expect(rect.getAttribute('data-chessboard-id')).toBe('selected-square-highlight');
		});

		it('removes the rect when selected square becomes null', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ selectedSquare: 4 }));
			expect(roots.underPieces.children.length).toBe(1);

			instance.render!(createRenderContext({ selectedSquare: null }));
			expect(roots.underPieces.children.length).toBe(0);
		});

		it('updates the rect position when selected square changes', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ selectedSquare: 0 }));
			const rect = roots.underPieces.children[0];
			expect(rect.getAttribute('x')).toBe('0');

			instance.render!(createRenderContext({ selectedSquare: 3 }));
			expect(rect.getAttribute('x')).toBe('150');
		});
	});

	describe('lifecycle', () => {
		it('unmount clears slot root children', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({ selectedSquare: 4 }));

			instance.unmount!();

			expect(roots.underPieces.children.length).toBe(0);
		});

		it('destroy clears slot root children', () => {
			const def = createSelectedSquare();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({ selectedSquare: 4 }));

			instance.destroy!();

			expect(roots.underPieces.children.length).toBe(0);
		});
	});
});
