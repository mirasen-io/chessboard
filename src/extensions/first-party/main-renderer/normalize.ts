import assert from '@ktarmyshov/assert';
import { toMerged } from 'es-toolkit/object';
import { normalizePiece } from '../../../state/board/normalize.js';
import type { PieceString } from '../../../state/board/types/input.js';
import { ALL_NON_EMPTY_PIECE_CODES, PieceCode } from '../../../state/board/types/internal.js';
import type { MainRendererConfig, PieceUrls } from './types/internal.js';
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

function validateMainRendererConfig(config: MainRendererConfig): void {
	const { pieceScale, pieceAnchor } = config.drag;
	assert(Number.isFinite(pieceScale), 'drag.pieceScale must be a finite number');
	assert(pieceScale > 0, 'drag.pieceScale must be > 0');
	assert(
		pieceAnchor === 'center' || pieceAnchor === 'bottom',
		`drag.pieceAnchor must be 'center' or 'bottom', received: ${String(pieceAnchor)}`
	);
}

export function normalizeMainRendererConfig(
	input: MainRendererInitOptions | undefined,
	base: MainRendererConfig
): MainRendererConfig {
	const { pieceUrls: inputPieceUrls, ...rest } = input ?? {};
	const merged = toMerged(base, rest) as MainRendererConfig;
	const result: MainRendererConfig = {
		...merged,
		pieceUrls: inputPieceUrls !== undefined ? normalizePieceUrls(inputPieceUrls) : merged.pieceUrls
	};
	validateMainRendererConfig(result);
	return result;
}
