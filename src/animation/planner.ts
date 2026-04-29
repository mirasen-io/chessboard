import assert from '@ktarmyshov/assert';
import { isNonEmptyPieceCode } from '../state/board/check.js';
import { fileOf, rankOf } from '../state/board/coords.js';
import {
	MoveSnapshot,
	type NonEmptyPieceCode,
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../state/board/types/internal.js';
import { BoardStateSnapshot } from '../state/board/types/main.js';
import { baseMovesEqual } from '../state/change/helpers.js';
import { ChangeStateSnapshot } from '../state/change/types/main.js';
import type {
	AnimationPlan,
	AnimationPlanningInput,
	AnimationPlanningInputSnapshot,
	AnimationPlanningSnapshot,
	AnimationTrack
} from './types.js';

// ---------------------------------------------------------------------------
// Precomputed squared distance: (dFile² + dRank²) for all square pairs.
// Max value = 7² + 7² = 98, fits in Uint8.  Index: a * 64 + b.
// ---------------------------------------------------------------------------
const SQUARE_DIST = new Uint8Array(SQUARE_COUNT * SQUARE_COUNT);
for (let a = 0; a < SQUARE_COUNT; a++) {
	for (let b = 0; b < SQUARE_COUNT; b++) {
		const df = fileOf(a as Square) - fileOf(b as Square);
		const dr = rankOf(a as Square) - rankOf(b as Square);
		SQUARE_DIST[a * SQUARE_COUNT + b] = df * df + dr * dr;
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Internal exclude spec used to suppress specific tracks during planning. */
interface ExcludeSpec {
	/** Suppressed move pairs: fromSq → Set<toSq>. */
	readonly move: Map<Square, Set<Square>>;
	/** Suppressed individual squares (no fade-in/out emitted for these). */
	readonly square: Set<Square>;
}

const EMPTY_EXCLUDE: ExcludeSpec = {
	move: new Map(),
	square: new Set()
};

/**
 * Detect whether a lifted-piece-drag was just completed (dropped).
 *
 * Condition:
 * - previous snapshot had an active lifted-piece-drag session
 * - current snapshot has no drag session
 * - current snapshot has a lastMove
 *
 * Returns the lastMove when the condition holds, otherwise null.
 */
function detectLiftedPieceDrop(
	previous: AnimationPlanningSnapshot,
	current: AnimationPlanningSnapshot
): MoveSnapshot | null {
	const prevDrag = previous.interaction.dragSession;
	if (!prevDrag || prevDrag.type !== 'lifted-piece-drag') return null;
	if (current.interaction.dragSession !== null) return null;
	return current.change.lastMove ?? null;
}

/**
 * Build an ExcludeSpec that suppresses the move track and both endpoint
 * fades for a given lastMove (used when a lifted-piece drop is detected).
 */
function buildExcludeForDrop(lastMove: MoveSnapshot): ExcludeSpec {
	const moveMap = new Map<Square, Set<Square>>();
	moveMap.set(lastMove.from, new Set([lastMove.to]));
	const squareSet = new Set<Square>([lastMove.from, lastMove.to]);
	return { move: moveMap, square: squareSet };
}

/**
 * Normalize a snapshot by incorporating a pending deferredUIMoveRequest
 * into the board and lastMove.  Currently limited to pawn moves.
 *
 * If there is no deferred request the snapshot is returned as-is.
 */
function buildEffectiveAnimationPlanningSnapshot(
	state: AnimationPlanningInputSnapshot
): AnimationPlanningSnapshot {
	const request = state.change.deferredUIMoveRequest;
	if (request === null) return { ...state, lastMoveSource: 'state' }; // nothing to do
	const newPieces = new Uint8Array(state.board.pieces);
	const from = request.sourceSquare;
	const to = request.destination.to;
	const pieceCode = state.board.pieces[from];
	assert(
		pieceCode === PieceCode.WhitePawn || pieceCode === PieceCode.BlackPawn,
		'Only pawn moves should be deferred UI move requests at this time'
	);
	newPieces[to] = pieceCode;
	newPieces[from] = PieceCode.Empty;
	const newBoard: BoardStateSnapshot = {
		...state.board,
		pieces: newPieces
	};
	const newLastMove: MoveSnapshot = {
		from,
		to,
		piece: pieceCode
	};
	const newChange: ChangeStateSnapshot = {
		...state.change,
		deferredUIMoveRequest: null,
		lastMove: newLastMove
	};
	return {
		...state,
		board: newBoard,
		change: newChange,
		lastMoveSource: 'projected-deferred-ui-move'
	};
}

function normalizePromotionEffectiveCurrent(
	previous: AnimationPlanningSnapshot,
	current: AnimationPlanningSnapshot
): AnimationPlanningSnapshot {
	const lastMove = current.change.lastMove;

	if (
		current.change.deferredUIMoveRequest !== null ||
		lastMove === null ||
		lastMove.promotedTo === undefined
	) {
		return current;
	}

	if (previous.lastMoveSource === 'projected-deferred-ui-move') {
		const previousLastMove = previous.change.lastMove;

		if (previousLastMove === null || !baseMovesEqual(previousLastMove, lastMove)) {
			return current;
		}
	} else if (previous.board.pieces[lastMove.from] !== lastMove.piece) {
		return current;
	}

	const newPieces = new Uint8Array(current.board.pieces);
	newPieces[lastMove.to] = lastMove.piece;

	const newBoard: BoardStateSnapshot = {
		...current.board,
		pieces: newPieces
	};

	return {
		...current,
		board: newBoard
	};
}

/**
 * Collect suppressed squares purely from the given tracks.
 * For move tracks both endpoints are included; for fade/static the single square.
 */
function collectSuppressedSquaresFromTracks(tracks: readonly AnimationTrack[]): Set<Square> {
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

/**
 * Low-level track calculation.
 *
 * Compares two board snapshots (already derived / effective), applies the
 * provided exclude spec, and returns the resulting animation tracks.
 */
function calculateTracks(
	prevBoard: BoardStateSnapshot,
	currBoard: BoardStateSnapshot,
	exclude: ExcludeSpec
): AnimationTrack[] {
	const tracks: AnimationTrack[] = [];
	let nextId = 0;

	// Step 1: collect changed squares into removed / added lists
	type Entry = { pieceCode: NonEmptyPieceCode; sq: Square };
	const removed: Entry[] = [];
	const added: Entry[] = [];

	for (let sq = 0; sq < SQUARE_COUNT; sq++) {
		const c1 = prevBoard.pieces[sq] as PieceCode;
		const c2 = currBoard.pieces[sq] as PieceCode;
		if (c1 === c2) continue;
		if (isNonEmptyPieceCode(c1)) removed.push({ pieceCode: c1, sq: sq as Square });
		if (isNonEmptyPieceCode(c2)) added.push({ pieceCode: c2, sq: sq as Square });
	}

	// Step 2: greedy min-distance matching of same-code pairs → move tracks
	const removedMatched = new Uint8Array(removed.length);
	const addedMatched = new Uint8Array(added.length);

	const candidates: { dist: number; ri: number; ai: number }[] = [];
	for (let ri = 0; ri < removed.length; ri++) {
		for (let ai = 0; ai < added.length; ai++) {
			if (removed[ri].pieceCode !== added[ai].pieceCode) continue;
			candidates.push({
				dist: SQUARE_DIST[removed[ri].sq * SQUARE_COUNT + added[ai].sq],
				ri,
				ai
			});
		}
	}
	candidates.sort((a, b) => a.dist - b.dist);

	for (const { ri, ai } of candidates) {
		if (removedMatched[ri] || addedMatched[ai]) continue;
		removedMatched[ri] = 1;
		addedMatched[ai] = 1;
		// Check if this move pair is excluded (e.g. lifted-piece drop)
		const fromSet = exclude.move.get(removed[ri].sq);
		if (fromSet && fromSet.has(added[ai].sq)) {
			// Suppress the move track but keep both entries matched so they
			// don't turn into fades.
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
		if (exclude.square.has(added[ai].sq)) continue;
		tracks.push({
			id: nextId++,
			pieceCode: added[ai].pieceCode,
			sq: added[ai].sq,
			effect: 'fade-in'
		});
	}

	// Step 4: unmatched removed → fade-out
	for (let ri = 0; ri < removed.length; ri++) {
		if (removedMatched[ri]) continue;
		if (exclude.square.has(removed[ri].sq)) continue;
		tracks.push({
			id: nextId++,
			pieceCode: removed[ri].pieceCode,
			sq: removed[ri].sq,
			effect: 'fade-out'
		});
	}

	return tracks;
}

// ---------------------------------------------------------------------------
// Public API — single orchestrator
// ---------------------------------------------------------------------------

/**
 * Plan animation tracks and suppressed squares for a state transition.
 *
 * This is the single entry point for animation planning.  It:
 * 1. Normalizes both snapshots (incorporates deferredUIMoveRequest).
 * 2. Detects lifted-piece-drag drop completion and builds an internal exclude.
 * 3. Computes tracks via greedy min-distance matching.
 * 4. Assembles the full suppressedSquares set (track-derived + excluded drop endpoints).
 */
export function calculateAnimationPlan(input: AnimationPlanningInput): AnimationPlan {
	// 1) Normalize snapshots to account for deferredUIMoveRequest
	const effectivePrevious = buildEffectiveAnimationPlanningSnapshot(input.previous);
	const effectiveCurrent = buildEffectiveAnimationPlanningSnapshot(input.current);

	// 2) Detect lifted-piece drop and prepare exclude spec
	const droppedMove = detectLiftedPieceDrop(effectivePrevious, effectiveCurrent);
	const exclude = droppedMove !== null ? buildExcludeForDrop(droppedMove) : EMPTY_EXCLUDE;

	// 3) Normalize current promoted piece when the promoted move belongs to this transition
	const planningCurrent = normalizePromotionEffectiveCurrent(effectivePrevious, effectiveCurrent);

	// 4) Calculate tracks
	const tracks = calculateTracks(effectivePrevious.board, planningCurrent.board, exclude);

	// 5) Build suppressedSquares: track-derived + excluded drop endpoints
	const suppressed = collectSuppressedSquaresFromTracks(tracks);

	const result: AnimationPlan = {
		tracks,
		suppressedSquares: suppressed
	};

	return result;
}
