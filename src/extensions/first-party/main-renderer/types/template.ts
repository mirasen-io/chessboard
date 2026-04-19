import { ConfigColors } from './internal.js';

export interface TMainRendererConfig<TPieceUrls> {
	colors: ConfigColors;
	pieceUrls: TPieceUrls;
}
