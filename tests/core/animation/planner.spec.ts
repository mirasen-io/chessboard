import { describe, expect, it } from 'vitest';
import { calculateAnimationTracks } from '../../../src/animation/planner';
import { fromAlgebraic } from '../../../src/state/board/coords';
import { encodePiece } from '../../../src/state/board/encode';
import type { BoardStateSnapshot } from '../../../src/state/board/types';

function snap(pos: Record<string, Parameters<typeof encodePiece>[0]>): BoardStateSnapshot {
	const pieces = new Uint8Array(64);
	for (const [sq, piece] of Object.entries(pos)) {
		pieces[fromAlgebraic(sq as never)] = encodePiece(piece);
	}
	return { pieces, turn: 'white', positionEpoch: 0 };
}

const sq = (s: string) => fromAlgebraic(s as never);

describe('calculateAnimationTracks', () => {
	it('simple pawn move e2→e4 produces one move track', () => {
		const pos1 = snap({ e2: { color: 'white', role: 'pawn' } });
		const pos2 = snap({ e4: { color: 'white', role: 'pawn' } });

		const tracks = calculateAnimationTracks(pos1, pos2);

		expect(tracks).toHaveLength(1);
		const [t] = tracks;
		expect(t.effect).toBe('move');
		expect(t.piece).toEqual({ color: 'white', role: 'pawn' });
		if (t.effect === 'move') {
			expect(t.fromSq).toBe(sq('e2'));
			expect(t.toSq).toBe(sq('e4'));
		}
	});

	it('kingside castling produces two move tracks (king + rook)', () => {
		const pos1 = snap({
			e1: { color: 'white', role: 'king' },
			h1: { color: 'white', role: 'rook' }
		});
		const pos2 = snap({
			g1: { color: 'white', role: 'king' },
			f1: { color: 'white', role: 'rook' }
		});

		const tracks = calculateAnimationTracks(pos1, pos2);

		expect(tracks).toHaveLength(2);
		expect(tracks.every((t) => t.effect === 'move')).toBe(true);

		const kingTrack = tracks.find((t) => t.effect === 'move' && t.fromSq === sq('e1'));
		const rookTrack = tracks.find((t) => t.effect === 'move' && t.fromSq === sq('h1'));

		expect(kingTrack).toBeDefined();
		expect(rookTrack).toBeDefined();
		if (kingTrack?.effect === 'move') expect(kingTrack.toSq).toBe(sq('g1'));
		if (rookTrack?.effect === 'move') expect(rookTrack.toSq).toBe(sq('f1'));
	});

	it('capture: white rook takes black pawn → move track + static track on target square', () => {
		const pos1 = snap({
			e1: { color: 'white', role: 'rook' },
			e5: { color: 'black', role: 'pawn' }
		});
		const pos2 = snap({
			e5: { color: 'white', role: 'rook' }
		});

		const tracks = calculateAnimationTracks(pos1, pos2);

		expect(tracks).toHaveLength(2);

		const moveTrack = tracks.find((t) => t.effect === 'move');
		expect(moveTrack).toBeDefined();
		expect(moveTrack?.piece).toEqual({ color: 'white', role: 'rook' });
		if (moveTrack?.effect === 'move') {
			expect(moveTrack.fromSq).toBe(sq('e1'));
			expect(moveTrack.toSq).toBe(sq('e5'));
		}

		const staticTrack = tracks.find((t) => t.effect === 'static');
		expect(staticTrack).toBeDefined();
		expect(staticTrack?.piece).toEqual({ color: 'black', role: 'pawn' });
		if (staticTrack?.effect === 'static') {
			expect(staticTrack.sq).toBe(sq('e5'));
		}
	});
});
