import { describe, expect, it } from 'vitest';
import type { AnimationSession } from '../../../src/core/animation/types';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot, Square } from '../../../src/core/state/boardTypes';

function sq(n: number): Square {
	return n as Square;
}

/** Minimal board snapshot helper */
function makeBoardSnapshot(
	overrides?: Partial<{ pieces: Uint8Array; ids: Int16Array; positionEpoch: number }>
): BoardStateSnapshot {
	const pieces = overrides?.pieces ?? new Uint8Array(64);
	const ids = overrides?.ids ?? new Int16Array(64).fill(-1);
	const positionEpoch = overrides?.positionEpoch ?? 0;
	return { pieces, ids, turn: 'white', positionEpoch };
}

describe('SvgRenderer animation rendering (Phase 3.10)', () => {
	it('renderAnimations with null session clears animation root', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makeBoardSnapshot();
		const geometry = makeRenderGeometry(800, 'white');

		// Call renderAnimations with null session
		renderer.renderAnimations({
			session: null,
			board,
			geometry
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;
		expect(animationRoot.children.length).toBe(0);

		renderer.unmount();
	});

	it('renderAnimations with active session creates session group and renders frame', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// Board with piece at e4 (28)
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[sq(28)] = 1; // white pawn
		ids[sq(28)] = 1;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');

		// Create a mock animation session (piece moving from e2 to e4)
		const session: AnimationSession = {
			id: 1,
			tracks: [
				{
					pieceId: 1,
					fromSq: sq(12), // e2
					toSq: sq(28), // e4
					effect: 'move'
				}
			],
			startTime: performance.now(),
			duration: 180
		};

		// Call renderAnimations with active session
		renderer.renderAnimations({
			session,
			board,
			geometry
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;

		// Should have session group
		expect(animationRoot.children.length).toBe(1);
		const sessionGroup = animationRoot.children[0] as SVGGElement;
		expect(sessionGroup.getAttribute('data-session-id')).toBe('1');

		// Session group should have frame content (reserved child group with piece)
		expect(sessionGroup.children.length).toBeGreaterThan(0);

		renderer.unmount();
	});

	it('renderAnimations with two-track session renders both pieces', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// Board with king at e1 and rook at h1 (castling destination)
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[sq(6)] = 6; // white king at g1
		ids[sq(6)] = 1;
		pieces[sq(5)] = 4; // white rook at f1
		ids[sq(5)] = 2;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');

		// Create a two-track session (castling: king e1->g1, rook h1->f1)
		const session: AnimationSession = {
			id: 2,
			tracks: [
				{
					pieceId: 1,
					fromSq: sq(4), // e1
					toSq: sq(6), // g1
					effect: 'move'
				},
				{
					pieceId: 2,
					fromSq: sq(7), // h1
					toSq: sq(5), // f1
					effect: 'move'
				}
			],
			startTime: performance.now(),
			duration: 180
		};

		// Call renderAnimations
		renderer.renderAnimations({
			session,
			board,
			geometry
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;
		const sessionGroup = animationRoot.children[0] as SVGGElement;

		// Frame renderer should create reserved group with two pieces
		const frameGroup = sessionGroup.querySelector('g[data-layer-id="animation-frame"]');
		expect(frameGroup).not.toBeNull();
		expect(frameGroup!.children.length).toBe(2); // two animated pieces

		renderer.unmount();
	});

	it('renderBoard suppresses pieces in suppressedPieceIds set', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// Board with two pieces
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[sq(12)] = 1; // white pawn at e2
		ids[sq(12)] = 1;
		pieces[sq(28)] = 1; // white pawn at e4
		ids[sq(28)] = 2;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');

		// Suppress piece id=1
		const suppressedIds = new Set<number>([1]);

		renderer.renderBoard({
			board,
			geometry,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			suppressedPieceIds: suppressedIds
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		// Only one piece should be visible (id=2)
		expect(piecesRoot.children.length).toBe(1);

		renderer.unmount();
	});

	it('renderAnimations replaces session group when session id changes', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[sq(28)] = 1;
		ids[sq(28)] = 1;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');

		// First session
		const session1: AnimationSession = {
			id: 1,
			tracks: [{ pieceId: 1, fromSq: sq(12), toSq: sq(28), effect: 'move' }],
			startTime: performance.now(),
			duration: 180
		};

		renderer.renderAnimations({ session: session1, board, geometry });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;
		expect(animationRoot.children.length).toBe(1);
		expect((animationRoot.children[0] as SVGGElement).getAttribute('data-session-id')).toBe('1');

		// Second session with different id
		const session2: AnimationSession = {
			id: 2,
			tracks: [{ pieceId: 1, fromSq: sq(28), toSq: sq(44), effect: 'move' }],
			startTime: performance.now(),
			duration: 180
		};

		renderer.renderAnimations({ session: session2, board, geometry });

		// Should still have one session group, but with new id
		expect(animationRoot.children.length).toBe(1);
		expect((animationRoot.children[0] as SVGGElement).getAttribute('data-session-id')).toBe('2');

		renderer.unmount();
	});
});
