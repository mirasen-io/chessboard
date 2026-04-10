import { Piece } from '../../state/board/types';
import { MAP_ROLE_TO_SHORT, PieceKeyShort, PieceUrls } from './types/config';

export function getPieceShortKey(piece: Piece): PieceKeyShort {
	return `${piece.color === 'white' ? 'w' : 'b'}${MAP_ROLE_TO_SHORT[piece.role]}` as PieceKeyShort;
}

export function getPieceUrl(pieceUrls: PieceUrls, piece: Piece | PieceKeyShort): string {
	const key = typeof piece === 'string' ? piece : getPieceShortKey(piece);
	return pieceUrls[key];
}
