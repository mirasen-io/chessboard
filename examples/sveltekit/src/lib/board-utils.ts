import type { Chessboard, ChessboardExtensionInput, MoveRequestInput } from '@mirasen/chessboard';

export function fileOf(square: number): string {
	return 'abcdefgh'[square % 8];
}

export function rankOf(square: number): number {
	return Math.floor(square / 8) + 1;
}

export function algebraic(square: number): string {
	return `${fileOf(square)}${rankOf(square)}`;
}

export function randomMove<const T extends readonly ChessboardExtensionInput[]>(
	board: Chessboard<T>
): void {
	const snapshot = board.getSnapshot();
	let pieceCode = 0;
	let fromSquare = '';
	while (pieceCode <= 0) {
		const square = Math.floor(Math.random() * 64);
		pieceCode = snapshot.state.board.pieces[square];
		fromSquare = algebraic(square);
	}
	let toSquare = fromSquare;
	while (toSquare === fromSquare) {
		toSquare = algebraic(Math.floor(Math.random() * 64));
	}
	board.move({ from: fromSquare, to: toSquare } as MoveRequestInput);
}
