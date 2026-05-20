import type { ConfigColors } from './internal.js';

export type MainRendererConfigDragPieceAnchor = 'center' | 'bottom';
export interface MainRendererConfigDrag {
	pieceScale: number;
	pieceAnchor: MainRendererConfigDragPieceAnchor;
}

export interface MainRendererConfigAnimation {
	durationMs: number;
}

export interface TMainRendererConfig<TPieceUrls> {
	colors: ConfigColors;
	pieceUrls: TPieceUrls;
	drag: MainRendererConfigDrag;
	animation: MainRendererConfigAnimation;
}
