/**
 * First-party extension: lastMove
 * Highlights the from and to squares of the last move played.
 * Phase 4.2b: First move-derived extension.
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
enum LastMoveLayer {
	Highlights = 1
}

export interface LastMoveExtensionOptions {
	color?: string;
	opacity?: number;
}

const DEFAULT_COLOR = 'rgb(255, 255, 51)';
const DEFAULT_OPACITY = 0.5;

export type LastMoveExtensionDefinition = BoardExtensionDefinition<void, 'underPieces'>;

/**
 * Create lastMove extension definition.
 * - id: 'lastMove'
 * - slots: ['underPieces']
 * - TPublic: void (no public API)
 */
export function createLastMoveExtension(
	options?: LastMoveExtensionOptions
): LastMoveExtensionDefinition {
	const color = options?.color ?? DEFAULT_COLOR;
	const opacity = options?.opacity ?? DEFAULT_OPACITY;

	return {
		id: 'lastMove',
		slots: ['underPieces'] as const,

		mount(env: BoardExtensionMountEnv<'underPieces'>): BoardExtensionMounted<void> {
			const slotRoot = env.slotRoots.underPieces;

			// Extension state
			let cachedFrom: Square | null = null;
			let cachedTo: Square | null = null;
			let highlightFromRect: SVGRectElement | null = null;
			let highlightToRect: SVGRectElement | null = null;

			return {
				getPublic(): void {
					// No public API
					return;
				},

				update(ctx: BoardExtensionUpdateContext): void {
					// Compare vs cached state
					const nextFrom = ctx.lastMove?.from ?? null;
					const nextTo = ctx.lastMove?.to ?? null;
					const moveChanged = cachedFrom !== nextFrom || cachedTo !== nextTo;

					// Mark invalidation if state changed or layout changed
					if (moveChanged || ctx.layoutChanged) {
						ctx.writer.markLayer(LastMoveLayer.Highlights);
					}

					// Update cached state only on actual move change
					if (moveChanged) {
						cachedFrom = nextFrom;
						cachedTo = nextTo;
					}
				},

				renderBoard(ctx: BoardExtensionRenderContext): void {
					// Only proceed if invalidation is present
					if (ctx.invalidation.layers === 0) return;

					if (cachedFrom !== null && cachedTo !== null) {
						// Show highlights for from and to squares
						const fromRect = ctx.geometry.squareRect(cachedFrom);
						const toRect = ctx.geometry.squareRect(cachedTo);

						if (!highlightFromRect) {
							highlightFromRect = document.createElementNS(SVG_NS, 'rect');
							highlightFromRect.setAttribute('fill', color);
							highlightFromRect.setAttribute('fill-opacity', opacity.toString());
							highlightFromRect.setAttribute('shape-rendering', 'crispEdges');
							slotRoot.appendChild(highlightFromRect);
						}

						highlightFromRect.setAttribute('x', fromRect.x.toString());
						highlightFromRect.setAttribute('y', fromRect.y.toString());
						highlightFromRect.setAttribute('width', fromRect.size.toString());
						highlightFromRect.setAttribute('height', fromRect.size.toString());

						if (!highlightToRect) {
							highlightToRect = document.createElementNS(SVG_NS, 'rect');
							highlightToRect.setAttribute('fill', color);
							highlightToRect.setAttribute('fill-opacity', opacity.toString());
							highlightToRect.setAttribute('shape-rendering', 'crispEdges');
							slotRoot.appendChild(highlightToRect);
						}

						highlightToRect.setAttribute('x', toRect.x.toString());
						highlightToRect.setAttribute('y', toRect.y.toString());
						highlightToRect.setAttribute('width', toRect.size.toString());
						highlightToRect.setAttribute('height', toRect.size.toString());
					} else {
						// Hide highlights
						if (highlightFromRect && highlightFromRect.parentNode) {
							slotRoot.removeChild(highlightFromRect);
						}
						highlightFromRect = null;

						if (highlightToRect && highlightToRect.parentNode) {
							slotRoot.removeChild(highlightToRect);
						}
						highlightToRect = null;
					}
				},

				unmount(): void {
					// Clean up highlight elements
					if (highlightFromRect && highlightFromRect.parentNode) {
						slotRoot.removeChild(highlightFromRect);
					}
					highlightFromRect = null;

					if (highlightToRect && highlightToRect.parentNode) {
						slotRoot.removeChild(highlightToRect);
					}
					highlightToRect = null;
				}
			};
		}
	};
}
