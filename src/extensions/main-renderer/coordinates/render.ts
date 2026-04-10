import { clearElementChildren, createSvgElement, isLightSquare } from '../../../render/svg/helpers';
import { squareOf, toAlgebraic } from '../../../state/board/coords';
import { Square } from '../../../state/board/types';
import { ExtensionRenderStateContext } from '../../types';
import { DirtyLayer } from '../types/extension';
import { MainRendererCoordinatesInternal } from './types';

function labelColorForSquare(sq: Square, coordColors: { light: string; dark: string }): string {
	return isLightSquare(sq) ? coordColors.dark : coordColors.light;
}

export function rendererCoordinatesRender(
	state: MainRendererCoordinatesInternal,
	context: ExtensionRenderStateContext,
	layer: SVGElement
): void {
	if ((context.invalidation.dirtyLayers & DirtyLayer.Coordinates) === 0) {
		return;
	}

	const geometry = context.current.layout.geometry;
	clearElementChildren(layer);

	const coords = state.config;
	const fontSize = geometry.squareSize * 0.12;
	const offset = 3;

	// Rank labels on the visual left edge
	const rankFile = geometry.orientation === 'white' ? 0 : 7;
	for (let visualRank = 0; visualRank < 8; visualRank++) {
		const logicalRank = geometry.orientation === 'white' ? 7 - visualRank : visualRank;
		const sq = squareOf(rankFile, logicalRank);
		const label =
			geometry.orientation === 'white' ? String(8 - visualRank) : String(1 + visualRank);

		const r = geometry.squareRect(sq);
		const color = labelColorForSquare(sq, coords);

		const text = createSvgElement(layer, 'text', {
			'data-chessboard-id': `coord-rank-${label}`,
			'data-chessboard-square': toAlgebraic(sq),
			x: (r.x + offset).toString(),
			y: (r.y + offset).toString(),
			'font-size': fontSize.toString(),
			'font-family': 'sans-serif',
			'font-weight': 'bold',
			fill: color,
			'text-anchor': 'start',
			'dominant-baseline': 'hanging'
		});
		text.textContent = label;
	}

	// File labels on the visual bottom edge
	const fileRank = geometry.orientation === 'white' ? 0 : 7;
	for (let visualFile = 0; visualFile < 8; visualFile++) {
		const logicalFile = geometry.orientation === 'white' ? visualFile : 7 - visualFile;
		const sq = squareOf(logicalFile, fileRank);
		const label =
			geometry.orientation === 'white'
				? String.fromCharCode('a'.charCodeAt(0) + visualFile)
				: String.fromCharCode('h'.charCodeAt(0) - visualFile);

		const r = geometry.squareRect(sq);
		const color = labelColorForSquare(sq, coords);

		const text = createSvgElement(layer, 'text', {
			'data-chessboard-id': `coord-file-${label}`,
			'data-chessboard-square': toAlgebraic(sq),
			x: (r.x + r.size - offset).toString(),
			y: (r.y + r.size - offset).toString(),
			'font-size': fontSize.toString(),
			'font-family': 'sans-serif',
			'font-weight': 'bold',
			fill: color,
			'text-anchor': 'end',
			'dominant-baseline': 'auto'
		});
		text.textContent = label;
	}
}
