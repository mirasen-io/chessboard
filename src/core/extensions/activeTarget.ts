/**
 * First-party extension: activeTarget
 * Highlights the currently targeted square during active targeting interaction.
 * Phase 4.3a: First transient interaction overlay extension.
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
enum ActiveTargetLayer {
	Visuals = 1
}

export interface ActiveTargetExtensionOptions {
	squareColor?: string;
	squareOpacity?: number;
	haloColor?: string;
	haloOpacity?: number;
	haloRadiusRatio?: number;
}

const DEFAULT_SQUARE_COLOR = 'rgba(255, 255, 0, 1)';
const DEFAULT_SQUARE_OPACITY = 0.4;
const DEFAULT_HALO_COLOR = 'rgba(0, 0, 0, 1)';
const DEFAULT_HALO_OPACITY = 0.2;
const DEFAULT_HALO_RADIUS_RATIO = 1.2;

export type ActiveTargetExtensionDefinition = BoardExtensionDefinition<
	void,
	'underPieces' | 'overPieces'
>;

/**
 * Create activeTarget extension definition.
 * - id: 'activeTarget'
 * - slots: ['underPieces', 'overPieces']
 * - TPublic: void (no public API)
 */
export function createActiveTargetExtension(
	options?: ActiveTargetExtensionOptions
): ActiveTargetExtensionDefinition {
	const squareColor = options?.squareColor ?? DEFAULT_SQUARE_COLOR;
	const squareOpacity = options?.squareOpacity ?? DEFAULT_SQUARE_OPACITY;
	const haloColor = options?.haloColor ?? DEFAULT_HALO_COLOR;
	const haloOpacity = options?.haloOpacity ?? DEFAULT_HALO_OPACITY;
	const haloRadiusRatio = options?.haloRadiusRatio ?? DEFAULT_HALO_RADIUS_RATIO;

	return {
		id: 'activeTarget',
		slots: ['underPieces', 'overPieces'] as const,

		mount(env: BoardExtensionMountEnv<'underPieces' | 'overPieces'>): BoardExtensionMounted<void> {
			const underPiecesRoot = env.slotRoots.underPieces;
			const overPiecesRoot = env.slotRoots.overPieces;

			// Extension state
			let squareHighlight: SVGRectElement | null = null;
			let haloCircle: SVGCircleElement | null = null;
			let prevTarget: Square | null = null;
			let prevDragActive = false;
			let prevReleaseTargetingActive = false;

			return {
				getPublic(): void {
					// No public API
					return;
				},

				update(ctx: BoardExtensionUpdateContext): void {
					// Determine current state
					const dragActive = ctx.interaction.dragSession !== null;
					const releaseTargetingActive = ctx.interaction.releaseTargetingActive;
					const currentTarget = ctx.interaction.currentTarget;

					// Compare vs previous state
					const targetChanged = currentTarget !== prevTarget;
					const dragStateChanged = dragActive !== prevDragActive;
					const releaseTargetingStateChanged =
						releaseTargetingActive !== prevReleaseTargetingActive;

					// Mark invalidation if state changed or layout changed
					if (
						targetChanged ||
						dragStateChanged ||
						releaseTargetingStateChanged ||
						ctx.layoutChanged
					) {
						ctx.writer.markLayer(ActiveTargetLayer.Visuals);
					}

					// Update previous state
					prevTarget = currentTarget;
					prevDragActive = dragActive;
					prevReleaseTargetingActive = releaseTargetingActive;
				},

				renderBoard(ctx: BoardExtensionRenderContext): void {
					// Only proceed if invalidation is present
					if (ctx.invalidation.layers === 0) return;

					// Determine current visibility from state (source of truth)
					// Visibility predicate: currentTarget !== null && (dragSession !== null || releaseTargetingActive === true)
					const dragActive = ctx.interaction.dragSession !== null;
					const releaseTargetingActive = ctx.interaction.releaseTargetingActive;
					const currentTarget = ctx.interaction.currentTarget;
					const shouldShow = currentTarget !== null && (dragActive || releaseTargetingActive);

					if (shouldShow && currentTarget !== null) {
						// Show visuals
						const rect = ctx.geometry.squareRect(currentTarget);

						// Square highlight in underPieces
						if (!squareHighlight) {
							squareHighlight = document.createElementNS(SVG_NS, 'rect');
							squareHighlight.setAttribute('fill', squareColor);
							squareHighlight.setAttribute('fill-opacity', squareOpacity.toString());
							squareHighlight.setAttribute('shape-rendering', 'crispEdges');
							underPiecesRoot.appendChild(squareHighlight);
						}

						squareHighlight.setAttribute('x', rect.x.toString());
						squareHighlight.setAttribute('y', rect.y.toString());
						squareHighlight.setAttribute('width', rect.size.toString());
						squareHighlight.setAttribute('height', rect.size.toString());

						// Halo in overPieces
						const centerX = rect.x + rect.size / 2;
						const centerY = rect.y + rect.size / 2;
						const radius = ctx.geometry.squareSize * haloRadiusRatio;

						if (!haloCircle) {
							haloCircle = document.createElementNS(SVG_NS, 'circle');
							haloCircle.setAttribute('fill', haloColor);
							haloCircle.setAttribute('fill-opacity', haloOpacity.toString());
							overPiecesRoot.appendChild(haloCircle);
						}

						haloCircle.setAttribute('cx', centerX.toString());
						haloCircle.setAttribute('cy', centerY.toString());
						haloCircle.setAttribute('r', radius.toString());
					} else {
						// Hide visuals
						if (squareHighlight && squareHighlight.parentNode) {
							underPiecesRoot.removeChild(squareHighlight);
						}
						squareHighlight = null;

						if (haloCircle && haloCircle.parentNode) {
							overPiecesRoot.removeChild(haloCircle);
						}
						haloCircle = null;
					}
				},

				unmount(): void {
					// Clean up visual elements
					if (squareHighlight && squareHighlight.parentNode) {
						underPiecesRoot.removeChild(squareHighlight);
					}
					squareHighlight = null;

					if (haloCircle && haloCircle.parentNode) {
						overPiecesRoot.removeChild(haloCircle);
					}
					haloCircle = null;
				}
			};
		}
	};
}
