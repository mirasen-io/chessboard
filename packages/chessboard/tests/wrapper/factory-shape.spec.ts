import { describe, expect, it } from 'vitest';
import { createBoard } from '../../src/index.js';
import {
	createTestBoardWithContainer,
	createTestContainer
} from '../test-utils/wrapper/factory.js';

describe('wrapper factory – public surface shape', () => {
	it('returns command methods', () => {
		const { board } = createTestBoardWithContainer();

		expect(typeof board.setPosition).toBe('function');
		expect(typeof board.setPiecePosition).toBe('function');
		expect(typeof board.setTurn).toBe('function');
		expect(typeof board.move).toBe('function');
		expect(typeof board.setOrientation).toBe('function');
		expect(typeof board.setMovability).toBe('function');
		expect(typeof board.select).toBe('function');
		expect(typeof board.getSnapshot).toBe('function');
	});

	it('returns destroy method', () => {
		const { board } = createTestBoardWithContainer();

		expect(typeof board.destroy).toBe('function');
	});

	it('returns extensions property as an object', () => {
		const { board } = createTestBoardWithContainer();

		expect(typeof board.extensions).toBe('object');
		expect(board.extensions).not.toBeNull();
	});
});

describe('wrapper factory – element-first immediate-mount behavior', () => {
	it('mounts immediately when element option is provided', () => {
		const container = createTestContainer();

		createBoard({ element: container, extensions: ['renderer'] as const });

		// Immediate mount creates SVG structure in the container
		expect(container.children.length).toBeGreaterThan(0);
	});

	it('resolves built-in extension string to working definition', () => {
		const container = createTestContainer();

		const board = createBoard({ element: container, extensions: ['renderer'] as const });

		expect(container.children.length).toBeGreaterThan(0);
		expect(typeof board.getSnapshot).toBe('function');
	});

	it('resolves built-in extension with config object form', () => {
		const container = createTestContainer();

		// The 'renderer' extension accepts MainRendererInitOptions
		const board = createBoard({
			element: container,
			extensions: [{ builtin: 'renderer', options: {} }] as const
		});

		expect(container.children.length).toBeGreaterThan(0);
		expect(typeof board.getSnapshot).toBe('function');
	});
});

describe('wrapper factory – default extensions', () => {
	it('works with no extensions option (uses all built-in defaults)', () => {
		const container = createTestContainer();

		// Use real default extensions by not passing extensions option
		const board = createBoard({ element: container });

		// Should render successfully with all built-in extensions
		expect(container.children.length).toBeGreaterThan(0);
		expect(typeof board.getSnapshot).toBe('function');
	});
});
