import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionPendingUIMoveRequestContext } from '../../../src/extensions/types/context/ui-move.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import type { Runtime } from '../../../src/runtime/types/main.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, RoleCode } from '../../../src/state/board/types/internal.js';

// ResizeObserver stub that calls the callback synchronously on observe
let resizeCallback: (() => void) | null = null;
class ResizeObserverStub {
	observe = vi.fn(() => {
		if (resizeCallback) resizeCallback();
	});
	unobserve = vi.fn();
	disconnect = vi.fn();
}

// Track runtimes for cleanup
let activeRuntime: Runtime | null = null;

beforeEach(() => {
	resizeCallback = null;
	vi.stubGlobal('ResizeObserver', function (cb: () => void) {
		resizeCallback = cb;
		return new ResizeObserverStub();
	});
	vi.useFakeTimers();
});

afterEach(() => {
	if (activeRuntime && activeRuntime.status !== 'destroyed') {
		activeRuntime.destroy();
	}
	activeRuntime = null;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function createDeferringExtension(): AnyExtensionDefinition {
	return {
		id: 'defer-ext',
		slots: [],
		createInstance() {
			return {
				id: 'defer-ext',
				onUIMoveRequest(context: ExtensionPendingUIMoveRequestContext) {
					context.request.defer();
				}
			} as unknown as AnyExtensionInstance;
		}
	};
}

function createMountedContainer(): HTMLElement {
	const container = document.createElement('div');
	Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
	Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
	container.setPointerCapture = vi.fn();
	container.releasePointerCapture = vi.fn();
	container.hasPointerCapture = vi.fn(() => false);
	container.getBoundingClientRect = vi.fn(() => new DOMRect(0, 0, 400, 400));
	return container;
}

/**
 * Square coordinate helper for white orientation, 400x400 board, 50px squares.
 * file: a=0..h=7, rank: 1=0..8=7
 * x = file * 50 + 25 (center of square)
 * y = (7 - rank) * 50 + 25
 */
function squareCenter(file: number, rank: number) {
	return { x: file * 50 + 25, y: (7 - rank) * 50 + 25 };
}

function dispatchPointerDown(container: HTMLElement, x: number, y: number) {
	container.dispatchEvent(
		new PointerEvent('pointerdown', {
			clientX: x,
			clientY: y,
			pointerId: 1,
			isPrimary: true,
			button: 0,
			bubbles: true
		})
	);
}

function dispatchPointerUp(container: HTMLElement, x: number, y: number) {
	container.dispatchEvent(
		new PointerEvent('pointerup', {
			clientX: x,
			clientY: y,
			pointerId: 1,
			isPrimary: true,
			button: 0,
			bubbles: true
		})
	);
}

/**
 * Creates a runtime with deferred extension, free movability, and standard position.
 * Used for cancel tests (non-promotion e2→e4 scenario).
 */
function createFreeModeRuntime(): { runtime: Runtime; container: HTMLElement } {
	const runtime = createRuntime({
		element: document.createElement('div'),
		extensions: [createDeferringExtension()]
	});
	activeRuntime = runtime;
	runtime.setMovability({ mode: 'free' });
	const container = createMountedContainer();
	runtime.mount(container);
	return { runtime, container };
}

/**
 * Creates a runtime with deferred extension, strict movability for promotion,
 * and a custom position with wP on e7 targeting e8 with promotion options.
 * Used for resolve tests (real promotion scenario).
 */
function createPromotionRuntime(): { runtime: Runtime; container: HTMLElement } {
	const runtime = createRuntime({
		element: document.createElement('div'),
		extensions: [createDeferringExtension()]
	});
	activeRuntime = runtime;
	runtime.setPosition({ pieces: { e7: 'wP' }, turn: 'white' });
	runtime.setMovability({
		mode: 'strict',
		destinations: {
			e7: [{ to: 'e8', promotedTo: ['Q', 'R', 'B', 'N'] }]
		}
	});
	runtime.select('e7');

	const container = createMountedContainer();
	runtime.mount(container);
	return { runtime, container };
}

/**
 * Triggers deferred move e2→e4 (free mode, no promotion).
 */
function triggerFreeDeferredMove(container: HTMLElement) {
	const source = squareCenter(4, 1); // e2: file=4, rank=1
	const target = squareCenter(4, 3); // e4: file=4, rank=3
	dispatchPointerDown(container, source.x, source.y);
	dispatchPointerUp(container, target.x, target.y);
}

/**
 * Triggers deferred move e7→e8 (strict mode, promotion scenario).
 */
function triggerPromotionDeferredMove(container: HTMLElement) {
	const source = squareCenter(4, 6); // e7: file=4, rank=6
	const target = squareCenter(4, 7); // e8: file=4, rank=7
	dispatchPointerDown(container, source.x, source.y);
	dispatchPointerUp(container, target.x, target.y);
}

describe('runtime deferred UI move commands', () => {
	describe('resolveDeferredUIMoveRequest', () => {
		it('throws without pending deferred request', () => {
			const runtime = createRuntime({ element: document.createElement('div') });
			activeRuntime = runtime;
			expect(() => runtime.resolveDeferredUIMoveRequest({ promotedTo: RoleCode.Queen })).toThrow();
		});

		it('resolves a promotion deferred request: returns Move with correct from/to', () => {
			const { runtime, container } = createPromotionRuntime();
			triggerPromotionDeferredMove(container);

			const snapshotBefore = runtime.getSnapshot();
			expect(snapshotBefore.state.change.deferredUIMoveRequest).not.toBeNull();

			const move = runtime.resolveDeferredUIMoveRequest({ promotedTo: RoleCode.Queen });

			expect(move.from).toBe(normalizeSquare('e7'));
			expect(move.to).toBe(normalizeSquare('e8'));
			expect(move.piece).toBe(PieceCode.WhitePawn);
			expect(move.promotedTo).toBe(RoleCode.Queen);
		});

		it('commits the promotion board move: queen appears on target, source is empty', () => {
			const { runtime, container } = createPromotionRuntime();
			triggerPromotionDeferredMove(container);

			runtime.resolveDeferredUIMoveRequest({ promotedTo: RoleCode.Queen });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.board.pieces[normalizeSquare('e7')]).toBe(PieceCode.Empty);
			expect(snapshot.state.board.pieces[normalizeSquare('e8')]).toBe(PieceCode.WhiteQueen);
		});

		it('clears deferred request after resolve', () => {
			const { runtime, container } = createPromotionRuntime();
			triggerPromotionDeferredMove(container);

			runtime.resolveDeferredUIMoveRequest({ promotedTo: RoleCode.Queen });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.change.deferredUIMoveRequest).toBeNull();
		});

		it('sets lastMove after resolve', () => {
			const { runtime, container } = createPromotionRuntime();
			triggerPromotionDeferredMove(container);

			runtime.resolveDeferredUIMoveRequest({ promotedTo: RoleCode.Queen });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.change.lastMove).not.toBeNull();
			expect(snapshot.state.change.lastMove!.from).toBe(normalizeSquare('e7'));
			expect(snapshot.state.change.lastMove!.to).toBe(normalizeSquare('e8'));
		});
	});

	describe('cancelDeferredUIMoveRequest', () => {
		it('throws without pending deferred request', () => {
			const runtime = createRuntime({ element: document.createElement('div') });
			activeRuntime = runtime;
			expect(() => runtime.cancelDeferredUIMoveRequest()).toThrow();
		});

		it('returns true when cancelling a pending deferred request', () => {
			const { runtime, container } = createFreeModeRuntime();
			triggerFreeDeferredMove(container);

			expect(runtime.getSnapshot().state.change.deferredUIMoveRequest).not.toBeNull();
			const result = runtime.cancelDeferredUIMoveRequest();
			expect(result).toBe(true);
		});

		it('clears deferred request after cancel', () => {
			const { runtime, container } = createFreeModeRuntime();
			triggerFreeDeferredMove(container);

			runtime.cancelDeferredUIMoveRequest();

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.change.deferredUIMoveRequest).toBeNull();
		});

		it('does not move the board: source still has piece, target is empty', () => {
			const { runtime, container } = createFreeModeRuntime();
			triggerFreeDeferredMove(container);

			runtime.cancelDeferredUIMoveRequest();

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.board.pieces[normalizeSquare('e2')]).toBe(PieceCode.WhitePawn);
			expect(snapshot.state.board.pieces[normalizeSquare('e4')]).toBe(PieceCode.Empty);
		});
	});
});
