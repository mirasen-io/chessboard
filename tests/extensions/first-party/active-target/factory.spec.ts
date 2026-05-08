import { describe, expect, it, vi } from 'vitest';
import { createActiveTarget } from '../../../../src/extensions/first-party/active-target/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/active-target/types.js';
import type { RuntimeReadonlyMutationSession } from '../../../../src/runtime/mutation/types.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

function createMockMutation(
	opts: { causes?: string[]; prefixes?: string[] } = {}
): RuntimeReadonlyMutationSession {
	return {
		hasMutation(match?: { causes?: Iterable<string>; prefixes?: Iterable<string> }) {
			if (!match) return false;
			if (match.causes) {
				for (const cause of match.causes) {
					if (opts.causes?.includes(cause)) return true;
				}
			}
			if (match.prefixes) {
				for (const prefix of match.prefixes) {
					if (opts.prefixes?.some((p) => p.startsWith(prefix))) return true;
				}
			}
			return false;
		},
		getPayloads: vi.fn(() => undefined),
		getAll: vi.fn(() => new Map())
	} as unknown as RuntimeReadonlyMutationSession;
}

function createSlotRoots() {
	return {
		underPieces: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
		overPieces: document.createElementNS('http://www.w3.org/2000/svg', 'g')
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

function createCoreDragSession(targetSquare: number) {
	return {
		owner: 'core',
		type: 'lifted-piece-drag',
		sourceSquare: 0,
		sourcePieceCode: 1,
		targetSquare
	};
}

function createRenderableUpdateContext(opts: {
	causes?: string[];
	prefixes?: string[];
	targetSquare?: number | null;
	dragSession?: unknown;
}) {
	const markDirty = vi.fn();
	const dragSession =
		opts.dragSession !== undefined
			? opts.dragSession
			: opts.targetSquare != null
				? createCoreDragSession(opts.targetSquare)
				: null;
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation({ causes: opts.causes, prefixes: opts.prefixes }),
			currentFrame: {
				isMounted: true,
				state: {
					interaction: {
						dragSession
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
	targetSquare?: number | null;
	dirtyLayers?: number;
	dragSession?: unknown;
}) {
	const dragSession =
		opts.dragSession !== undefined
			? opts.dragSession
			: opts.targetSquare != null
				? createCoreDragSession(opts.targetSquare)
				: null;
	return {
		currentFrame: {
			state: {
				interaction: {
					dragSession
				}
			},
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? 1 }
	} as never;
}

function createInstance() {
	const def = createActiveTarget();
	return def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
	);
}

describe('createActiveTarget', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createActiveTarget();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('activeTarget');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const instance = createInstance();
		expect(instance.id).toBe(EXTENSION_ID);
		expect(instance.mount).toBeDefined();
		expect(instance.unmount).toBeDefined();
		expect(instance.destroy).toBeDefined();
		expect(instance.onUpdate).toBeDefined();
		expect(instance.render).toBeDefined();
	});

	describe('onUpdate invalidation', () => {
		it('marks dirty when interaction prefix mutation occurs and frame is renderable', () => {
			const instance = createInstance();
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				prefixes: ['state.interaction.setDrag'],
				targetSquare: 4
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('marks dirty on layout.refreshGeometry with core drag session', () => {
			const instance = createInstance();
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry'],
				targetSquare: 4
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('marks dirty when drag session is null (cleanup case)', () => {
			const instance = createInstance();
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				prefixes: ['state.interaction.clear'],
				targetSquare: null
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('does not mark dirty when no relevant mutation occurs', () => {
			const instance = createInstance();
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.board.setPosition'],
				targetSquare: 4
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('does not mark dirty for extension-owned drag session', () => {
			const instance = createInstance();
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				prefixes: ['state.interaction.setDrag'],
				dragSession: {
					owner: 'annotations',
					type: 'ext:idle-clear',
					sourceSquare: 4,
					sourcePieceCode: null,
					targetSquare: 4
				}
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('render', () => {
		it('renders nothing when there is no active target', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ targetSquare: null }));

			expect(roots.underPieces.children.length).toBe(0);
			expect(roots.overPieces.children.length).toBe(0);
		});

		it('renders a rect and circle when active target exists', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ targetSquare: 0 }));

			expect(roots.underPieces.children.length).toBe(1);
			expect(roots.overPieces.children.length).toBe(1);
			expect(roots.underPieces.children[0].tagName).toBe('rect');
			expect(roots.underPieces.children[0].getAttribute('data-chessboard-id')).toBe(
				'active-target-square-highlight'
			);
			expect(roots.overPieces.children[0].tagName).toBe('circle');
			expect(roots.overPieces.children[0].getAttribute('data-chessboard-id')).toBe(
				'active-target-halo'
			);
		});

		it('removes visuals when active target becomes null', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ targetSquare: 4 }));
			expect(roots.underPieces.children.length).toBe(1);

			instance.render!(createRenderContext({ targetSquare: null }));
			expect(roots.underPieces.children.length).toBe(0);
			expect(roots.overPieces.children.length).toBe(0);
		});

		it('updates positions when target square changes', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({ targetSquare: 0 }));
			const rect = roots.underPieces.children[0];
			expect(rect.getAttribute('x')).toBe('0');

			instance.render!(createRenderContext({ targetSquare: 3 }));
			expect(rect.getAttribute('x')).toBe('150');
		});

		it('renders nothing for extension-owned drag session', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(
				createRenderContext({
					dragSession: {
						owner: 'annotations',
						type: 'ext:idle-clear',
						sourceSquare: 4,
						sourcePieceCode: null,
						targetSquare: 4
					}
				})
			);

			expect(roots.underPieces.children.length).toBe(0);
			expect(roots.overPieces.children.length).toBe(0);
		});
	});

	describe('lifecycle', () => {
		it('unmount clears slot root children', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({ targetSquare: 4 }));

			instance.unmount!();

			expect(roots.underPieces.children.length).toBe(0);
			expect(roots.overPieces.children.length).toBe(0);
		});

		it('destroy clears slot root children', () => {
			const instance = createInstance();
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({ targetSquare: 4 }));

			instance.destroy!();

			expect(roots.underPieces.children.length).toBe(0);
			expect(roots.overPieces.children.length).toBe(0);
		});
	});
});
