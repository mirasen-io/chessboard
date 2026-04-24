import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import { ColorCode } from '../../../src/state/board/types/internal.js';
import { createViewState } from '../../../src/state/view/factory.js';
import type { ViewStateMutationPayloadByCause } from '../../../src/state/view/mutation.js';

function createViewMutationSession() {
	return createMutationSession<ViewStateMutationPayloadByCause>();
}

describe('createViewState', () => {
	it('defaults to ColorCode.White when no orientation specified', () => {
		const view = createViewState({});
		expect(view.orientation).toBe(ColorCode.White);
	});

	it('initializes to black with orientation "black"', () => {
		const view = createViewState({ orientation: 'black' });
		expect(view.orientation).toBe(ColorCode.Black);
	});

	it('initializes to black with orientation "b"', () => {
		const view = createViewState({ orientation: 'b' });
		expect(view.orientation).toBe(ColorCode.Black);
	});

	it('initializes to white with orientation "white"', () => {
		const view = createViewState({ orientation: 'white' });
		expect(view.orientation).toBe(ColorCode.White);
	});

	it('orientation getter reflects current state after mutation', () => {
		const view = createViewState({});
		const session = createViewMutationSession();
		view.setOrientation('black', session);
		expect(view.orientation).toBe(ColorCode.Black);
	});

	it('setOrientation updates orientation and records mutation cause', () => {
		const view = createViewState({});
		const session = createViewMutationSession();

		const changed = view.setOrientation('black', session);

		expect(changed).toBe(true);
		expect(session.hasMutation({ causes: ['state.view.setOrientation'] })).toBe(true);
		expect(view.orientation).toBe(ColorCode.Black);
	});

	it('setOrientation with short form "b" works through normalization', () => {
		const view = createViewState({});
		const session = createViewMutationSession();

		const changed = view.setOrientation('b', session);

		expect(changed).toBe(true);
		expect(view.orientation).toBe(ColorCode.Black);
	});

	it('setOrientation no-op returns false and does not record mutation', () => {
		const view = createViewState({});
		const session = createViewMutationSession();

		const changed = view.setOrientation('white', session);

		expect(changed).toBe(false);
		expect(session.hasMutation({ causes: ['state.view.setOrientation'] })).toBe(false);
	});

	it('setOrientation with invalid input throws', () => {
		const view = createViewState({});
		const session = createViewMutationSession();

		expect(() => view.setOrientation('invalid' as never, session)).toThrow();
	});

	it('getSnapshot returns an isolated snapshot', () => {
		const view = createViewState({ orientation: 'white' });
		const snap1 = view.getSnapshot();
		const snap2 = view.getSnapshot();

		expect(snap1).not.toBe(snap2);
		expect(snap1.orientation).toBe(snap2.orientation);
		expect(snap1.orientation).toBe(ColorCode.White);
	});
});
