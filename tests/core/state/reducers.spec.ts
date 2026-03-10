import { describe, expect, it } from 'vitest';
import { createInitialState, type InternalState } from '../../../src/core/state/boardState';
import { fromAlgebraic } from '../../../src/core/state/coords';
import { decodePiece } from '../../../src/core/state/encode';
import {
	clearDirty,
	markDirtyLayer,
	markDirtySquare,
	move,
	select,
	setOrientation,
	setPosition,
	setTurn
} from '../../../src/core/state/reducers';
import type { PieceShort, PositionMapShort } from '../../../src/core/state/types';
import { DirtyLayer } from '../../../src/core/state/types';

describe('state/reducers', () => {
	it('setPosition with "start" initializes pieces, ids, selection, and sets turn from FEN', () => {
		const state = createInitialState(); // default start
		// Flip state to non-default values, then setPosition should reset them
		state.selected = fromAlgebraic('e4');

		setPosition(state, 'start');

		expect(state.pieces).toBeInstanceOf(Uint8Array);
		expect(state.pieces.length).toBe(64);
		expect(state.ids.length).toBe(64);

		// START_FEN has white to move
		expect(state.turn).toBe('white');
		expect(state.selected).toBeNull();

		// Dirty flags set for full redraw
		expect((state.dirtyLayers & DirtyLayer.Board) !== 0).toBe(true);
		expect((state.dirtyLayers & DirtyLayer.Pieces) !== 0).toBe(true);
	});

	it('setPosition with PositionMapShort encodes pieces and preserves current state.turn', () => {
		const state = createInitialState({ position: 'start', turn: 'black' }); // ensure non-default
		const m: PositionMapShort = {
			a1: { color: 'w', role: 'K' },
			a2: { color: 'w', role: 'p' },
			a7: { color: 'b', role: 'p' },
			a8: { color: 'b', role: 'K' }
		} satisfies Record<string, PieceShort>;

		setPosition(state, m);

		// Occupied squares encoded
		const a1 = fromAlgebraic('a1');
		const a2 = fromAlgebraic('a2');
		const a7 = fromAlgebraic('a7');
		const a8 = fromAlgebraic('a8');
		expect(state.pieces[a1]).not.toBe(0);
		expect(state.pieces[a2]).not.toBe(0);
		expect(state.pieces[a7]).not.toBe(0);
		expect(state.pieces[a8]).not.toBe(0);

		// Turn remains as previously set because maps don't carry turn
		expect(state.turn).toBe('black');
	});

	it('select updates selected without marking Board dirty', () => {
		const state = createInitialState({ position: 'start' });
		clearDirty(state);
		select(state, 'e4');
		expect(state.selected).toBe(fromAlgebraic('e4'));
		expect((state.dirtyLayers & DirtyLayer.Board) === 0).toBe(true);
	});

	it('move updates board, preserves id, toggles turn and marks dirty', () => {
		const state = createInitialState({
			// start from minimal map so we control the board
			position: {
				e2: { color: 'w', role: 'p' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		const from = fromAlgebraic('e2');
		const to = fromAlgebraic('e4');

		const idFrom = state.ids[from];
		expect(idFrom).not.toBe(-1);

		const moveResult = move(state, { from, to });

		// from is cleared, to is occupied
		expect(state.pieces[from]).toBe(0);
		expect(state.ids[from]).toBe(-1);
		expect(state.pieces[to]).not.toBe(0);
		expect(state.ids[to]).toBe(idFrom);

		// turn toggled
		expect(state.turn).toBe('black');

		expect(moveResult).not.toBeNull();
		expect(moveResult).toMatchObject({ from, to });
		// metadata for a quiet move
		expect(moveResult.moved.role).toBe('pawn');
		expect(moveResult.moved.color).toBe('white');
		expect(moveResult.captured).toBeUndefined();
		expect(moveResult.promotion).toBeUndefined();

		// dirty markers
		expect(state.dirtySquares.has(from)).toBe(true);
		expect(state.dirtySquares.has(to)).toBe(true);
		expect((state.dirtyLayers & DirtyLayer.Pieces) !== 0).toBe(true);
	});

	it('move applies promotion when provided (RolePromotionInput short or long)', () => {
		const setup = () =>
			createInitialState({
				position: {
					a7: { color: 'w', role: 'p' }
				} satisfies PositionMapShort,
				turn: 'white'
			});

		// Short form promotion
		{
			const state = setup();
			const moveResult = move(state, { from: 'a7', to: 'a8' }, { promotion: 'Q' });
			const code = state.pieces[fromAlgebraic('a8')];
			const piece = decodePiece(code);
			expect(piece).not.toBeNull();
			expect(piece!.role).toBe('queen');
			expect(piece!.color).toBe('white');

			// lastMove metadata includes promotion and moved piece (pre-promotion)
			expect(moveResult).not.toBeNull();
			expect(moveResult.promotion).toBe('queen');
			expect(moveResult.moved.role).toBe('pawn');
			expect(moveResult.moved.color).toBe('white');
		}

		// Long form promotion
		{
			const state = setup();
			const moveResult = move(state, { from: 'a7', to: 'a8' }, { promotion: 'queen' });
			const code = state.pieces[fromAlgebraic('a8')];
			const piece = decodePiece(code);
			expect(piece).not.toBeNull();
			expect(piece!.role).toBe('queen');
			expect(piece!.color).toBe('white');

			// moveResult metadata includes promotion and moved piece (pre-promotion)
			expect(moveResult).not.toBeNull();
			expect(moveResult.promotion).toBe('queen');
			expect(moveResult.moved.role).toBe('pawn');
			expect(moveResult.moved.color).toBe('white');
		}
	});

	it('move capture sets moveResult.captured with destination piece before overwrite', () => {
		const state = createInitialState({
			position: {
				e4: { color: 'w', role: 'p' },
				e5: { color: 'b', role: 'p' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		const moveResult = move(state, { from: 'e4', to: 'e5' });

		expect(moveResult).not.toBeNull();
		expect(moveResult.moved.role).toBe('pawn');
		expect(moveResult.moved.color).toBe('white');
		expect(moveResult.captured).toBeDefined();
		expect(moveResult.captured!.role).toBe('pawn');
		expect(moveResult.captured!.color).toBe('black');
	});
	it('en passant-like capture clears capturedSquare', () => {
		const state = createInitialState({
			position: {
				e5: { color: 'w', role: 'p' },
				d5: { color: 'b', role: 'p' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		const moveResult = move(state, { from: 'e5', to: 'd6' }, { capturedSquare: 'd5' });

		const d5 = fromAlgebraic('d5');
		const d6 = fromAlgebraic('d6');
		const e5 = fromAlgebraic('e5');

		// EP-like capture removed pawn from d5, moved to d6
		expect(state.pieces[d5]).toBe(0);
		expect(state.ids[d5]).toBe(-1);
		expect(state.pieces[e5]).toBe(0);
		expect(state.pieces[d6]).not.toBe(0);

		expect(moveResult).not.toBeNull();
		expect(moveResult.captured).toBeDefined();
		expect(moveResult.captured!.role).toBe('pawn');
		expect(moveResult.captured!.color).toBe('black');
		expect(moveResult.capturedSquare).toBe(d5);

		// Dirty markers include capture square
		expect(state.dirtySquares.has(d5)).toBe(true);
	});

	it('castling moves rook and returns castling metadata', () => {
		const state = createInitialState({
			position: {
				e1: { color: 'w', role: 'K' },
				h1: { color: 'w', role: 'R' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		const e1 = fromAlgebraic('e1');
		const g1 = fromAlgebraic('g1');
		const h1 = fromAlgebraic('h1');
		const f1 = fromAlgebraic('f1');

		const moveResult = move(
			state,
			{ from: 'e1', to: 'g1', castleSide: 'kingside' },
			{ castle: { rookFrom: 'h1', rookTo: 'f1' } }
		);

		// King moved e1 -> g1
		expect(state.pieces[e1]).toBe(0);
		expect(state.pieces[g1]).not.toBe(0);

		// Rook moved h1 -> f1
		const rookAtF1 = decodePiece(state.pieces[f1]);
		expect(rookAtF1).not.toBeNull();
		expect(rookAtF1!.role).toBe('rook');
		expect(rookAtF1!.color).toBe('white');
		expect(state.pieces[h1]).toBe(0);

		// Returned move metadata
		expect(moveResult).not.toBeNull();
		expect(moveResult.castleSide).toBe('kingside');
		expect(moveResult.castle).toBeDefined();
		expect(moveResult.castle!.rookFrom).toBe(h1);
		expect(moveResult.castle!.rookTo).toBe(f1);
	});

	it('setTurn updates turn without marking Board dirty', () => {
		const state = createInitialState({ position: 'start', turn: 'white' });
		clearDirty(state);
		setTurn(state, 'black');
		expect(state.turn).toBe('black');
		expect((state.dirtyLayers & DirtyLayer.Board) === 0).toBe(true);
	});

	it('setTurn and setOrientation accept short color inputs', () => {
		const state = createInitialState({ position: 'start', turn: 'white', orientation: 'white' });
		setTurn(state, 'b');
		setOrientation(state, 'b');
		expect(state.turn).toBe('black');
		expect(state.orientation).toBe('black');
	});

	it('dirty helpers: markDirtySquare/markDirtyLayer/clearDirty behavior', () => {
		const state: InternalState = createInitialState({ position: 'start' });
		clearDirty(state);
		const e4 = fromAlgebraic('e4');
		markDirtySquare(state, e4);
		expect(state.dirtySquares.has(e4)).toBe(true);

		const mask = DirtyLayer.Board | DirtyLayer.Pieces;
		markDirtyLayer(state, mask);
		expect((state.dirtyLayers & DirtyLayer.Board) !== 0).toBe(true);
		expect((state.dirtyLayers & DirtyLayer.Pieces) !== 0).toBe(true);

		clearDirty(state);
		expect(state.dirtySquares.size).toBe(0);
		expect(state.dirtyLayers).toBe(0);
	});
});
