import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import { handleAnnotationsEvent } from '../../../../src/extensions/first-party/annotations/interaction.js';
import type { AnnotationsStateInternal } from '../../../../src/extensions/first-party/annotations/types/main.js';
import type { ExtensionOnEventContext } from '../../../../src/extensions/types/context/events.js';

function createMockState(overrides?: Partial<AnnotationsStateInternal>): AnnotationsStateInternal {
	return {
		slotRoots: null as never,
		runtimeSurface: {
			commands: {
				startDrag: vi.fn(() => true),
				requestRender: vi.fn(() => true)
			},
			events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
			invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		svg: { svgCircles: new Map(), svgArrows: new Map() },
		annotations: { circles: new Map(), arrows: new Map() },
		config: { ...DEFAULT_CONFIG },
		activeDrawGesture: null,
		...overrides
	} as unknown as AnnotationsStateInternal;
}

function createPointerDownEvent(
	button: number,
	modifiers?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }
): PointerEvent {
	const event = new PointerEvent('pointerdown', {
		button,
		ctrlKey: modifiers?.ctrlKey ?? false,
		shiftKey: modifiers?.shiftKey ?? false,
		altKey: modifiers?.altKey ?? false,
		metaKey: modifiers?.metaKey ?? false
	});
	vi.spyOn(event, 'preventDefault');
	return event;
}

function createEventContext(
	rawEvent: Event,
	targetSquare: number | null,
	runtimeInteractionActionPreview: unknown = null
): ExtensionOnEventContext {
	return {
		rawEvent,
		sceneEvent: targetSquare !== null ? { targetSquare } : null,
		runtimeInteractionActionPreview
	} as unknown as ExtensionOnEventContext;
}

describe('annotations draw gesture — handleAnnotationsEvent', () => {
	it('secondary pointerdown on board square starts ext:draw drag', () => {
		const state = createMockState();
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createPointerDownEvent(2);
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(startDrag).toHaveBeenCalledTimes(1);
		expect(startDrag).toHaveBeenCalledWith({
			type: 'ext:draw',
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: 28
		});
	});

	it('non-configured button does not start draw drag', () => {
		const state = createMockState();
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createPointerDownEvent(1);
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(startDrag).not.toHaveBeenCalled();
	});

	it('secondary pointerdown outside board does nothing', () => {
		const state = createMockState();
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createPointerDownEvent(2);
		const context = createEventContext(rawEvent, null);

		handleAnnotationsEvent(state, context);

		expect(startDrag).not.toHaveBeenCalled();
	});

	it('startDrag returning false does not preventDefault or store gesture state', () => {
		const state = createMockState();
		(state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>).mockReturnValue(false);
		const rawEvent = createPointerDownEvent(2);
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(rawEvent.preventDefault).not.toHaveBeenCalled();
		expect(state.activeDrawGesture).toBeNull();
	});

	it('startDrag returning true calls preventDefault and stores gesture state', () => {
		const state = createMockState();
		const rawEvent = createPointerDownEvent(2);
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(rawEvent.preventDefault).toHaveBeenCalledTimes(1);
		expect(state.activeDrawGesture).toEqual({
			sourceSquare: 28,
			color: DEFAULT_CONFIG.colors.none
		});
	});

	it('square 0 is valid and starts draw drag', () => {
		const state = createMockState();
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createPointerDownEvent(2);
		const context = createEventContext(rawEvent, 0);

		handleAnnotationsEvent(state, context);

		expect(startDrag).toHaveBeenCalledWith(
			expect.objectContaining({ sourceSquare: 0, targetSquare: 0 })
		);
		expect(state.activeDrawGesture).toEqual({
			sourceSquare: 0,
			color: DEFAULT_CONFIG.colors.none
		});
	});

	it('stores resolved modifier color in gesture state', () => {
		const state = createMockState();
		const rawEvent = createPointerDownEvent(2, { shiftKey: true });
		const context = createEventContext(rawEvent, 10);

		handleAnnotationsEvent(state, context);

		expect(state.activeDrawGesture!.color).toBe(DEFAULT_CONFIG.colors.shift);
	});
});

describe('annotations contextmenu suppression — handleAnnotationsEvent', () => {
	function createContextMenuEvent(): Event {
		const event = new Event('contextmenu', { cancelable: true });
		vi.spyOn(event, 'preventDefault');
		return event;
	}

	it('calls preventDefault on contextmenu', () => {
		const state = createMockState();
		const rawEvent = createContextMenuEvent();
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(rawEvent.preventDefault).toHaveBeenCalledTimes(1);
	});

	it('does not call startDrag', () => {
		const state = createMockState();
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createContextMenuEvent();
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(startDrag).not.toHaveBeenCalled();
	});

	it('does not set activeDrawGesture', () => {
		const state = createMockState();
		const rawEvent = createContextMenuEvent();
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(state.activeDrawGesture).toBeNull();
	});

	it('prevents default even without a target square', () => {
		const state = createMockState();
		const rawEvent = createContextMenuEvent();
		const context: ExtensionOnEventContext = {
			rawEvent,
			sceneEvent: null,
			runtimeInteractionActionPreview: null
		} as unknown as ExtensionOnEventContext;

		handleAnnotationsEvent(state, context);

		expect(rawEvent.preventDefault).toHaveBeenCalledTimes(1);
	});

	it('prevents default when drawButton is 0', () => {
		const state = createMockState({ config: { ...DEFAULT_CONFIG, drawButton: 0 } });
		const rawEvent = createContextMenuEvent();
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(rawEvent.preventDefault).toHaveBeenCalledTimes(1);
		expect(
			(state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>)
		).not.toHaveBeenCalled();
	});
});

describe('annotations draw gesture — idle clear remains unchanged', () => {
	it('primary button with null preview and non-empty annotations starts idle-clear', () => {
		const state = createMockState();
		state.annotations.circles.set(0, { key: 0, square: 0, color: '#ff0000' });
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createPointerDownEvent(0);
		const context = createEventContext(rawEvent, 28);

		handleAnnotationsEvent(state, context);

		expect(startDrag).toHaveBeenCalledWith(expect.objectContaining({ type: 'ext:idle-clear' }));
	});

	it('primary button with non-null runtimeInteractionActionPreview does not start any drag', () => {
		const state = createMockState();
		state.annotations.circles.set(0, { key: 0, square: 0, color: '#ff0000' });
		const startDrag = state.runtimeSurface.commands.startDrag as ReturnType<typeof vi.fn>;
		const rawEvent = createPointerDownEvent(0);
		const context = createEventContext(rawEvent, 28, { type: 'startLiftedDrag' });

		handleAnnotationsEvent(state, context);

		expect(startDrag).not.toHaveBeenCalled();
	});
});
