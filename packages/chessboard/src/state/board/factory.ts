import { cloneDeep } from 'es-toolkit/object';
import { isNormalizedMoveRequest } from './check.js';
import { normalizeColor, normalizeMoveRequest } from './normalize.js';
import { boardParsePiecePositionInput, boardParsePosition } from './position.js';
import { boardMove, boardSetPiecePosition, boardSetPosition, boardSetTurn } from './reducers.js';
import { PositionInput } from './types/input.js';
import { BoardState, BoardStateInternal } from './types/main.js';

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
			return mutationSession.addMutation(
				'state.board.setPosition',
				boardSetPosition(internalState, position)
			);
		},
		setPiecePosition(input, mutationSession) {
			const pieces = boardParsePiecePositionInput(input);
			return mutationSession.addMutation(
				'state.board.setPiecePosition',
				boardSetPiecePosition(internalState, pieces)
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
