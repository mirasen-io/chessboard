import { fileOf, rankOf } from '../state/board/coords';
import { decodePiece } from '../state/board/encode';
import { BoardStateSnapshot, Square } from '../state/board/types';
import { AnimationTrack } from './types';

// Precomputed squared distance: (dFile² + dRank²) for all square pairs.
// Max value = 7² + 7² = 98, fits in Uint8. Index: a * 64 + b.
const SQUARE_DIST = new Uint8Array(64 * 64);
for (let a = 0; a < 64; a++) {
	for (let b = 0; b < 64; b++) {
		const df = fileOf(a as Square) - fileOf(b as Square);
		const dr = rankOf(a as Square) - rankOf(b as Square);
		SQUARE_DIST[a * 64 + b] = df * df + dr * dr;
	}
}

export function calculateAnimationTracks(
	pos1: BoardStateSnapshot,
	pos2: BoardStateSnapshot
): AnimationTrack[] {
	const tracks: AnimationTrack[] = [];
	let nextId = 0;

	// Step 1: collect changed squares into removed/added lists
	type Entry = { code: number; sq: number };
	const removed: Entry[] = [];
	const added: Entry[] = [];

	for (let sq = 0; sq < 64; sq++) {
		const c1 = pos1.pieces[sq];
		const c2 = pos2.pieces[sq];
		if (c1 === c2) continue;
		if (c1 !== 0) removed.push({ code: c1, sq });
		if (c2 !== 0) added.push({ code: c2, sq });
	}

	// Step 2: greedy min-distance matching of same-code pairs → move tracks
	const removedMatched = new Uint8Array(removed.length);
	const addedMatched = new Uint8Array(added.length);
	// toSq → code of the piece that moved there (used for static detection)
	const movedToSqCode = new Map<number, number>();

	const candidates: { dist: number; ri: number; ai: number }[] = [];
	for (let ri = 0; ri < removed.length; ri++) {
		for (let ai = 0; ai < added.length; ai++) {
			if (removed[ri].code !== added[ai].code) continue;
			candidates.push({ dist: SQUARE_DIST[removed[ri].sq * 64 + added[ai].sq], ri, ai });
		}
	}
	candidates.sort((a, b) => a.dist - b.dist);

	for (const { ri, ai } of candidates) {
		if (removedMatched[ri] || addedMatched[ai]) continue;
		removedMatched[ri] = 1;
		addedMatched[ai] = 1;
		movedToSqCode.set(added[ai].sq, removed[ri].code);
		tracks.push({
			id: nextId++,
			piece: decodePiece(removed[ri].code)!,
			fromSq: removed[ri].sq as Square,
			toSq: added[ai].sq as Square,
			effect: 'move'
		});
	}

	// Step 3: unmatched added → fade-in
	for (let ai = 0; ai < added.length; ai++) {
		if (addedMatched[ai]) continue;
		tracks.push({
			id: nextId++,
			piece: decodePiece(added[ai].code)!,
			sq: added[ai].sq as Square,
			effect: 'fade-in'
		});
	}

	// Step 4: unmatched removed → fade-out or static
	for (let ri = 0; ri < removed.length; ri++) {
		if (removedMatched[ri]) continue;
		const { code, sq } = removed[ri];
		const movedCode = movedToSqCode.get(sq);
		const isCapture =
			movedCode !== undefined && decodePiece(code)!.color !== decodePiece(movedCode)!.color;
		const piece = decodePiece(code)!;
		if (isCapture) {
			tracks.push({ id: nextId++, piece, sq: sq as Square, effect: 'static' });
		} else {
			tracks.push({ id: nextId++, piece, sq: sq as Square, effect: 'fade-out' });
		}
	}

	return tracks;
}
