import assert from '@ktarmyshov/assert';
import { normalizePiece } from '../../../state/board/normalize.js';
import { PieceCode } from '../../../state/board/types/internal.js';
import {
	PromotionInitConfig,
	PromotionPieceString,
	PromotionPieceUrlsInput
} from './types/input.js';
import {
	ALL_NON_EMPTY_PROMOTION_PIECE_CODES,
	DEFAULT_CONFIG,
	PromotionConfig,
	PromotionPieceCode,
	PromotionPieceUrls
} from './types/internal.js';

function assertPieceUrlsComplete(
	pieceUrls: Partial<PromotionPieceUrls>
): asserts pieceUrls is PromotionPieceUrls {
	for (const pieceCode of ALL_NON_EMPTY_PROMOTION_PIECE_CODES) {
		assert(pieceCode in pieceUrls, `Missing URL for piece code: ${pieceCode}`);
	}
}

function isPromotionPieceCode(pieceCode: PieceCode): pieceCode is PromotionPieceCode {
	return (
		pieceCode === PieceCode.WhiteQueen ||
		pieceCode === PieceCode.WhiteRook ||
		pieceCode === PieceCode.WhiteBishop ||
		pieceCode === PieceCode.WhiteKnight ||
		pieceCode === PieceCode.BlackQueen ||
		pieceCode === PieceCode.BlackRook ||
		pieceCode === PieceCode.BlackBishop ||
		pieceCode === PieceCode.BlackKnight
	);
}

function normalizePromotionPieceUrls(input: PromotionPieceUrlsInput): PromotionPieceUrls {
	const normalized: Partial<PromotionPieceUrls> = {};
	for (const [key, url] of Object.entries(input) as [PromotionPieceString, string][]) {
		const pieceCode = normalizePiece(key);
		if (!isPromotionPieceCode(pieceCode)) {
			continue;
		}
		normalized[pieceCode] = url;
	}
	assertPieceUrlsComplete(normalized);
	return normalized;
}

export function normalizePromotionConfig(config: PromotionInitConfig): PromotionConfig {
	return {
		squareColor: config.squareColor ?? DEFAULT_CONFIG.squareColor,
		hoverColor: config.hoverColor ?? DEFAULT_CONFIG.hoverColor,
		pieceUrls: config.pieceUrls
			? normalizePromotionPieceUrls(config.pieceUrls)
			: DEFAULT_CONFIG.pieceUrls
	};
}
