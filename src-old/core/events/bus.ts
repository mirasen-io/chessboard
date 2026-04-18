/**
 * Minimal typed event bus for external integration.
 *
 * Usage:
 *   type MyEvents = { foo: number; bar: { x: string } };
 *   const bus = createBus<MyEvents>();
 *   const off = bus.on('foo n => console.log(n));
 *   bus.emit('foo', 42);
 *   off();
 */
import type { BoardStateSnapshot } from '../state/boardTypes';

export type Unsubscribe = () => void;

export type Handler<E, K extends keyof E> = (payload: E[K]) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericHandler = (payload: any) => void;

export interface Bus<E extends Record<string, unknown>> {
	on<K extends keyof E & string>(event: K, handler: Handler<E, K>): Unsubscribe;
	once<K extends keyof E & string>(event: K, handler: Handler<E, K>): Unsubscribe;
	off<K extends keyof E & string>(event: K, handler: Handler<E, K>): void;
	emit<K extends keyof E & string>(event: K, payload: E[K]): void;
	clear(): void;
	clear<K extends keyof E & string>(event: K): void;
}

/**
 * Create a typed event bus. Emission is synchronous; scheduling/batching is handled elsewhere.
 */
export function createBus<E extends Record<string, unknown>>(): Bus<E> {
	// Internally we store handlers as Set<Function> keyed by string event name.
	const listeners = new Map<string, Set<GenericHandler>>();

	function on<K extends keyof E & string>(event: K, handler: Handler<E, K>): Unsubscribe {
		let set = listeners.get(event);
		if (!set) {
			set = new Set();
			listeners.set(event, set);
		}
		set.add(handler);
		return () => off(event, handler);
	}

	function once<K extends keyof E & string>(event: K, handler: Handler<E, K>): Unsubscribe {
		const wrapped = (payload: E[K]) => {
			off(event, wrapped);
			handler(payload);
		};
		return on(event, wrapped);
	}

	function off<K extends keyof E & string>(event: K, handler: Handler<E, K>): void {
		const set = listeners.get(event);
		if (!set) return;
		set.delete(handler);
		if (set.size === 0) listeners.delete(event);
	}

	function emit<K extends keyof E & string>(event: K, payload: E[K]): void {
		const set = listeners.get(event);
		if (!set || set.size === 0) return;
		// Clone to avoid mutation during iteration
		const handlers = Array.from(set);
		for (const fn of handlers) {
			(fn as (p: E[K]) => void)(payload);
		}
	}

	function clear(): void;
	function clear<K extends keyof E & string>(event: K): void;
	function clear(event?: string): void {
		if (event) {
			listeners.delete(event);
		} else {
			listeners.clear();
		}
	}

	return { on, once, off, emit, clear } as Bus<E>;
}

/**
 * Default chessboard event map (external/public).
 * Consumers can use this type with createBus or rely on the Chessboard facade that composes a bus.
 */
export type ChessboardEventMap = {
	/**
	 * A new snapshot was produced by the scheduler after state updates.
	 */
	'state:changed': BoardStateSnapshot;
};
