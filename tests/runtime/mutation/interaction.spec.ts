import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import { reconcileInteractionSelectionAfterBoardStateChange } from '../../../src/runtime/mutation/interaction.js';
import type { RuntimeMutationPayloadByCause } from '../../../src/runtime/mutation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode } from '../../../src/state/board/types/internal.js';
import { createRuntimeState } from '../../../src/state/factory.js';
import { createMockPipeContext } from '../../test-utils/runtime/mutation.js';

function createSession() {
	return createMutationSession<RuntimeMutationPayloadByCause>();
}

describe('reconcileInteractionSelectionAfterBoardStateChange', () => {
	it('no-op when session has no state.board. prefix mutations', () => {
		const state = createRuntimeState({});
		const context = createMockPipeContext({ state });
		const session = createSession();
		// Select a piece first
		const interactionSession = createSession();
		state.interaction.setSelected(
			{ square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn },
			interactionSession
		);

		// Only a non-board mutation
		session.addMutation('state.view.setOrientation', true);

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		// Selection should remain
		expect(state.interaction.selected).not.toBeNull();
		expect(state.interaction.selected!.square).toBe(normalizeSquare('e2'));
	});

	it('no-op when session has state.interaction.clear cause', () => {
		const state = createRuntimeState({});
		const context = createMockPipeContext({ state });
		const session = createSession();
		const interactionSession = createSession();
		state.interaction.setSelected(
			{ square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn },
			interactionSession
		);

		session.addMutation('state.board.setPosition', true);
		session.addMutation('state.interaction.clear', true);

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		// Should not touch interaction since clear is already in session
		expect(state.interaction.selected).not.toBeNull();
	});

	it('no-op when session has runtime.interaction.completeCoreDragTo cause', () => {
		const state = createRuntimeState({});
		const context = createMockPipeContext({ state });
		const session = createSession();
		const interactionSession = createSession();
		state.interaction.setSelected(
			{ square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn },
			interactionSession
		);

		session.addMutation('state.board.move', true, {
			from: normalizeSquare('e2'),
			to: normalizeSquare('e4'),
			piece: PieceCode.WhitePawn
		});
		session.addMutation('runtime.interaction.completeCoreDragTo', true, {
			owner: 'core' as const,
			type: 'lifted-piece-drag' as const,
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4')
		});

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		// Should not touch interaction since completeCoreDragTo handled it
		expect(state.interaction.selected).not.toBeNull();
	});

	it('clears interaction when selected square is now empty after board mutation', () => {
		const state = createRuntimeState({ board: { pieces: { e2: 'wP' } } });
		const context = createMockPipeContext({ state });

		// Select the piece at e2
		const interactionSession = createSession();
		state.interaction.setSelected(
			{ square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn },
			interactionSession
		);
		expect(state.interaction.selected).not.toBeNull();

		// Now remove the piece from the board (simulate via setPosition)
		const boardSession = createSession();
		state.board.setPosition({ pieces: {} }, boardSession);

		// Run pipe with board mutation recorded
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		expect(state.interaction.selected).toBeNull();
	});

	it('does not clear interaction when selected piece still present', () => {
		const state = createRuntimeState({});
		const context = createMockPipeContext({ state });

		// Select the piece at e2 (default start position has wP on e2)
		const interactionSession = createSession();
		state.interaction.setSelected(
			{ square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn },
			interactionSession
		);

		// Board mutation that doesn't affect e2
		const boardSession = createSession();
		state.board.setPosition({ pieces: { e2: 'wP', d7: 'bP' } }, boardSession);

		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		// Selection should remain since e2 still has wP
		expect(state.interaction.selected).not.toBeNull();
		expect(state.interaction.selected!.square).toBe(normalizeSquare('e2'));
	});

	it('clears interaction when piece code at selected square changed', () => {
		const state = createRuntimeState({});
		const context = createMockPipeContext({ state });

		// Select wP at e2
		const interactionSession = createSession();
		state.interaction.setSelected(
			{ square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn },
			interactionSession
		);

		// Change e2 to a different piece
		const boardSession = createSession();
		state.board.setPosition({ pieces: { e2: 'wQ' } }, boardSession);

		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		// Selection should be cleared since piece changed
		expect(state.interaction.selected).toBeNull();
	});

	it('no-op when no piece is selected even with board mutations', () => {
		const state = createRuntimeState({});
		const context = createMockPipeContext({ state });

		// No selection
		expect(state.interaction.selected).toBeNull();

		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		reconcileInteractionSelectionAfterBoardStateChange(context, session);

		expect(state.interaction.selected).toBeNull();
	});
});
