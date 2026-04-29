import { describe, expect, it, vi } from 'vitest';
import { createBoardEvents } from '../../../../src/extensions/first-party/board-events/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/board-events/types.js';
import type { RuntimeReadonlyMutationSession } from '../../../../src/runtime/mutation/types.js';
import { PieceCode, RoleCode } from '../../../../src/state/board/types/internal.js';

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

function createFakeUpdateContext(opts: {
	hasMutationCauses?: string[];
	lastMove?: {
		from: number;
		to: number;
		piece: number;
		promotedTo?: number;
		captured?: unknown;
		secondary?: unknown;
	} | null;
}) {
	return {
		previousFrame: null,
		mutation: createMockMutation(opts.hasMutationCauses ?? []),
		currentFrame: {
			isMounted: false,
			state: {
				change: {
					lastMove: opts.lastMove ?? null
				}
			}
		}
	} as never;
}

describe('createBoardEvents', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createBoardEvents();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('events');
	});

	it('createInstance returns an instance with onUpdate and getPublic', () => {
		const def = createBoardEvents();
		const instance = def.createInstance({ runtimeSurface: {} as never });
		expect(instance.id).toBe(EXTENSION_ID);
		expect(instance.onUpdate).toBeDefined();
		expect((instance as { getPublic: () => unknown }).getPublic).toBeDefined();
	});

	describe('public API', () => {
		it('exposes setOnUIMove and setOnRawUpdate', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: unknown; setOnRawUpdate: unknown } }
			).getPublic();
			expect(pub.setOnUIMove).toBeInstanceOf(Function);
			expect(pub.setOnRawUpdate).toBeInstanceOf(Function);
		});
	});

	describe('onRawUpdate callback', () => {
		it('is called on every onUpdate when registered', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnRawUpdate: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnRawUpdate(callback);

			const context = createFakeUpdateContext({});
			instance.onUpdate!(context);

			expect(callback).toHaveBeenCalledTimes(1);
			const arg = callback.mock.calls[0][0];
			expect(arg.previousFrame).toBeNull();
			expect(arg.currentFrame).toBeDefined();
			expect(arg.mutation).toBeDefined();
		});

		it('is not called when not registered', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });

			expect(() => instance.onUpdate!(createFakeUpdateContext({}))).not.toThrow();
		});

		it('can be cleared by setting to null', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnRawUpdate: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnRawUpdate(callback);
			pub.setOnRawUpdate(null);

			instance.onUpdate!(createFakeUpdateContext({}));

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('onUIMove callback', () => {
		it('is called when mutation includes completeCoreDragTo and setLastMove', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			// e2 (12) -> e4 (28) with white pawn (PieceCode.WhitePawn = 1)
			const context = createFakeUpdateContext({
				hasMutationCauses: ['state.change.setLastMove', 'runtime.interaction.completeCoreDragTo'],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback).toHaveBeenCalledTimes(1);
			const move = callback.mock.calls[0][0];
			expect(move.from).toBe('e2');
			expect(move.to).toBe('e4');
			expect(move.piece).toBe('wP');
		});

		it('calls onUIMove for completeExtensionDragTo + setLastMove', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			const context = createFakeUpdateContext({
				hasMutationCauses: [
					'state.change.setLastMove',
					'runtime.interaction.completeExtensionDragTo'
				],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback).toHaveBeenCalledTimes(1);
			const move = callback.mock.calls[0][0];
			expect(move.from).toBe('e2');
			expect(move.to).toBe('e4');
			expect(move.piece).toBe('wP');
		});

		it('calls onUIMove for resolveDeferredUIMoveRequest + setLastMove', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			const context = createFakeUpdateContext({
				hasMutationCauses: [
					'state.change.setLastMove',
					'runtime.interaction.resolveDeferredUIMoveRequest'
				],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback).toHaveBeenCalledTimes(1);
			const move = callback.mock.calls[0][0];
			expect(move.from).toBe('e2');
			expect(move.to).toBe('e4');
			expect(move.piece).toBe('wP');
		});

		it('does not call onUIMove for setLastMove alone', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			const context = createFakeUpdateContext({
				hasMutationCauses: ['state.change.setLastMove'],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback).not.toHaveBeenCalled();
		});

		it('does not call onUIMove for setLastMove + cancelDeferredUIMoveRequest', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			const context = createFakeUpdateContext({
				hasMutationCauses: [
					'state.change.setLastMove',
					'runtime.interaction.cancelDeferredUIMoveRequest'
				],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback).not.toHaveBeenCalled();
		});

		it('is not called when mutation does not include setLastMove', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			const context = createFakeUpdateContext({
				hasMutationCauses: ['state.board.setPosition'],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback).not.toHaveBeenCalled();
		});

		it('is not called when lastMove is null even with correct mutation', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			const context = createFakeUpdateContext({
				hasMutationCauses: ['state.change.setLastMove', 'runtime.interaction.completeCoreDragTo'],
				lastMove: null
			});

			instance.onUpdate!(context);

			expect(callback).not.toHaveBeenCalled();
		});

		it('is not called when callback is not registered', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });

			const context = createFakeUpdateContext({
				hasMutationCauses: ['state.change.setLastMove', 'runtime.interaction.completeCoreDragTo'],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			expect(() => instance.onUpdate!(context)).not.toThrow();
		});

		it('includes promotedTo in the denormalized move when present', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback = vi.fn();
			pub.setOnUIMove(callback);

			// e7 (52) -> e8 (60) with white pawn promoting to queen
			const context = createFakeUpdateContext({
				hasMutationCauses: [
					'state.change.setLastMove',
					'runtime.interaction.resolveDeferredUIMoveRequest'
				],
				lastMove: { from: 52, to: 60, piece: PieceCode.WhitePawn, promotedTo: RoleCode.Queen }
			});

			instance.onUpdate!(context);

			expect(callback).toHaveBeenCalledTimes(1);
			const move = callback.mock.calls[0][0];
			expect(move.from).toBe('e7');
			expect(move.to).toBe('e8');
			expect(move.promotedTo).toBe('Q');
		});

		it('can be replaced by calling setOnUIMove again', () => {
			const def = createBoardEvents();
			const instance = def.createInstance({ runtimeSurface: {} as never });
			const pub = (
				instance as { getPublic: () => { setOnUIMove: (cb: unknown) => void } }
			).getPublic();

			const callback1 = vi.fn();
			const callback2 = vi.fn();
			pub.setOnUIMove(callback1);
			pub.setOnUIMove(callback2);

			const context = createFakeUpdateContext({
				hasMutationCauses: ['state.change.setLastMove', 'runtime.interaction.completeCoreDragTo'],
				lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn }
			});

			instance.onUpdate!(context);

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledTimes(1);
		});
	});
});
