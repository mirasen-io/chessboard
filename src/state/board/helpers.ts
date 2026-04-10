import { decodePiece } from './encode';
import type { BoardStateSnapshot, Piece, Square } from './types';

export function getPieceAt(board: BoardStateSnapshot, sq: Square): Piece | null {
	const encoded = board.pieces[sq];
	return decodePiece(encoded);
}

export function isOccupied(board: BoardStateSnapshot, sq: Square): boolean {
	return board.pieces[sq] > 0;
}
