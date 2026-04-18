/**
 * First-party extension: legalMoves
 * Renders centered dots on legal destination squares.
 * Phase 4.3c batch 2: Legal moves destination hints MVP.
 */

import { SVG_NS } from '../helpers/svg';
import type { Square } from '../state/boardTypes';
import type {
	BoardExtensionDefinition,
	BoardExtensionMountEnv,
	BoardExtensionMounted,
	BoardExtensionRenderContext,
	BoardExtensionUpdateContext
} from './types';

/**
 * Extension-local invalidation layer flags.
 */
enum LegalMovesLayer {
	Dots = 1
}

export type LegalMovesExtensionDefinition = BoardExtensionDefinition<void, 'overPieces'>;

/**
 * Create legalMoves extension definition.
 * - id: 'legalMoves'
 * - slots: ['overPieces']
 * - TPublic: void (no public API)
 */
export function createLegalMovesExtension(): LegalMovesExtensionDefinition {
	return {
		id: 'legalMoves',
		slots: ['overPieces'] as const,

		mount(env: BoardExtensionMountEnv<'overPieces'>): BoardExtensionMounted<void> {
			const slotRoot = env.slotRoots.overPieces;

			// Extension state
			let dotCircles: SVGCircleElement[] = [];
			let prevDestinations: readonly Square[] | null = null;

			return {
				getPublic(): void {
					// No public API
					return;
				},

				update(ctx: BoardExtensionUpdateContext): void {
					const currentDestinations = ctx.interaction.destinations;

					// Compare vs previous state
					const destinationsChanged = currentDestinations !== prevDestinations;

					// Mark invalidation if state changed or layout changed
					if (destinationsChanged || ctx.layoutChanged) {
						ctx.writer.markLayer(LegalMovesLayer.Dots);
					}

					// Update previous state
					prevDestinations = currentDestinations;
				},

				renderBoard(ctx: BoardExtensionRenderContext): void {
					// Only proceed if invalidation is present
					if (ctx.invalidation.layers === 0) return;

					// Determine current visibility from state (source of truth)
					const destinations = ctx.interaction.destinations;
					const shouldShow = destinations !== null && destinations.length > 0;

					if (shouldShow && destinations !== null) {
						// Clear existing dots
						for (const circle of dotCircles) {
							if (circle.parentNode) {
								slotRoot.removeChild(circle);
							}
						}
						dotCircles = [];

						// Render dot for each destination
						for (const sq of destinations) {
							const rect = ctx.geometry.squareRect(sq);
							const centerX = rect.x + rect.size / 2;
							const centerY = rect.y + rect.size / 2;
							const radius = ctx.geometry.squareSize * 0.125;

							const circle = document.createElementNS(SVG_NS, 'circle');
							circle.setAttribute('cx', centerX.toString());
							circle.setAttribute('cy', centerY.toString());
							circle.setAttribute('r', radius.toString());
							circle.setAttribute('fill', 'rgb(0, 0, 0)');
							circle.setAttribute('fill-opacity', '0.35');
							circle.setAttribute('stroke', 'rgb(255, 255, 255)');
							circle.setAttribute('stroke-opacity', '0.18');
							circle.setAttribute('stroke-width', '1');

							slotRoot.appendChild(circle);
							dotCircles.push(circle);
						}
					} else {
						// Hide dots
						for (const circle of dotCircles) {
							if (circle.parentNode) {
								slotRoot.removeChild(circle);
							}
						}
						dotCircles = [];
					}
				},

				unmount(): void {
					// Clean up dot elements
					for (const circle of dotCircles) {
						if (circle.parentNode) {
							slotRoot.removeChild(circle);
						}
					}
					dotCircles = [];
				}
			};
		}
	};
}
