import {
	clearElementChildren,
	createSvgElement,
	isLightSquare
} from '../../../../render/svg/helpers.js';
import { squareOf } from '../../../../state/board/coords.js';
import {
	ColorCode,
	Square,
	SquareFile,
	SquareRank
} from '../../../../state/board/types/internal.js';
import { ExtensionRenderContext } from '../../../types/context/render.js';
import { DirtyLayer } from '../types/extension.js';
import { MainRendererCoordinatesInternal } from './types.js';

function labelColorForSquare(sq: Square, coordColors: { light: string; dark: string }): string {
	return isLightSquare(sq) ? coordColors.dark : coordColors.light;
}

export function rendererCoordinatesRender(
	state: MainRendererCoordinatesInternal,
	context: ExtensionRenderContext,
	layer: SVGElement
): void {
	if ((context.invalidation.dirtyLayers & DirtyLayer.Coordinates) === 0) {
		return;
	}

	const geometry = context.currentFrame.layout.geometry;
	clearElementChildren(layer);

	const coords = state.config;
	const fontSize = geometry.squareSize * 0.12;
	const offset = 3;

	// Rank labels on the visual left edge
	const rankFile = geometry.orientation === ColorCode.White ? 0 : 7;
	for (let visualRank = 0; visualRank < 8; visualRank++) {
		const logicalRank = (
			geometry.orientation === ColorCode.White ? 7 - visualRank : visualRank
		) as SquareRank;
		const sq = squareOf(rankFile, logicalRank);
		const label =
			geometry.orientation === ColorCode.White ? String(8 - visualRank) : String(1 + visualRank);

		const r = geometry.getSquareRect(sq);
		const color = labelColorForSquare(sq, coords);

		const text = createSvgElement(layer, 'text', {
			'data-chessboard-id': `coord-rank-${label}`,
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
	const fileRank = geometry.orientation === ColorCode.White ? 0 : 7;
	for (let visualFile = 0; visualFile < 8; visualFile++) {
		const logicalFile = (
			geometry.orientation === ColorCode.White ? visualFile : 7 - visualFile
		) as SquareFile;
		const sq = squareOf(logicalFile, fileRank);
		const label =
			geometry.orientation === ColorCode.White
				? String.fromCharCode('a'.charCodeAt(0) + visualFile)
				: String.fromCharCode('h'.charCodeAt(0) - visualFile);

		const r = geometry.getSquareRect(sq);
		const color = labelColorForSquare(sq, coords);

		const text = createSvgElement(layer, 'text', {
			'data-chessboard-id': `coord-file-${label}`,
			x: (r.x + r.width - offset).toString(),
			y: (r.y + r.height - offset).toString(),
			'font-size': fontSize.toString(),
			'font-family': 'sans-serif',
			'font-weight': 'bold',
			fill: color,
			'text-anchor': 'end',
			'dominant-baseline': 'auto'
		});
		text.textContent = label;
		// Keep coordinate labels visual-only so mobile browsers do not select them
		// or treat them as pointer targets during board interaction.
		text.style.setProperty('pointer-events', 'none');
		text.style.setProperty('user-select', 'none');
		text.style.setProperty('-webkit-user-select', 'none');
	}
}
