import { describe, expect, it } from 'vitest';
import { createBoard } from '../../src/index.js';
import {
	createTestBoardWithContainer,
	createTestContainer
} from '../test-utils/wrapper/factory.js';

describe('wrapper factory – immediate mount behavior', () => {
	it('creates SVG structure in the provided element immediately', () => {
		const { container } = createTestBoardWithContainer();

		expect(container.children.length).toBeGreaterThan(0);
		// SVG root should be present
		const svg = container.querySelector('svg');
		expect(svg).not.toBeNull();
	});

	it('creates SVG with expected layer structure', () => {
		const { container } = createTestBoardWithContainer();

		// SVG should contain layer groups for the renderer slots
		const svg = container.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(svg!.querySelectorAll('g').length).toBeGreaterThan(0);
	});
});

describe('wrapper factory – destroy behavior', () => {
	it('destroy does not throw on a freshly created board', () => {
		const { board } = createTestBoardWithContainer();

		expect(() => board.destroy()).not.toThrow();
	});

	it('destroy does not throw with full default extension set', () => {
		const container = createTestContainer();
		const board = createBoard({ element: container });

		expect(() => board.destroy()).not.toThrow();
	});

	it('destroy prevents subsequent use of getSnapshot', () => {
		const { board } = createTestBoardWithContainer();

		board.destroy();

		expect(() => board.getSnapshot()).toThrow();
	});
});

describe('wrapper factory – getSnapshot', () => {
	it('returns a valid state snapshot after creation', () => {
		const { board } = createTestBoardWithContainer();

		const snapshot = board.getSnapshot();

		expect(snapshot).toBeDefined();
		expect(snapshot.state).toBeDefined();
		expect(snapshot.state.board).toBeDefined();
		expect(snapshot.state.board.pieces).toBeDefined();
		expect(snapshot.state.board.turn).toBeDefined();
		expect(snapshot.state.interaction).toBeDefined();
		expect(snapshot.state.change).toBeDefined();
		expect(snapshot.state.view).toBeDefined();
	});

	it('returns a snapshot with expected initial board state', () => {
		const { board } = createTestBoardWithContainer();

		const snapshot = board.getSnapshot();

		expect(snapshot.state.board.pieces).toBeInstanceOf(Uint8Array);
		expect(snapshot.state.board.pieces.length).toBe(64);
	});

	it('returns layout information in snapshot', () => {
		const { board } = createTestBoardWithContainer();

		const snapshot = board.getSnapshot();

		expect(snapshot.layout).toBeDefined();
	});
});
