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
export const CBURNETT_PIECE_URLS: PieceUrls = {
	wK: new URL('../../../../assets/pieces/cburnett/wk.svg', import.meta.url).toString(),
	wQ: new URL('../../../../assets/pieces/cburnett/wq.svg', import.meta.url).toString(),
	wR: new URL('../../../../assets/pieces/cburnett/wr.svg', import.meta.url).toString(),
	wB: new URL('../../../../assets/pieces/cburnett/wb.svg', import.meta.url).toString(),
	wN: new URL('../../../../assets/pieces/cburnett/wn.svg', import.meta.url).toString(),
	wp: new URL('../../../../assets/pieces/cburnett/wp.svg', import.meta.url).toString(),
	bK: new URL('../../../../assets/pieces/cburnett/bk.svg', import.meta.url).toString(),
	bQ: new URL('../../../../assets/pieces/cburnett/bq.svg', import.meta.url).toString(),
	bR: new URL('../../../../assets/pieces/cburnett/br.svg', import.meta.url).toString(),
	bB: new URL('../../../../assets/pieces/cburnett/bb.svg', import.meta.url).toString(),
	bN: new URL('../../../../assets/pieces/cburnett/bn.svg', import.meta.url).toString(),
	bp: new URL('../../../../assets/pieces/cburnett/bp.svg', import.meta.url).toString()
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
	pieceUrls: CBURNETT_PIECE_URLS
};
