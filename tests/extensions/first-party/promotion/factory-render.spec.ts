import { describe, expect, it, vi } from 'vitest';
import { createPromotion } from '../../../../src/extensions/first-party/promotion/factory.js';
import type { ExtensionRuntimeSurface } from '../../../../src/extensions/types/surface/main.js';
import { RoleCode } from '../../../../src/state/board/types/internal.js';

function createMockRuntimeSurface() {
	return {
		commands: {
			resolveDeferredUIMoveRequest: vi.fn(),
			cancelDeferredUIMoveRequest: vi.fn()
		},
		animation: {} as never,
		events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
		transientVisuals: { subscribe: vi.fn(), unsubscribe: vi.fn() }
	} as unknown as ExtensionRuntimeSurface;
}

function createSlotRoots() {
	return { animation: document.createElementNS('http://www.w3.org/2000/svg', 'g') };
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

function createRenderContext(opts: {
	deferredUIMoveRequest?: {
		destination: { to: number; promotedTo?: number[] };
	} | null;
	dirtyLayers?: number;
}) {
	return {
		currentFrame: {
			state: { change: { deferredUIMoveRequest: opts.deferredUIMoveRequest ?? null } },
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? 1 }
	} as never;
}

function createTransientVisualsContext(opts: { target: number | null }) {
	return {
		transientInput: { target: opts.target },
		currentFrame: { layout: { geometry: createGeometry() } }
	} as never;
}

function createEventContext(opts: { type: string; targetSquare?: number | null }) {
	const rawEvent = new Event(opts.type);
	rawEvent.preventDefault = vi.fn();
	return {
		context: {
			rawEvent,
			sceneEvent: opts.targetSquare !== undefined ? { targetSquare: opts.targetSquare } : null
		} as never,
		preventDefault: rawEvent.preventDefault as ReturnType<typeof vi.fn>
	};
}

// White promotion: e8 (square 60, file 4, rank 7)
const WHITE_PROMO_REQUEST = {
	destination: {
		to: 60,
		promotedTo: [RoleCode.Queen, RoleCode.Rook, RoleCode.Bishop, RoleCode.Knight]
	}
};

// Black promotion: e1 (square 4, file 4, rank 0)
const BLACK_PROMO_REQUEST = {
	destination: {
		to: 4,
		promotedTo: [RoleCode.Queen, RoleCode.Rook, RoleCode.Bishop, RoleCode.Knight]
	}
};

function createMountedInstance() {
	const def = createPromotion();
	const surface = createMockRuntimeSurface();
	const instance = def.createInstance({ runtimeSurface: surface });
	const roots = createSlotRoots();
	instance.mount!({ slotRoots: roots } as never);
	return { instance, surface, roots };
}

describe('promotion render', () => {
	it('cleans existing nodes when deferredUIMoveRequest is null', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));
		expect(roots.animation.children.length).toBeGreaterThan(0);

		instance.render!(createRenderContext({ deferredUIMoveRequest: null }));
		expect(roots.animation.children.length).toBe(0);
	});

	it('creates background rects and piece images for each promotion role', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		// 4 roles × 2 elements (rect + image) = 8 children
		expect(roots.animation.children.length).toBe(8);
	});

	it('sorts roles descending so queen appears first', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		// First pair should be queen (RoleCode.Queen = 5)
		expect(roots.animation.children[0].getAttribute('data-chessboard-id')).toBe('promotion-bg-5');
		expect(roots.animation.children[1].getAttribute('data-chessboard-id')).toBe(
			'promotion-piece-5'
		);
	});

	it('white promotion cascades downward from rank 7', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		// Queen at rank 7 (y = 7*50 = 350), Rook at rank 6 (y = 6*50 = 300)
		expect(roots.animation.children[0].getAttribute('y')).toBe('350');
		expect(roots.animation.children[2].getAttribute('y')).toBe('300');
	});

	it('black promotion cascades upward from rank 0', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: BLACK_PROMO_REQUEST }));

		// Queen at rank 0 (y = 0*50 = 0), Rook at rank 1 (y = 1*50 = 50)
		expect(roots.animation.children[0].getAttribute('y')).toBe('0');
		expect(roots.animation.children[2].getAttribute('y')).toBe('50');
	});

	it('image nodes have href from config pieceUrls', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		const firstImage = roots.animation.children[1];
		expect(firstImage.tagName).toBe('image');
		expect(firstImage.getAttribute('href')).toBeDefined();
		expect(firstImage.getAttribute('href')!.length).toBeGreaterThan(0);
	});

	it('rerender updates existing nodes instead of duplicating', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));
		expect(roots.animation.children.length).toBe(8);

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));
		expect(roots.animation.children.length).toBe(8);
	});

	it('removes nodes for roles no longer in promotedTo', () => {
		const { instance, roots } = createMountedInstance();

		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));
		expect(roots.animation.children.length).toBe(8);

		const smallerRequest = {
			destination: { to: 60, promotedTo: [RoleCode.Queen, RoleCode.Rook] }
		};
		instance.render!(createRenderContext({ deferredUIMoveRequest: smallerRequest }));
		expect(roots.animation.children.length).toBe(4);
	});
});

describe('promotion renderTransientVisuals', () => {
	it('creates hover rect when hovering over an active promotion square', () => {
		const { instance, roots } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		// Queen is at square 60 (file 4, rank 7)
		instance.renderTransientVisuals!(createTransientVisualsContext({ target: 60 }));

		const hoverRects = Array.from(roots.animation.children).filter(
			(el) => el.getAttribute('data-chessboard-id') === 'promotion-hover'
		);
		expect(hoverRects.length).toBe(1);
	});

	it('updates existing hover rect when moving to another active square', () => {
		const { instance, roots } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		instance.renderTransientVisuals!(createTransientVisualsContext({ target: 60 }));
		instance.renderTransientVisuals!(createTransientVisualsContext({ target: 52 }));

		const hoverRects = Array.from(roots.animation.children).filter(
			(el) => el.getAttribute('data-chessboard-id') === 'promotion-hover'
		);
		expect(hoverRects.length).toBe(1);
	});

	it('removes hover rect when target is null', () => {
		const { instance, roots } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		instance.renderTransientVisuals!(createTransientVisualsContext({ target: 60 }));
		instance.renderTransientVisuals!(createTransientVisualsContext({ target: null }));

		const hoverRects = Array.from(roots.animation.children).filter(
			(el) => el.getAttribute('data-chessboard-id') === 'promotion-hover'
		);
		expect(hoverRects.length).toBe(0);
	});

	it('removes hover rect when target is not an active promotion square', () => {
		const { instance, roots } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		instance.renderTransientVisuals!(createTransientVisualsContext({ target: 60 }));
		instance.renderTransientVisuals!(createTransientVisualsContext({ target: 0 }));

		const hoverRects = Array.from(roots.animation.children).filter(
			(el) => el.getAttribute('data-chessboard-id') === 'promotion-hover'
		);
		expect(hoverRects.length).toBe(0);
	});
});

describe('promotion onEvent', () => {
	it('resolves deferred request when pointerdown on active promotion square', () => {
		const { instance, surface } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		// Square 60 = queen
		const { context } = createEventContext({ type: 'pointerdown', targetSquare: 60 });
		instance.onEvent!(context);

		expect(
			(surface.commands as unknown as { resolveDeferredUIMoveRequest: ReturnType<typeof vi.fn> })
				.resolveDeferredUIMoveRequest
		).toHaveBeenCalledWith({ promotedTo: RoleCode.Queen });
	});

	it('calls preventDefault on pointerdown on active promotion square', () => {
		const { instance } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		const { context, preventDefault } = createEventContext({
			type: 'pointerdown',
			targetSquare: 60
		});
		instance.onEvent!(context);

		expect(preventDefault).toHaveBeenCalled();
	});

	it('cancels deferred request when pointerdown outside active squares', () => {
		const { instance, surface } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		const { context } = createEventContext({ type: 'pointerdown', targetSquare: 0 });
		instance.onEvent!(context);

		expect(
			(surface.commands as unknown as { cancelDeferredUIMoveRequest: ReturnType<typeof vi.fn> })
				.cancelDeferredUIMoveRequest
		).toHaveBeenCalled();
	});

	it('cancels deferred request when targetSquare is null', () => {
		const { instance, surface } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		const { context } = createEventContext({ type: 'pointerdown', targetSquare: null });
		instance.onEvent!(context);

		expect(
			(surface.commands as unknown as { cancelDeferredUIMoveRequest: ReturnType<typeof vi.fn> })
				.cancelDeferredUIMoveRequest
		).toHaveBeenCalled();
	});

	it('cancels deferred request when sceneEvent is missing', () => {
		const { instance, surface } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		const rawEvent = new Event('pointerdown');
		const context = { rawEvent, sceneEvent: null } as never;
		instance.onEvent!(context);

		expect(
			(surface.commands as unknown as { cancelDeferredUIMoveRequest: ReturnType<typeof vi.fn> })
				.cancelDeferredUIMoveRequest
		).toHaveBeenCalled();
	});

	it('throws when raw event type is not pointerdown', () => {
		const { instance } = createMountedInstance();
		instance.render!(createRenderContext({ deferredUIMoveRequest: WHITE_PROMO_REQUEST }));

		const { context } = createEventContext({ type: 'click', targetSquare: 60 });
		expect(() => instance.onEvent!(context)).toThrow();
	});
});
