import { describe, expect, it, vi } from 'vitest';
import { createInputAdapter } from '../../../../src/runtime/input/adapter/factory.js';
import { NEED_EVENT_TYPES } from '../../../../src/runtime/input/adapter/types.js';
import type { InteractionController } from '../../../../src/runtime/input/controller/types.js';

function createMockController(): InteractionController {
	return { onEvent: vi.fn() };
}

function createContainer() {
	const container = document.createElement('div');
	container.setPointerCapture = vi.fn();
	container.releasePointerCapture = vi.fn();
	container.hasPointerCapture = vi.fn(() => false);
	return container;
}

function createAdapter(controllerOverride?: InteractionController) {
	const container = createContainer();
	const controller = controllerOverride ?? createMockController();
	const adapter = createInputAdapter({
		container,
		getRenderGeometry: () => null,
		controller
	});
	return { container, controller, adapter };
}

describe('createInputAdapter', () => {
	describe('creation', () => {
		it('subscribes all required pointer event types on creation', () => {
			const container = createContainer();
			const addSpy = vi.spyOn(container, 'addEventListener');

			createInputAdapter({
				container,
				getRenderGeometry: () => null,
				controller: createMockController()
			});

			for (const type of NEED_EVENT_TYPES) {
				expect(addSpy).toHaveBeenCalledWith(type, expect.any(Function));
			}
		});
	});

	describe('subscribeEvent', () => {
		it('adds listener for custom event type', () => {
			const { container, adapter } = createAdapter();
			const addSpy = vi.spyOn(container, 'addEventListener');

			adapter.subscribeEvent('click');

			expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});
	});

	describe('unsubscribeEvent', () => {
		it('removes listener for non-required event type', () => {
			const { container, adapter } = createAdapter();
			adapter.subscribeEvent('click');
			const removeSpy = vi.spyOn(container, 'removeEventListener');

			adapter.unsubscribeEvent('click');

			expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});

		it('throws when trying to unsubscribe a required event type', () => {
			const { adapter } = createAdapter();

			expect(() => adapter.unsubscribeEvent('pointerdown' as keyof HTMLElementEventMap)).toThrow(
				/required event type/
			);
		});
	});

	describe('event forwarding', () => {
		it('forwards non-pointer events to controller with sceneEvent null', () => {
			const controller = createMockController();
			const container = createContainer();
			const adapter = createInputAdapter({
				container,
				getRenderGeometry: () => null,
				controller
			});
			adapter.subscribeEvent('click');

			const clickEvent = new Event('click');
			container.dispatchEvent(clickEvent);

			expect(controller.onEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					rawEvent: clickEvent,
					sceneEvent: null
				})
			);
		});

		it('forwards dragstart events to controller with sceneEvent null', () => {
			const controller = createMockController();
			const container = createContainer();
			createInputAdapter({
				container,
				getRenderGeometry: () => null,
				controller
			});

			const dragstartEvent = new Event('dragstart', { cancelable: true });
			container.dispatchEvent(dragstartEvent);

			expect(controller.onEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					rawEvent: dragstartEvent,
					sceneEvent: null
				})
			);
		});

		it('forwards pointer events to controller with sceneEvent data', () => {
			const controller = createMockController();
			const container = createContainer();
			createInputAdapter({
				container,
				getRenderGeometry: () => null,
				controller
			});

			const pointerEvent = new PointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100,
				pointerId: 1,
				isPrimary: true
			});
			container.dispatchEvent(pointerEvent);

			expect(controller.onEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					rawEvent: pointerEvent,
					sceneEvent: expect.objectContaining({
						type: 'pointerdown',
						point: expect.any(Object)
					})
				})
			);
		});
	});

	describe('destroy', () => {
		it('removes all required event listeners', () => {
			const { container, adapter } = createAdapter();
			const removeSpy = vi.spyOn(container, 'removeEventListener');

			adapter.destroy();

			for (const type of NEED_EVENT_TYPES) {
				expect(removeSpy).toHaveBeenCalledWith(type, expect.any(Function));
			}
		});

		it('releases pointer capture if active', () => {
			const container = createContainer();
			container.hasPointerCapture = vi.fn(() => true);
			const controller = createMockController();
			const adapter = createInputAdapter({
				container,
				getRenderGeometry: () => null,
				controller
			});

			// Simulate pointer capture by dispatching pointerdown
			const pointerEvent = new PointerEvent('pointerdown', {
				pointerId: 5,
				isPrimary: true
			});
			container.dispatchEvent(pointerEvent);

			adapter.destroy();

			expect(container.releasePointerCapture).toHaveBeenCalledWith(5);
		});
	});
});
