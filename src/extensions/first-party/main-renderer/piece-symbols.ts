import { createSvgElement } from '../../../render/svg/helpers.js';
import type { SvgIdResolver } from '../../../render/svg/ids.js';
import {
	ALL_NON_EMPTY_PIECE_CODES,
	NonEmptyPieceCode
} from '../../../state/board/types/internal.js';
import type { PieceUrls } from './types/internal.js';

// ─── PieceSymbolResolver ──────────────────────────────────────────────────────

export interface PieceSymbolResolver {
	/** Returns the DOM id for a piece symbol (e.g., "cb0-renderer-p6") */
	getId(pieceCode: NonEmptyPieceCode): string;
	/** Returns the href suitable for <use href="..."> (e.g., "#cb0-renderer-p6") */
	getHref(pieceCode: NonEmptyPieceCode): string;
}

/**
 * Creates a PieceSymbolResolver backed by the shared SvgIdResolver.
 * All ids use the "renderer" scope with a "p{pieceCode}" local id.
 */
export function createPieceSymbolResolver(svgIds: SvgIdResolver): PieceSymbolResolver {
	const getId = (pieceCode: NonEmptyPieceCode): string => {
		return svgIds.makeId('renderer', `p${pieceCode}`);
	};

	const getHref = (pieceCode: NonEmptyPieceCode): string => {
		return svgIds.makeHref('renderer', `p${pieceCode}`);
	};

	return { getId, getHref };
}

// ─── Symbol DOM creation ──────────────────────────────────────────────────────

function getSymbolDataId(pieceCode: NonEmptyPieceCode): string {
	return `piece-symbol-${pieceCode}`;
}

/**
 * Ensures all 12 piece symbols exist in the defs element.
 * Idempotent: checks the actual DOM for each symbol id before creating.
 */
export function ensurePieceSymbolsDefined(
	defs: SVGDefsElement,
	config: PieceUrls,
	resolver: PieceSymbolResolver
): void {
	for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
		const symbolId = resolver.getId(pieceCode);

		// Idempotency: check if this symbol already exists in the DOM
		if (defs.querySelector(`#${symbolId}`)) {
			continue;
		}

		const symbol = createSvgElement(defs, 'symbol', {
			id: symbolId,
			'data-chessboard-id': getSymbolDataId(pieceCode),
			viewBox: '0 0 1 1'
		});

		createSvgElement(symbol, 'image', {
			'data-chessboard-id': `piece-symbol-image-${pieceCode}`,
			href: config[pieceCode],
			x: '0',
			y: '0',
			width: '1',
			height: '1'
		});
	}
}
