import { describe, expect, it, vi } from 'vitest';
import { createBus } from '../../../src/core/events/bus';

type TestEvents = {
	a: number;
	b: { x: string };
};

describe('core/events/bus', () => {
	it('on/emit basic', () => {
		const bus = createBus<TestEvents>();
		const h = vi.fn();
		bus.on('a', h);

		bus.emit('a', 42);

		expect(h).toHaveBeenCalledTimes(1);
		expect(h).toHaveBeenCalledWith(42);
	});

	it('multiple handlers fire in registration order', () => {
		const bus = createBus<TestEvents>();
		const h1 = vi.fn();
		const h2 = vi.fn();
		bus.on('a', h1);
		bus.on('a', h2);

		bus.emit('a', 7);

		expect(h1).toHaveBeenCalledBefore(h2);
		expect(h1).toHaveBeenCalledWith(7);
		expect(h2).toHaveBeenCalledWith(7);
	});

	it('off removes handler; unknown off is a no-op', () => {
		const bus = createBus<TestEvents>();
		const h1 = vi.fn();
		const h2 = vi.fn();
		bus.on('a', h1);
		bus.on('a', h2);

		bus.off('a', h1);
		// calling off again (unknown) should be no-op
		bus.off('a', h1);

		bus.emit('a', 3);

		expect(h1).not.toHaveBeenCalled();
		expect(h2).toHaveBeenCalledTimes(1);
		expect(h2).toHaveBeenCalledWith(3);
	});

	it('unsubscribe function works and is idempotent', () => {
		const bus = createBus<TestEvents>();
		const h = vi.fn();
		const off = bus.on('b', h);

		off();
		off(); // idempotent

		bus.emit('b', { x: 't' });
		expect(h).not.toHaveBeenCalled();
	});

	it('once fires exactly once', () => {
		const bus = createBus<TestEvents>();
		const h = vi.fn();
		bus.once('a', h);

		bus.emit('a', 1);
		bus.emit('a', 2);

		expect(h).toHaveBeenCalledTimes(1);
		expect(h).toHaveBeenCalledWith(1);
	});

	it('reentrancy: removing self during emit does not affect current emission', () => {
		const bus = createBus<TestEvents>();
		const h1 = vi.fn(() => {
			bus.off('a', h1);
		});
		const h2 = vi.fn();
		bus.on('a', h1);
		bus.on('a', h2);

		// First emit: both should fire because the handler list is snapshotted
		bus.emit('a', 9);
		expect(h1).toHaveBeenCalledTimes(1);
		expect(h2).toHaveBeenCalledTimes(1);

		// Second emit: h1 should have been removed already
		bus.emit('a', 10);
		expect(h1).toHaveBeenCalledTimes(1);
		expect(h2).toHaveBeenCalledTimes(2);
	});

	it('reentrancy: adding a handler during emit will not be called in the same emission', () => {
		const bus = createBus<TestEvents>();
		const h1 = vi.fn(() => {
			bus.on('a', h2);
		});
		const h2 = vi.fn();

		bus.on('a', h1);
		bus.emit('a', 5);

		// h2 added during emit should not fire in the same cycle
		expect(h1).toHaveBeenCalledTimes(1);
		expect(h2).not.toHaveBeenCalled();

		// Subsequent emission should call both
		bus.emit('a', 6);
		expect(h2).toHaveBeenCalledTimes(1);
		expect(h2).toHaveBeenCalledWith(6);
	});

	it('clear(event) removes only that event listeners', () => {
		const bus = createBus<TestEvents>();
		const ha = vi.fn();
		const hb = vi.fn();

		bus.on('a', ha);
		bus.on('b', hb);
		bus.clear('a');

		bus.emit('a', 1);
		bus.emit('b', { x: 'ok' });

		expect(ha).not.toHaveBeenCalled();
		expect(hb).toHaveBeenCalledTimes(1);
		expect(hb).toHaveBeenCalledWith({ x: 'ok' });
	});

	it('clear() removes all events listeners', () => {
		const bus = createBus<TestEvents>();
		const ha = vi.fn();
		const hb = vi.fn();

		bus.on('a', ha);
		bus.on('b', hb);
		bus.clear();

		bus.emit('a', 1);
		bus.emit('b', { x: 'ok' });

		expect(ha).not.toHaveBeenCalled();
		expect(hb).not.toHaveBeenCalled();
	});

	it('emit on unknown event is a no-op and does not throw', () => {
		const bus = createBus<TestEvents>();
		expect(() => bus.emit('a', 0)).not.toThrow();
	});
});
