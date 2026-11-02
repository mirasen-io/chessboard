import type {
	ColorInput,
	Chessboard as CoreChessboard,
	MovabilityInput,
	MoveOutput,
	MoveRequestInput,
	PositionInput,
	SquareString
} from '@mirasen/chessboard';
import type { CSSProperties } from 'react';

export type ChessboardHandle = CoreChessboard;

export type BoardOrientation = ColorInput;

export type PositionRequest = {
	id: string | number;
	position: PositionInput;
};

export type ExternalMoveRequest = {
	id: string | number;
	move: MoveRequestInput;
};

export type ChessboardProps = {
	position: PositionRequest;
	externalMove?: ExternalMoveRequest;
	orientation?: BoardOrientation;
	movability?: MovabilityInput;
	onUIMove?: (move: MoveOutput) => void;
	autoPromoteToQueen?: boolean;
	checkSquare?: SquareString | ColorInput | null;
	className?: string;
	style?: CSSProperties;
};
