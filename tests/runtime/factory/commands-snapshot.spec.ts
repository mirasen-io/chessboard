import { describe, expect, it } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import { ColorCode } from '../../../src/state/board/types/internal.js';

function createTestRuntime() {
	return createRuntime({ doc: document });
}

describe('runtime getSnapshot', () => {
	it('returns object with state and layout properties', () => {
		const runtime = createTestRuntime();
		const snapshot = runtime.getSnapshot();

		expect(snapshot).toHaveProperty('state');
		expect(snapshot).toHaveProperty('layout');
	});

	it('state contains board, view, interaction, change snapshots', () => {
		const runtime = createTestRuntime();
		const snapshot = runtime.getSnapshot();

		expect(snapshot.state).toHaveProperty('board');
		expect(snapshot.state).toHaveProperty('view');
		expect(snapshot.state).toHaveProperty('interaction');
		expect(snapshot.state).toHaveProperty('change');
	});

	it('layout contains sceneSize, orientation, geometry, layoutEpoch', () => {
		const runtime = createTestRuntime();
		const snapshot = runtime.getSnapshot();

		expect(snapshot.layout).toHaveProperty('sceneSize');
		expect(snapshot.layout).toHaveProperty('orientation');
		expect(snapshot.layout).toHaveProperty('geometry');
		expect(snapshot.layout).toHaveProperty('layoutEpoch');
	});

	it('reflects board state changes after setPosition', () => {
		const runtime = createTestRuntime();
		runtime.setPosition({ pieces: { a1: 'wR' }, turn: 'black' });

		const snapshot = runtime.getSnapshot();
		expect(snapshot.state.board.turn).toBe(ColorCode.Black);
	});

	it('reflects view state changes after setOrientation', () => {
		const runtime = createTestRuntime();
		runtime.setOrientation('black');

		const snapshot = runtime.getSnapshot();
		expect(snapshot.state.view.orientation).toBe(ColorCode.Black);
	});

	it('each call returns a fresh object (not same reference)', () => {
		const runtime = createTestRuntime();
		const snap1 = runtime.getSnapshot();
		const snap2 = runtime.getSnapshot();

		expect(snap1).not.toBe(snap2);
		expect(snap1.state).not.toBe(snap2.state);
	});

	it('layout defaults: sceneSize null, geometry null, epoch 0', () => {
		const runtime = createTestRuntime();
		const snapshot = runtime.getSnapshot();

		expect(snapshot.layout.sceneSize).toBeNull();
		expect(snapshot.layout.geometry).toBeNull();
		expect(snapshot.layout.layoutEpoch).toBe(0);
	});
});
