export interface TMoveRequestBase<TSquare> {
	from: TSquare;
	to: TSquare;
}

export interface TMoveRequest<TSquare, TPromotion> extends TMoveRequestBase<TSquare> {
	capturedSquare?: TSquare; // Optional: the square of the captured piece, useful for en passant
	promotedTo?: TPromotion; // Optional: for promotion moves
	secondary?: TMoveRequestBase<TSquare>; // For multi-part moves like castling (rook move)
}

export interface TMoveCaptured<TSquare, TPiece> {
	square: TSquare;
	piece: TPiece;
}

export interface TMoveBase<TSquare, TPiece> {
	from: TSquare;
	to: TSquare;
	piece: TPiece;
}

export interface TMove<TSquare, TPiece, TPromotion> extends TMoveBase<TSquare, TPiece> {
	captured?: TMoveCaptured<TSquare, TPiece>;
	promotedTo?: TPromotion;
	secondary?: TMoveBase<TSquare, TPiece>; // For multi-part moves like castling (rook move)
}
