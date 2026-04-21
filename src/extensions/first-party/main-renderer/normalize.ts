import assert from '@ktarmyshov/assert';
import { normalizePiece } from '../../../state/board/normalize.js';
import { PieceString } from '../../../state/board/types/input.js';
import { ALL_NON_EMPTY_PIECE_CODES, PieceCode } from '../../../state/board/types/internal.js';
import { MainRendererConfigInput, PieceUrlsInput } from './types/input.js';
import { DEFAULT_MAIN_RENDERER_CONFIG, MainRendererConfig, PieceUrls } from './types/internal.js';

function assertPieceUrlsComplete(pieceUrls: Partial<PieceUrls>): asserts pieceUrls is PieceUrls {
	for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
		assert(pieceCode in pieceUrls, `Missing URL for piece code: ${pieceCode}`);
	}
}

function normalizePieceUrls(input: PieceUrlsInput): PieceUrls {
	const normalized: Partial<PieceUrls> = {};
	for (const [key, url] of Object.entries(input) as [PieceString, string][]) {
		const pieceCode = normalizePiece(key);
		assert(pieceCode !== PieceCode.Empty, `Invalid piece string: ${key}`);
		normalized[pieceCode] = url;
	}
	assertPieceUrlsComplete(normalized);
	return normalized;
}

export function normalizeMainRendererConfig(
	input: Partial<MainRendererConfigInput>
): MainRendererConfig {
	return {
		colors: input.colors ?? DEFAULT_MAIN_RENDERER_CONFIG.colors,
		pieceUrls: input.pieceUrls
			? normalizePieceUrls(input.pieceUrls)
			: DEFAULT_MAIN_RENDERER_CONFIG.pieceUrls
	};
}
