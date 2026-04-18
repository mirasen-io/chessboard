import { cloneDeep } from 'es-toolkit/object';
import { isNormalizedMoveRequest } from './check';
import { normalizeColor, normalizeMoveRequest } from './normalize';
import { boardParsePiecePositionInput, boardParsePosition } from './position';
import { boardMove, boardSetPosition, boardSetTurn } from './reducers';
import { PositionInput } from './types/input';
import { BoardState, BoardStateInternal } from './types/main';

function createBoardStateInternal(position: PositionInput): BoardStateInternal {
	const parsedPosition = boardParsePosition(position);
	return {
		pieces: parsedPosition.pieces,
		turn: parsedPosition.turn,
		positionEpoch: 0
	};
}

export function createBoardState(position?: PositionInput): BoardState {
	const internalState = createBoardStateInternal(position ?? 'start');

	return {
		setPosition(input, mutationSession) {
			const position = boardParsePosition(input);
			let changed = boardSetPosition(internalState, position.pieces);
			changed = boardSetTurn(internalState, position.turn) || changed;
			return mutationSession.addMutation('state.board.setPosition', changed);
		},
		setPiecePosition(input, mutationSession) {
			const pieces = boardParsePiecePositionInput(input);
			return mutationSession.addMutation(
				'state.board.setPiecePosition',
				boardSetPosition(internalState, pieces)
			);
		},
		setTurn(turn, mutationSession) {
			const normalizedTurn = normalizeColor(turn);
			return mutationSession.addMutation(
				'state.board.setTurn',
				boardSetTurn(internalState, normalizedTurn)
			);
		},
		move(request, mutationSession) {
			const moveRequest = isNormalizedMoveRequest(request)
				? request
				: normalizeMoveRequest(request);
			const result = boardMove(internalState, moveRequest);
			mutationSession.addMutation('state.board.move', true, result);
			return result;
		},
		getPieceCodeAt(square) {
			return internalState.pieces[square];
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
