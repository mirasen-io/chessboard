import { cloneDeep } from 'es-toolkit';
import { denormalizePieceString } from '../../../state/board/denormalize.js';
import type { NonEmptyPieceCode } from '../../../state/board/types/internal.js';
import type { MainRendererConfig, PieceUrls } from './types/internal.js';
import type { MainRendererConfigPublic, PieceUrlsPublic } from './types/public.js';

function denormalizePieceUrls(pieceUrls: PieceUrls): PieceUrlsPublic {
	const result = {} as PieceUrlsPublic;
	for (const [codeKey, url] of Object.entries(pieceUrls)) {
		const code = Number(codeKey) as NonEmptyPieceCode;
		result[denormalizePieceString(code)] = url;
	}
	return result;
}

export function denormalizeMainRendererConfig(
	config: MainRendererConfig
): MainRendererConfigPublic {
	return {
		colors: cloneDeep(config.colors),
		drag: cloneDeep(config.drag),
		animation: cloneDeep(config.animation),
		pieceUrls: denormalizePieceUrls(config.pieceUrls)
	};
}
