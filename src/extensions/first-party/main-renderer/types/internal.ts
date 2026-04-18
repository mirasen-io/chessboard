import { NonEmptyPieceCode, PieceCode } from '../../../../state/board/types/internal';
import { TMainRendererConfig } from './template';

export interface ConfigColorPair {
	light: string; // board light square color
	dark: string; // board dark square color
}

export interface ConfigColors {
	board: ConfigColorPair;
	coordinates: ConfigColorPair;
}

export type PieceUrls = Record<NonEmptyPieceCode, string>;

export type MainRendererConfig = TMainRendererConfig<PieceUrls>;

export const CHESSNUT_PIECE_URLS: PieceUrls = {
	[PieceCode.WhiteKing]: new URL(
		'../../../../../assets/pieces/chessnut/wK.svg',
		import.meta.url
	).toString(),
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
	[PieceCode.WhitePawn]: new URL(
		'../../../../../assets/pieces/chessnut/wP.svg',
		import.meta.url
	).toString(),
	[PieceCode.BlackKing]: new URL(
		'../../../../../assets/pieces/chessnut/bK.svg',
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
	).toString(),
	[PieceCode.BlackPawn]: new URL(
		'../../../../../assets/pieces/chessnut/bP.svg',
		import.meta.url
	).toString()
};

/**
 * Default board renderer configuration.
 */
export const DEFAULT_MAIN_RENDERER_CONFIG: MainRendererConfig = {
	colors: {
		board: {
			light: '#d7dde5',
			dark: '#707a8a'
		},
		coordinates: {
			light: '#eef2f7',
			dark: '#707a8a'
		}
	},
	pieceUrls: CHESSNUT_PIECE_URLS
};
