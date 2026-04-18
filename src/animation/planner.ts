import { WritableDeep } from 'type-fest';
import { isNonEmptyPieceCode } from '../state/board/check';
import { fileOf, rankOf } from '../state/board/coords';
import { NonEmptyPieceCode, PieceCode, Square, SQUARE_COUNT } from '../state/board/types/internal';
import { BoardStateSnapshot } from '../state/board/types/main';
import {
	AnimationPlan,
	AnimationTrack,
	AnimationTrackExclude,
	CalculateAnimationTracksOptions,
	isMoveExclude,
	isSquareExclude
} from './types';

// Precomputed squared distance: (dFile² + dRank²) for all square pairs.
// Max value = 7² + 7² = 98, fits in Uint8. Index: a * 64 + b.
const SQUARE_DIST = new Uint8Array(SQUARE_COUNT * SQUARE_COUNT);
for (let a = 0; a < SQUARE_COUNT; a++) {
	for (let b = 0; b < SQUARE_COUNT; b++) {
		const df = fileOf(a as Square) - fileOf(b as Square);
		const dr = rankOf(a as Square) - rankOf(b as Square);
		SQUARE_DIST[a * SQUARE_COUNT + b] = df * df + dr * dr;
	}
}

export function collectSuppressedSquares(tracks: AnimationTrack[]): ReadonlySet<Square> {
	const result = new Set<Square>();
	for (const track of tracks) {
		if (track.effect === 'move') {
			result.add(track.fromSq);
			result.add(track.toSq);
		} else {
			result.add(track.sq);
		}
	}
	return result;
}

export function calculateAnimationTracks(
	pos1: BoardStateSnapshot,
	pos2: BoardStateSnapshot,
	options?: CalculateAnimationTracksOptions
): AnimationTrack[] {
	const tracks: AnimationTrack[] = [];
	let nextId = 0;

	// Step 1: collect changed squares into removed/added lists
	type Entry = { pieceCode: NonEmptyPieceCode; sq: Square };
	const removed: Entry[] = [];
	const added: Entry[] = [];

	for (let sq = 0; sq < SQUARE_COUNT; sq++) {
		const c1 = pos1.pieces[sq] as PieceCode;
		const c2 = pos2.pieces[sq] as PieceCode;
		if (c1 === c2) continue;
		if (isNonEmptyPieceCode(c1)) removed.push({ pieceCode: c1, sq: sq as Square });
		if (isNonEmptyPieceCode(c2)) added.push({ pieceCode: c2, sq: sq as Square });
	}

	// Step 2: greedy min-distance matching of same-code pairs → move tracks
	const removedMatched = new Uint8Array(removed.length);
	const addedMatched = new Uint8Array(added.length);
	// toSq → code of the piece that moved there (used for static detection)
	const movedToSqCode = new Map<number, number>();

	const candidates: { dist: number; ri: number; ai: number }[] = [];
	for (let ri = 0; ri < removed.length; ri++) {
		for (let ai = 0; ai < added.length; ai++) {
			if (removed[ri].pieceCode !== added[ai].pieceCode) continue;
			candidates.push({ dist: SQUARE_DIST[removed[ri].sq * SQUARE_COUNT + added[ai].sq], ri, ai });
		}
	}
	candidates.sort((a, b) => a.dist - b.dist);

	const excl = options?.exclude;
	const preparedExcl = prepareExclude(excl);
	for (const { ri, ai } of candidates) {
		if (removedMatched[ri] || addedMatched[ai]) continue;
		removedMatched[ri] = 1;
		addedMatched[ai] = 1;
		movedToSqCode.set(added[ai].sq, removed[ri].pieceCode);
		if (
			excl &&
			preparedExcl.move.has(removed[ri].sq) &&
			preparedExcl.move.get(removed[ri].sq)!.has(added[ai].sq)
		) {
			// Suppress this move track but keep both squares matched so they don't become fades.
			continue;
		}
		tracks.push({
			id: nextId++,
			pieceCode: removed[ri].pieceCode,
			fromSq: removed[ri].sq,
			toSq: added[ai].sq,
			effect: 'move'
		});
	}

	// Step 3: unmatched added → fade-in
	for (let ai = 0; ai < added.length; ai++) {
		if (addedMatched[ai]) continue;
		if (preparedExcl.square.has(added[ai].sq)) {
			continue;
		}
		tracks.push({
			id: nextId++,
			pieceCode: added[ai].pieceCode,
			sq: added[ai].sq,
			effect: 'fade-in'
		});
	}

	// Step 4: unmatched removed → fade-out or static
	for (let ri = 0; ri < removed.length; ri++) {
		if (removedMatched[ri]) continue;
		if (preparedExcl.square.has(removed[ri].sq)) {
			continue;
		}
		const { pieceCode: code, sq } = removed[ri];
		/*const movedCode = movedToSqCode.get(sq);
		const isCapture =
			movedCode !== undefined && fromPieceCode(code).color !== fromPieceCode(movedCode).color;*/
		const pieceCode = code;
		tracks.push({ id: nextId++, pieceCode, sq, effect: 'fade-out' });
	}

	return tracks;
}

export function calculateAnimationPlan(
	pos1: BoardStateSnapshot,
	pos2: BoardStateSnapshot,
	sessionId: number,
	options?: CalculateAnimationTracksOptions
): AnimationPlan {
	return { sessionId, tracks: calculateAnimationTracks(pos1, pos2, options) };
}

interface PrepAnimationTrackExclude {
	move: ReadonlyMap<Square, ReadonlySet<Square>>;
	square: Set<Square>;
}

function prepareExclude(exclude?: AnimationTrackExclude[]): PrepAnimationTrackExclude {
	const result: WritableDeep<PrepAnimationTrackExclude> = { move: new Map(), square: new Set() };
	if (!exclude) return result;
	for (const e of exclude) {
		if (isMoveExclude(e)) {
			if (!result.move.has(e.fromSq)) {
				result.move.set(e.fromSq, new Set());
			}
			result.move.get(e.fromSq)!.add(e.toSq);
		} else if (isSquareExclude(e)) {
			result.square.add(e.sq);
		}
	}
	return result;
}
