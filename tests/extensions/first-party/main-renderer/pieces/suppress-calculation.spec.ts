import { describe, expect, it } from 'vitest';
import { calculateSuppressedSquares } from '../../../../../src/extensions/first-party/main-renderer/pieces/suppress.js';
import type { MainRendererPiecesInternal } from '../../../../../src/extensions/first-party/main-renderer/pieces/types.js';
import { PieceCode, type Square } from '../../../../../src/state/board/types/internal.js';
import {
	createPiecesCleanAnimationContext,
	createTestPieceSymbolResolver
} from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

function createInternalState(): MainRendererPiecesInternal {
	return {
		pieceNodes: new Map(),
		suppressedSquares: new Set(),
		resolver
	};
}

describe('calculateSuppressedSquares – animation suppressed squares', () => {
	it('returns animation suppressed squares when no drag and no deferred move', () => {
		const state = createInternalState();
		const animSuppressed = new Set([4 as Square, 12 as Square]);
		const { context } = createPiecesCleanAnimationContext();

		const result = calculateSuppressedSquares(state, context, animSuppressed);

		expect(result).toEqual(animSuppressed);
	});

	it('returns empty set when no animation, no drag, no deferred move', () => {
		const state = createInternalState();
		const { context } = createPiecesCleanAnimationContext();

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.size).toBe(0);
	});
});

describe('calculateSuppressedSquares – drag session', () => {
	it('adds lifted-piece drag source square', () => {
		const state = createInternalState();
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: null,
			pointerPosition: { x: 100, y: 100 }
		};
		const { context } = createPiecesCleanAnimationContext({ dragSession });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.has(4 as Square)).toBe(true);
		expect(result.size).toBe(1);
	});

	it('does not add drag source for release-targeting type', () => {
		const state = createInternalState();
		const dragSession = {
			owner: 'core',
			type: 'release-targeting',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: 20 as Square,
			pointerPosition: { x: 100, y: 100 }
		};
		const { context } = createPiecesCleanAnimationContext({ dragSession });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.size).toBe(0);
	});

	it('does not add drag source for pending lifted-piece session', () => {
		const state = createInternalState();
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'pending',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: 4 as Square,
			startButton: 0,
			startPoint: { x: 0, y: 0 },
			thresholdPx: 4
		};
		const { context } = createPiecesCleanAnimationContext({ dragSession });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.size).toBe(0);
	});

	it('does not add drag source when dragSession is null', () => {
		const state = createInternalState();
		const { context } = createPiecesCleanAnimationContext({ dragSession: null });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.size).toBe(0);
	});
});

describe('calculateSuppressedSquares – deferred UI move', () => {
	it('adds deferred UI move source square', () => {
		const state = createInternalState();
		const deferredUIMoveRequest = {
			status: 'deferred',
			sourceSquare: 12 as Square,
			destination: { to: 28 as Square },
			canBeAutoResolved: false,
			resolvedMoveRequest: null
		};
		const { context } = createPiecesCleanAnimationContext({ deferredUIMoveRequest });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.has(12 as Square)).toBe(true);
	});

	it('adds deferred UI move destination square', () => {
		const state = createInternalState();
		const deferredUIMoveRequest = {
			status: 'deferred',
			sourceSquare: 12 as Square,
			destination: { to: 28 as Square },
			canBeAutoResolved: false,
			resolvedMoveRequest: null
		};
		const { context } = createPiecesCleanAnimationContext({ deferredUIMoveRequest });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.has(28 as Square)).toBe(true);
	});

	it('does not suppress when deferredUIMoveRequest is null', () => {
		const state = createInternalState();
		const { context } = createPiecesCleanAnimationContext({ deferredUIMoveRequest: null });

		const result = calculateSuppressedSquares(state, context, new Set());

		expect(result.size).toBe(0);
	});
});

describe('calculateSuppressedSquares – combined sources', () => {
	it('combines animation, drag, and deferred sources', () => {
		const state = createInternalState();
		const animSuppressed = new Set([60 as Square]);
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: null,
			pointerPosition: { x: 100, y: 100 }
		};
		const deferredUIMoveRequest = {
			status: 'deferred',
			sourceSquare: 12 as Square,
			destination: { to: 28 as Square },
			canBeAutoResolved: false,
			resolvedMoveRequest: null
		};
		const { context } = createPiecesCleanAnimationContext({ dragSession, deferredUIMoveRequest });

		const result = calculateSuppressedSquares(state, context, animSuppressed);

		expect(result.has(60 as Square)).toBe(true); // animation
		expect(result.has(4 as Square)).toBe(true); // drag
		expect(result.has(12 as Square)).toBe(true); // deferred source
		expect(result.has(28 as Square)).toBe(true); // deferred destination
		expect(result.size).toBe(4);
	});

	it('handles overlapping squares without duplicates', () => {
		const state = createInternalState();
		// Animation and drag on same square
		const animSuppressed = new Set([4 as Square]);
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: null,
			pointerPosition: { x: 100, y: 100 }
		};
		const { context } = createPiecesCleanAnimationContext({ dragSession });

		const result = calculateSuppressedSquares(state, context, animSuppressed);

		expect(result.has(4 as Square)).toBe(true);
		expect(result.size).toBe(1);
	});
});
