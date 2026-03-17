/**
 * First-party extension: selectedSquare
 * Highlights the currently selected square when it contains a piece.
 * Phase 4.2a: First lifecycle-validation extension.
 */

import type { Square } from '../state/boardTypes';
import { decodePiece } from '../state/encode';
import type {
	BoardExtensionDefinition,
	BoardExtensionMountEnv,
	BoardExtensionMounted,
	BoardExtensionRenderContext,
	BoardExtensionUpdateContext
} from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Extension-local invalidation layer flags.
 * Use bitmask for potential future layer expansion within this extension.
 */
enum SelectedSquareLayer {
	Highlight = 1
}

/**
 * selectedSquare extension definition.
 * - id: 'selectedSquare'
 * - slots: ['underPieces']
 * - TPublic: void (no public API)
 */
export const selectedSquareExtension: BoardExtensionDefinition<void, 'underPieces'> = {
	id: 'selectedSquare',
	slots: ['underPieces'] as const,

	mount(env: BoardExtensionMountEnv<'underPieces'>): BoardExtensionMounted<void> {
		const slotRoot = env.slotRoots.underPieces;

		// Extension state
		let highlightRect: SVGRectElement | null = null;
		let prevSelectedSquare: Square | null = null;
		let prevHasPiece = false;

		return {
			getPublic(): void {
				// No public API
				return;
			},

			update(ctx: BoardExtensionUpdateContext): void {
				const currentSelectedSquare = ctx.interaction.selectedSquare;
				const currentHasPiece =
					currentSelectedSquare !== null &&
					decodePiece(ctx.board.pieces[currentSelectedSquare]) !== null;

				// Compare vs previous state
				const selectedSquareChanged = currentSelectedSquare !== prevSelectedSquare;
				const hasPieceChanged = currentHasPiece !== prevHasPiece;

				if (selectedSquareChanged || hasPieceChanged) {
					// Mark invalidation via writer
					ctx.writer.markLayer(SelectedSquareLayer.Highlight);
				}

				// Update previous state
				prevSelectedSquare = currentSelectedSquare;
				prevHasPiece = currentHasPiece;
			},

			renderBoard(ctx: BoardExtensionRenderContext): void {
				// Only proceed if invalidation is present
				if (ctx.invalidation.layers === 0) return;

				// Determine current visibility from state (source of truth)
				const selectedSquare = ctx.interaction.selectedSquare;
				const hasPiece =
					selectedSquare !== null && decodePiece(ctx.board.pieces[selectedSquare]) !== null;
				const shouldShow = selectedSquare !== null && hasPiece;

				if (shouldShow) {
					// Show highlight
					const rect = ctx.geometry.squareRect(selectedSquare);

					if (!highlightRect) {
						highlightRect = document.createElementNS(SVG_NS, 'rect');
						highlightRect.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
						highlightRect.setAttribute('shape-rendering', 'crispEdges');
						slotRoot.appendChild(highlightRect);
					}

					highlightRect.setAttribute('x', rect.x.toString());
					highlightRect.setAttribute('y', rect.y.toString());
					highlightRect.setAttribute('width', rect.size.toString());
					highlightRect.setAttribute('height', rect.size.toString());
				} else {
					// Hide highlight
					if (highlightRect && highlightRect.parentNode) {
						slotRoot.removeChild(highlightRect);
					}
					highlightRect = null;
				}
			},

			unmount(): void {
				// Clean up highlight element
				if (highlightRect && highlightRect.parentNode) {
					slotRoot.removeChild(highlightRect);
				}
				highlightRect = null;
			}
		};
	}
};
