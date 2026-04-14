import { ColorShort, Role, RoleShort } from '../../../state/board/types';

export interface ConfigColorPair {
	light: string; // board light square color
	dark: string; // board dark square color
}

export interface ConfigColors {
	board: ConfigColorPair;
	coordinates: ConfigColorPair;
}

export type PieceKeyShort = `${ColorShort}${RoleShort}`;

export type PieceUrls = Record<PieceKeyShort, string>;

export interface MainRendererConfig {
	colors: ConfigColors;
	pieceUrls: PieceUrls;
}

export const MAP_ROLE_TO_SHORT: Record<Role, RoleShort> = {
	king: 'K',
	queen: 'Q',
	rook: 'R',
	bishop: 'B',
	knight: 'N',
	pawn: 'p'
};

// Static URL table — each entry uses a literal path so bundlers can resolve it.
export const CHESSNUT_PIECE_URLS: PieceUrls = {
	wK: new URL('../../../../assets/pieces/chessnut/wK.svg', import.meta.url).toString(),
	wQ: new URL('../../../../assets/pieces/chessnut/wQ.svg', import.meta.url).toString(),
	wR: new URL('../../../../assets/pieces/chessnut/wR.svg', import.meta.url).toString(),
	wB: new URL('../../../../assets/pieces/chessnut/wB.svg', import.meta.url).toString(),
	wN: new URL('../../../../assets/pieces/chessnut/wN.svg', import.meta.url).toString(),
	wp: new URL('../../../../assets/pieces/chessnut/wP.svg', import.meta.url).toString(),
	bK: new URL('../../../../assets/pieces/chessnut/bK.svg', import.meta.url).toString(),
	bQ: new URL('../../../../assets/pieces/chessnut/bQ.svg', import.meta.url).toString(),
	bR: new URL('../../../../assets/pieces/chessnut/bR.svg', import.meta.url).toString(),
	bB: new URL('../../../../assets/pieces/chessnut/bB.svg', import.meta.url).toString(),
	bN: new URL('../../../../assets/pieces/chessnut/bN.svg', import.meta.url).toString(),
	bp: new URL('../../../../assets/pieces/chessnut/bP.svg', import.meta.url).toString()
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
