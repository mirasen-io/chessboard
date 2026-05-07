import { describe, expect, it, vi } from 'vitest';
import { createLegalMoves } from '../../../../src/extensions/first-party/legal-moves/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/legal-moves/types.js';
import type { RuntimeReadonlyMutationSession } from '../../../../src/runtime/mutation/types.js';
import { PieceCode } from '../../../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../../../src/state/interaction/types/internal.js';
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

function createPiecesArray(): Uint8Array {
	const pieces = new Uint8Array(64);
	return pieces;
}

function createRenderableUpdateContext(opts: { causes?: string[]; prefixes?: string[] }) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation({ causes: opts.causes, prefixes: opts.prefixes }),
			currentFrame: {
				isMounted: true,
				state: {
					interaction: {
						movability: { mode: MovabilityModeCode.Strict },
						activeDestinations: new Map(),
						selected: null
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
	movabilityMode?: number;
	selectedSquare?: number | null;
	activeDestinations?: Map<number, { to: number }>;
	pieces?: Uint8Array;
	dirtyLayers?: number;
}) {
	const pieces = opts.pieces ?? createPiecesArray();
	return {
		currentFrame: {
			state: {
				board: { pieces },
				interaction: {
					movability: { mode: opts.movabilityMode ?? MovabilityModeCode.Strict },
					activeDestinations: opts.activeDestinations ?? new Map(),
					selected: opts.selectedSquare != null ? { square: opts.selectedSquare } : null
				}
			},
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? 1 }
	} as never;
}

describe('createLegalMoves', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createLegalMoves();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('legalMoves');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const def = createLegalMoves();
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
		it('marks dirty when interaction prefix mutation occurs and frame is renderable', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				prefixes: ['state.interaction.setSelectedSquare']
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('marks dirty on layout.refreshGeometry', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry']
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1);
		});

		it('does not mark dirty when no relevant mutation occurs', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.board.setPosition']
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('render', () => {
		it('renders nothing when there are no active destinations', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: new Map()
				})
			);

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('renders nothing when movability mode is not Strict', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const destinations = new Map([[28, { to: 28 }]]);
			instance.render!(
				createRenderContext({
					movabilityMode: MovabilityModeCode.Free,
					selectedSquare: 12,
					activeDestinations: destinations
				})
			);

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('renders nothing when no square is selected', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const destinations = new Map([[28, { to: 28 }]]);
			instance.render!(
				createRenderContext({
					selectedSquare: null,
					activeDestinations: destinations
				})
			);

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('renders circles for empty-square destinations', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const pieces = createPiecesArray();
			pieces[12] = PieceCode.WhitePawn; // selected piece
			// target squares are empty (PieceCode.Empty = 0)

			const destinations = new Map([
				[20, { to: 20 }],
				[28, { to: 28 }]
			]);
			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: destinations,
					pieces
				})
			);

			expect(roots.overPieces.children.length).toBe(2);
			expect(roots.overPieces.children[0].tagName).toBe('circle');
			expect(roots.overPieces.children[0].getAttribute('data-chessboard-id')).toBe(
				'legal-move-from-20-to-20'
			);
			expect(roots.overPieces.children[1].getAttribute('data-chessboard-id')).toBe(
				'legal-move-from-28-to-28'
			);
		});

		it('renders capture-style circles when target has opponent piece', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const pieces = createPiecesArray();
			pieces[12] = PieceCode.WhitePawn; // selected piece (white)
			pieces[21] = PieceCode.BlackPawn; // target has black piece (capture)

			const destinations = new Map([[21, { to: 21 }]]);
			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: destinations,
					pieces
				})
			);

			expect(roots.overPieces.children.length).toBe(1);
			const circle = roots.overPieces.children[0];
			expect(circle.tagName).toBe('circle');
			// Capture targets have stroke instead of fill
			expect(circle.getAttribute('fill')).toBe('none');
			expect(circle.getAttribute('stroke')).toBeDefined();
		});

		it('clears previous circles on re-render', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const pieces = createPiecesArray();
			pieces[12] = PieceCode.WhitePawn;

			const destinations = new Map([[28, { to: 28 }]]);
			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: destinations,
					pieces
				})
			);
			expect(roots.overPieces.children.length).toBe(1);

			// Re-render with no destinations
			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: new Map()
				})
			);
			expect(roots.overPieces.children.length).toBe(0);
		});
	});

	describe('lifecycle', () => {
		it('unmount clears slot root children', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const pieces = createPiecesArray();
			pieces[12] = PieceCode.WhitePawn;
			const destinations = new Map([[28, { to: 28 }]]);
			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: destinations,
					pieces
				})
			);

			instance.unmount!();

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('destroy clears slot root children', () => {
			const def = createLegalMoves();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			const pieces = createPiecesArray();
			pieces[12] = PieceCode.WhitePawn;
			const destinations = new Map([[28, { to: 28 }]]);
			instance.render!(
				createRenderContext({
					selectedSquare: 12,
					activeDestinations: destinations,
					pieces
				})
			);

			instance.destroy!();

			expect(roots.overPieces.children.length).toBe(0);
		});
	});
});
