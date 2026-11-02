import { describe, expect, it, vi } from 'vitest';
import { createWatermark } from '../../../../src/extensions/first-party/watermark/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/watermark/types.js';
import {
	builtInExtensionFactoryMap,
	DefaultBuiltinChessboardExtensions
} from '../../../../src/extensions/types/wrapper.js';
import type { RuntimeReadonlyMutationSession } from '../../../../src/runtime/mutation/types.js';
import { createTestContainer } from '../../../test-utils/wrapper/factory.js';
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
		board: document.createElementNS('http://www.w3.org/2000/svg', 'g')
	};
}

function createGeometry(opts: { width?: number; orientation?: number } = {}) {
	const width = opts.width ?? 640;
	const squareSize = width / 8;
	const orientation = opts.orientation ?? 0;
	const white = orientation === 0; // ColorCode.White = 0
	return {
		sceneSize: { width, height: width },
		boardRect: { x: 0, y: 0, width, height: width },
		squareSize,
		orientation,
		getSquareRect: (sq: number) => {
			const f = sq % 8;
			const r = Math.floor(sq / 8);
			const xIndex = white ? f : 7 - f;
			const yIndex = white ? 7 - r : r;
			return {
				x: xIndex * squareSize,
				y: yIndex * squareSize,
				width: squareSize,
				height: squareSize
			};
		}
	};
}

function createRenderableUpdateContext(opts: { causes?: string[]; orientation?: number }) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation(opts.causes ?? []),
			currentFrame: {
				isMounted: true,
				state: {
					view: { orientation: opts.orientation ?? 0 }
				},
				layout: {
					sceneSize: { width: 640, height: 640 },
					orientation: opts.orientation ?? 0,
					geometry: createGeometry({ orientation: opts.orientation }),
					layoutEpoch: 1
				}
			},
			invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		markDirty
	};
}

function createRenderContext(opts: { orientation?: number; width?: number; dirtyLayers?: number }) {
	const orientation = opts.orientation ?? 0;
	const width = opts.width ?? 640;
	return {
		currentFrame: {
			state: {
				view: { orientation }
			},
			layout: { geometry: createGeometry({ width, orientation }) }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? 1 }
	} as never;
}

describe('createWatermark', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createWatermark();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('watermark');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const def = createWatermark();
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

	describe('default extension registration', () => {
		it('built-in extension registry includes watermark', () => {
			expect(builtInExtensionFactoryMap).toHaveProperty('watermark');
			expect(builtInExtensionFactoryMap['watermark']).toBe(createWatermark);
		});

		it('default built-in extension list includes watermark', () => {
			expect(DefaultBuiltinChessboardExtensions).toContain('watermark');
		});

		it('watermark appears immediately after renderer', () => {
			const idx = DefaultBuiltinChessboardExtensions.indexOf('watermark');
			expect(idx).toBe(1);
			expect(DefaultBuiltinChessboardExtensions[0]).toBe('renderer');
		});
	});

	describe('onUpdate invalidation', () => {
		it('marks dirty on layout.refreshGeometry when frame is renderable', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry']
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(1); // DirtyLayer.Watermark = 1 << 0
		});

		it('does not mark dirty when no relevant mutation occurs', () => {
			const def = createWatermark();
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

	describe('render output', () => {
		it('renders an SVG image with data-chessboard-id="watermark"', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({}));

			const img = roots.board.querySelector('image[data-chessboard-id="watermark"]');
			expect(img).not.toBeNull();
		});

		it('has opacity="0.3" and pointer-events="none"', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({}));

			const img = roots.board.querySelector('image[data-chessboard-id="watermark"]')!;
			expect(img.getAttribute('opacity')).toBe('0.3');
			expect(img.getAttribute('pointer-events')).toBe('none');
		});

		it('has width/height based on square size and ratio 0.8', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			// 640 / 8 = 80 square size, 80 * 0.8 = 64
			instance.render!(createRenderContext({ width: 640 }));

			const img = roots.board.querySelector('image[data-chessboard-id="watermark"]')!;
			expect(img.getAttribute('width')).toBe('64');
			expect(img.getAttribute('height')).toBe('64');
		});

		it('has a non-empty href attribute', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({}));

			const img = roots.board.querySelector('image[data-chessboard-id="watermark"]')!;
			const href = img.getAttribute('href');
			expect(href).toBeTruthy();
			expect(href!.length).toBeGreaterThan(0);
		});
	});

	describe('white orientation placement', () => {
		it('watermark is centered on h1 (visual bottom-right) for white orientation', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			// White orientation: square 7 = h1, file=7, rank=0
			// xIndex=7, yIndex=7-0=7 → rect x=560, y=560, width=80, height=80
			// center=(600,600), size=64, watermark x=600-32=568, y=600-32=568
			instance.render!(createRenderContext({ orientation: 0, width: 640 }));

			const img = roots.board.querySelector('image[data-chessboard-id="watermark"]')!;
			expect(img.getAttribute('x')).toBe('568');
			expect(img.getAttribute('y')).toBe('568');
		});
	});

	describe('black orientation placement', () => {
		it('watermark is centered on a8 (visual bottom-right for black) for black orientation', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			// Black orientation: square 56 = a8, file=0, rank=7
			// xIndex=7-0=7, yIndex=7 → rect x=560, y=560, width=80, height=80
			// center=(600,600), size=64, watermark x=600-32=568, y=600-32=568
			instance.render!(createRenderContext({ orientation: 8, width: 640 }));

			const img = roots.board.querySelector('image[data-chessboard-id="watermark"]')!;
			expect(img.getAttribute('x')).toBe('568');
			expect(img.getAttribute('y')).toBe('568');
		});
	});

	describe('no duplicate watermark on rerender', () => {
		it('still has exactly one watermark image after multiple renders', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);

			instance.render!(createRenderContext({}));
			instance.render!(createRenderContext({}));
			instance.render!(createRenderContext({}));

			const images = roots.board.querySelectorAll('image[data-chessboard-id="watermark"]');
			expect(images.length).toBe(1);
		});
	});

	describe('explicit extension list can omit watermark', () => {
		it('no watermark image rendered when extension list omits watermark', async () => {
			const { createBoard } = await import('../../../../src/index.js');
			const container = createTestContainer();
			const board = createBoard({ element: container, extensions: ['renderer'] as const });

			const img = container.querySelector('image[data-chessboard-id="watermark"]');
			expect(img).toBeNull();

			board.destroy();
		});
	});

	describe('lifecycle', () => {
		it('unmount clears slot root children', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({}));

			instance.unmount!();

			expect(roots.board.children.length).toBe(0);
		});

		it('destroy clears slot root children', () => {
			const def = createWatermark();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const roots = createSlotRoots();
			instance.mount!({ slotRoots: roots } as never);
			instance.render!(createRenderContext({}));

			instance.destroy!();

			expect(roots.board.children.length).toBe(0);
		});
	});
});
