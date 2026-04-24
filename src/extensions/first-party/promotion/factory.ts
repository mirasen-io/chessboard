import assert from '@ktarmyshov/assert';
import { createSvgElement, updateElementAttributes } from '../../../render/svg/helpers.js';
import { fileOf, rankOf, squareOf } from '../../../state/board/coords.js';
import { toPieceCode } from '../../../state/board/piece.js';
import { ColorCode, RolePromotionCode, SquareRank } from '../../../state/board/types/internal.js';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import { normalizePromotionConfig } from './normalize.js';
import { PromotionInitConfig } from './types/input.js';
import { PromotionConfig, PromotionPieceCode } from './types/internal.js';
import {
	DirtyLayer,
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType,
	PromotionDefinition,
	PromotionInstance,
	PromotionInstanceInternal
} from './types/main.js';

export function createPromotion(config: PromotionInitConfig = {}): PromotionDefinition {
	const mergedConfig = normalizePromotionConfig(config);
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance(options) {
			return createPromotionInstance(options, mergedConfig);
		}
	};
}

function createPromotionInternal(
	options: ExtensionCreateInstanceOptions,
	config: PromotionConfig
): PromotionInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		svgPromotionPieces: new Map(),
		activePromotionSquares: new Map(),
		svgHoverRect: null,
		config,
		runtimeSurface: options.runtimeSurface
	};
}

function extensionCleanPieceNode(state: PromotionInstanceInternal, roleCode: RolePromotionCode) {
	const pieceNode = state.svgPromotionPieces.get(roleCode);
	if (pieceNode) {
		pieceNode.svg.remove();
		pieceNode.rect.remove();
		state.svgPromotionPieces.delete(roleCode);
	}
}

function extensionCleanPieceNodes(state: PromotionInstanceInternal) {
	for (const pieceNode of state.svgPromotionPieces.values()) {
		pieceNode.svg.remove();
		pieceNode.rect.remove();
	}
	state.svgPromotionPieces.clear();
}

function extensionCleanHoverRect(state: PromotionInstanceInternal) {
	if (state.svgHoverRect) {
		state.svgHoverRect.remove();
		state.svgHoverRect = null;
	}
}

function extensionClean(state: PromotionInstanceInternal) {
	extensionCleanPieceNodes(state);
	extensionCleanHoverRect(state);
	state.activePromotionSquares.clear();
}

function createPromotionInstance(
	options: ExtensionCreateInstanceOptions,
	config: PromotionConfig
): PromotionInstance {
	const internalState = createPromotionInternal(options, config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUIMoveRequest(context) {
			const request = context.request;
			if (request.status !== 'unresolved') return; // no-op if the request is already resolved or deferred
			if (request.canBeAutoResolved) return; // no-op, core will auto-resolve
			// OK! now this one is our request!
			request.defer(); // defer the request until the user selects a piece to promote to
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({
					causes: ['state.change.setDeferredUIMoveRequest', 'layout.refreshGeometry']
				}) && isUpdateContextRenderable(context);
			if (!needsRender) {
				return; // no-op
			}
			const request = context.currentFrame.state.change.deferredUIMoveRequest;
			if (request !== null) {
				internalState.runtimeSurface.transientVisuals.subscribe();
				internalState.runtimeSurface.events.subscribeEvent('pointerdown');
			} else {
				internalState.runtimeSurface.transientVisuals.unsubscribe();
				internalState.runtimeSurface.events.unsubscribeEvent('pointerdown');
			}
			context.invalidation.markDirty(DirtyLayer.Promotion);
		},
		render(context) {
			assert(
				context.invalidation.dirtyLayers !== 0,
				'Render should only be called when there are dirty layers'
			);

			const deferredRequest = context.currentFrame.state.change.deferredUIMoveRequest;
			if (deferredRequest === null) {
				// No deferred request, so we can clean up any existing promotion piece nodes and highlights
				extensionClean(internalState);
				return;
			}
			const targetSquare = deferredRequest.destination.to;
			const targetFile = fileOf(targetSquare);
			const targetRank = rankOf(targetSquare);
			const promotedTo = deferredRequest.destination.promotedTo;
			assert(
				promotedTo && promotedTo.length > 1 && promotedTo.length <= 4,
				'PromotedTo should be available in a deferred promotion request and have between 2 and 4 roles'
			);
			const promotedToSorted = promotedTo.toSorted((a, b) => b - a); // Descending order to render queen on top
			const geometry = context.currentFrame.layout.geometry;

			// Determine piece color from target rank
			const isWhitePromotion = targetRank === 7;
			const pieceColor = isWhitePromotion ? ColorCode.White : ColorCode.Black;
			// Direction: white pieces cascade downward (rank decreases), black upward (rank increases)
			const rankStep = isWhitePromotion ? -1 : 1;

			// Rebuild the active promotion squares set
			internalState.activePromotionSquares.clear();

			// Remove nodes for roles no longer in the desired set
			const desiredRoles = new Set(promotedToSorted);
			for (const [roleCode] of internalState.svgPromotionPieces) {
				if (!desiredRoles.has(roleCode)) {
					extensionCleanPieceNode(internalState, roleCode);
				}
			}

			// Create or update a node for each promotion role
			assert(internalState.slotRoots, 'Slot roots should be available when render is called');
			const layer = internalState.slotRoots.animation;
			for (let i = 0; i < promotedToSorted.length; i++) {
				const roleCode = promotedToSorted[i];
				const displayRank = (targetRank + i * rankStep) as SquareRank;
				const displaySquare = squareOf(targetFile, displayRank);
				const pieceCode = toPieceCode(roleCode, pieceColor) as PromotionPieceCode;
				const url = internalState.config.pieceUrls[pieceCode];
				const r = geometry.getSquareRect(displaySquare);

				const rectAttrs = {
					x: r.x.toString(),
					y: r.y.toString(),
					width: r.width.toString(),
					height: r.height.toString(),
					fill: internalState.config.squareColor.color,
					'fill-opacity': internalState.config.squareColor.opacity.toString(),
					'shape-rendering': 'crispEdges'
				};
				const imageAttrs = {
					href: url,
					x: r.x.toString(),
					y: r.y.toString(),
					width: r.width.toString(),
					height: r.height.toString()
				};

				internalState.activePromotionSquares.set(displaySquare, roleCode);

				const existing = internalState.svgPromotionPieces.get(roleCode) ?? null;
				if (existing !== null) {
					updateElementAttributes(existing.rect, rectAttrs);
					updateElementAttributes(existing.svg, imageAttrs);
				} else {
					const rect = createSvgElement(layer, 'rect', {
						'data-chessboard-id': `promotion-bg-${roleCode}`,
						...rectAttrs
					});
					const svg = createSvgElement(layer, 'image', {
						'data-chessboard-id': `promotion-piece-${roleCode}`,
						...imageAttrs
					});
					internalState.svgPromotionPieces.set(roleCode, { svg, rect });
				}
			}
		},
		renderTransientVisuals(context) {
			const target = context.transientInput.target;
			if (target !== null && internalState.activePromotionSquares.has(target)) {
				// Hover is over one of the promotion squares
				const geometry = context.currentFrame.layout.geometry;
				const r = geometry.getSquareRect(target);
				const attrs = {
					x: r.x.toString(),
					y: r.y.toString(),
					width: r.width.toString(),
					height: r.height.toString(),
					fill: internalState.config.hoverColor.color,
					'fill-opacity': internalState.config.hoverColor.opacity.toString(),
					'shape-rendering': 'crispEdges'
				};
				if (internalState.svgHoverRect) {
					updateElementAttributes(internalState.svgHoverRect, attrs);
				} else {
					assert(
						internalState.slotRoots,
						'Slot roots should be available when renderTransientVisuals is called'
					);
					const layer = internalState.slotRoots.animation;
					internalState.svgHoverRect = createSvgElement(layer, 'rect', {
						'data-chessboard-id': 'promotion-hover',
						...attrs
					});
				}
			} else {
				// Not hovering over a promotion square — remove hover rect
				extensionCleanHoverRect(internalState);
			}
		},
		onEvent(context) {
			assert(
				context.rawEvent.type === 'pointerdown',
				'Only pointerdown events should be subscribed to'
			);
			const targetSquare = context.sceneEvent?.targetSquare ?? null;
			if (targetSquare !== null) {
				const roleCode = internalState.activePromotionSquares.get(targetSquare);
				if (roleCode !== undefined) {
					context.rawEvent.preventDefault(); // Prevent focus change and other side effects if it is our promotion square
					internalState.runtimeSurface.commands.resolveDeferredUIMoveRequest({
						promotedTo: roleCode
					});
					return;
				}
			}
			internalState.runtimeSurface.commands.cancelDeferredUIMoveRequest();
		},
		unmount() {
			extensionUnmountBase<ExtensionSlotsType>(internalState);
			extensionClean(internalState);
		},
		destroy() {
			extensionDestroyBase<ExtensionSlotsType>(internalState);
			extensionClean(internalState);
		}
	};
}
