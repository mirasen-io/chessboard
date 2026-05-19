import assert from '@ktarmyshov/assert';
import { normalizePiece } from '../../../state/board/normalize.js';
import type { PieceString } from '../../../state/board/types/input.js';
import { ALL_NON_EMPTY_PIECE_CODES, PieceCode } from '../../../state/board/types/internal.js';
import type {
	DefaultMainRendererDesktopConfig,
	MainRendererConfig,
	PieceUrls
} from './types/internal.js';
import type { MainRendererInitOptions, PieceUrlsPublic } from './types/public.js';

function assertPieceUrlsComplete(pieceUrls: Partial<PieceUrls>): asserts pieceUrls is PieceUrls {
	for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
		assert(pieceCode in pieceUrls, `Missing URL for piece code: ${pieceCode}`);
	}
}

function normalizePieceUrls(input: PieceUrlsPublic): PieceUrls {
	const normalized: Partial<PieceUrls> = {};
	for (const [key, url] of Object.entries(input) as [PieceString, string][]) {
		const pieceCode = normalizePiece(key);
		assert(pieceCode !== PieceCode.Empty, `Invalid piece string: ${key}`);
		normalized[pieceCode] = url;
	}
	assertPieceUrlsComplete(normalized);
	return normalized;
}

export function normalizeMainRendererConfig(input: MainRendererInitOptions): MainRendererConfig {
	return {
		colors: input.colors ?? DefaultMainRendererDesktopConfig.colors,
		pieceUrls: input.pieceUrls
			? normalizePieceUrls(input.pieceUrls)
			: DefaultMainRendererDesktopConfig.pieceUrls
	};
}
