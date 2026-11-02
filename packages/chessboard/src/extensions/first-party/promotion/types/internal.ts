import { NonEmptyPieceCode, PieceCode } from '../../../../state/board/types/internal.js';
import { OpaqueColor } from '../../common/types.js';

export type PromotionPieceCode = Exclude<
	NonEmptyPieceCode,
	PieceCode.WhitePawn | PieceCode.BlackPawn | PieceCode.BlackKing | PieceCode.WhiteKing
>;

export type PromotionPieceUrls = Record<PromotionPieceCode, string>;

export interface PromotionConfig {
	squareColor: OpaqueColor;
	hoverColor: OpaqueColor;
	pieceUrls: PromotionPieceUrls;
}

export const PROMOTION_CHESSNUT_PIECE_URLS: PromotionPieceUrls = {
	[PieceCode.WhiteQueen]: new URL(
		'../../../../../assets/pieces/chessnut/wQ.svg',
		import.meta.url
	).toString(),
	[PieceCode.WhiteRook]: new URL(
		'../../../../../assets/pieces/chessnut/wR.svg',
		import.meta.url
	).toString(),
	[PieceCode.WhiteBishop]: new URL(
		'../../../../../assets/pieces/chessnut/wB.svg',
		import.meta.url
	).toString(),
	[PieceCode.WhiteKnight]: new URL(
		'../../../../../assets/pieces/chessnut/wN.svg',
		import.meta.url
	).toString(),
	[PieceCode.BlackQueen]: new URL(
		'../../../../../assets/pieces/chessnut/bQ.svg',
		import.meta.url
	).toString(),
	[PieceCode.BlackRook]: new URL(
		'../../../../../assets/pieces/chessnut/bR.svg',
		import.meta.url
	).toString(),
	[PieceCode.BlackBishop]: new URL(
		'../../../../../assets/pieces/chessnut/bB.svg',
		import.meta.url
	).toString(),
	[PieceCode.BlackKnight]: new URL(
		'../../../../../assets/pieces/chessnut/bN.svg',
		import.meta.url
	).toString()
};

export const ALL_NON_EMPTY_PROMOTION_PIECE_CODES = Object.keys(PROMOTION_CHESSNUT_PIECE_URLS).map(
	(code) => Number(code) as PromotionPieceCode
);

export const DEFAULT_CONFIG: PromotionConfig = {
	squareColor: {
		color: 'rgba(255, 255, 255)',
		opacity: 1
	},
	hoverColor: {
		color: '#000000',
		opacity: 0.15
	},
	pieceUrls: PROMOTION_CHESSNUT_PIECE_URLS
};
