import { describe, expect, it, vi } from 'vitest';
import { DirtyLayer } from '../../../../src/extensions/first-party/annotations/types/internal.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/annotations/types/main.js';
import {
	createGeometry,
	createMockMutation,
	createMockRuntimeSurface,
	setupMountedInstance
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

function createPreviewUpdateContext(opts: {
	causes?: string[];
	dragSession?: { type: string; owner: string; targetSquare: number | null } | null;
}) {
	const markDirty = vi.fn();
	const context = {
		previousFrame: null,
		mutation: createMockMutation(opts.causes ?? []),
		currentFrame: {
			isMounted: true,
			state: {
				interaction: {
					dragSession: opts.dragSession ?? null
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
	} as never;
	return { context, markDirty };
}

describe('annotations preview — onUpdate preview target tracking', () => {
	it('ext:draw drag session with source === target sets preview target to source', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context, markDirty } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});

		instance.onUpdate!(context);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.PREVIEW);
		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
	});

	it('ext:draw drag session target change updates preview target', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context: ctx1 } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(ctx1);

		const { context: ctx2, markDirty: markDirty2 } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 36 }
		});
		instance.onUpdate!(ctx2);

		expect(markDirty2).toHaveBeenCalledWith(DirtyLayer.PREVIEW);
		expect(markDirty2).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
	});

	it('same target does not dirty again', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context: ctx1 } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(ctx1);

		const { context: ctx2, markDirty: markDirty2 } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(ctx2);

		expect(markDirty2).not.toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});

	it('ext:draw drag session target null clears preview target', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context: ctx1 } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(ctx1);

		const { context: ctx2, markDirty: markDirty2 } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: null }
		});
		instance.onUpdate!(ctx2);

		expect(markDirty2).toHaveBeenCalledWith(DirtyLayer.PREVIEW);
		expect(markDirty2).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
	});

	it('no activeDrawGesture means drag session changes do not update preview', () => {
		const { instance } = setupMountedInstance();

		const { context, markDirty } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});

		instance.onUpdate!(context);

		expect(markDirty).not.toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});

	it('non-ext:draw drag session does not update annotation preview', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context, markDirty } = createPreviewUpdateContext({
			dragSession: { type: 'ext:idle-clear', owner: EXTENSION_ID, targetSquare: 10 }
		});

		instance.onUpdate!(context);

		expect(markDirty).not.toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});

	it('square 0 works as a valid preview target', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 0 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context, markDirty } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 0 }
		});

		instance.onUpdate!(context);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});

	it('geometry refresh dirties PREVIEW when preview target exists', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context: ctx1 } = createPreviewUpdateContext({
			causes: [],
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(ctx1);

		const { context: ctx2, markDirty: markDirty2 } = createPreviewUpdateContext({
			causes: ['layout.refreshGeometry'],
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(ctx2);

		expect(markDirty2).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
		expect(markDirty2).toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});

	it('onUpdate preview tracking does not mutate committed circles', () => {
		const { instance, api } = setupMountedInstance();
		api.circle('e4', { color: '#ff0000' });

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const circlesBefore = api.getCircles();

		const { context } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(context);

		expect(api.getCircles()).toEqual(circlesBefore);
	});

	it('onUpdate preview tracking does not mutate committed arrows', () => {
		const { instance, api } = setupMountedInstance();
		api.arrow('e2', 'e4', { color: '#ff0000' });

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 12 },
			runtimeInteractionActionPreview: null
		} as never);

		const arrowsBefore = api.getArrows();

		const { context } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(context);

		expect(api.getArrows()).toEqual(arrowsBefore);
	});
});

describe('annotations preview — initial preview timing', () => {
	it('activeDrawGesture is set before startDrag so synchronous onUpdate can see it', () => {
		const surface = createMockRuntimeSurface();
		let gestureSeenDuringStartDrag: boolean | null = null;

		(surface.commands.startDrag as ReturnType<typeof vi.fn>).mockImplementation(function (
			this: unknown
		) {
			const { context, markDirty } = createPreviewUpdateContext({
				dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
			});
			instance.onUpdate!(context);
			gestureSeenDuringStartDrag = markDirty.mock.calls.some(
				(c: unknown[]) => c[0] === DirtyLayer.PREVIEW
			);
			return true;
		});

		const { instance } = setupMountedInstance({ surface });

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		expect(gestureSeenDuringStartDrag).toBe(true);
	});

	it('startDrag failure clears activeDrawGesture', () => {
		const surface = createMockRuntimeSurface();
		(surface.commands.startDrag as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const { instance } = setupMountedInstance({ surface });

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context, markDirty } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(context);

		expect(markDirty).not.toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});
});

describe('annotations preview — completeDrag/cancelDrag cleanup', () => {
	it('completeDrag clears activeDrawPreviewTarget', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 36 }
		});
		instance.onUpdate!(context);

		instance.completeDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: 36
		} as never);

		const { context: ctx2, markDirty: markDirty2 } = createPreviewUpdateContext({
			dragSession: null
		});
		instance.onUpdate!(ctx2);

		expect(markDirty2).not.toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});

	it('cancelDrag clears activeDrawPreviewTarget', () => {
		const { instance } = setupMountedInstance();

		instance.onEvent!({
			rawEvent: new PointerEvent('pointerdown', { button: 2 }),
			sceneEvent: { targetSquare: 28 },
			runtimeInteractionActionPreview: null
		} as never);

		const { context } = createPreviewUpdateContext({
			dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare: 28 }
		});
		instance.onUpdate!(context);

		instance.cancelDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: null
		} as never);

		const { context: ctx2, markDirty: markDirty2 } = createPreviewUpdateContext({
			dragSession: null
		});
		instance.onUpdate!(ctx2);

		expect(markDirty2).not.toHaveBeenCalledWith(DirtyLayer.PREVIEW);
	});
});
