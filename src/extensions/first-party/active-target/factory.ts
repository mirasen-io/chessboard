import assert from '@ktarmyshov/assert';
import { toMerged } from 'es-toolkit';
import { createSvgElement, updateElementAttributes } from '../../../render/svg/helpers';
import { isUpdateContextRenderable } from '../../types/context/update';
import {
	extensionCreateInternalBase,
	extensionDestroy,
	extensionMount,
	extensionUnmount
} from '../common/helpers';
import {
	ActiveTargetConfig,
	ActiveTargetDefinition,
	ActiveTargetInitConfig,
	ActiveTargetInstance,
	ActiveTargetInstanceInternal,
	DEFAULT_CONFIG,
	DirtyLayer,
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType
} from './types';

export function createActiveTarget(config: ActiveTargetInitConfig = {}): ActiveTargetDefinition {
	const mergedConfig = toMerged(DEFAULT_CONFIG, config) as ActiveTargetConfig;
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createActiveTargetInstance(mergedConfig);
		}
	};
}

function createActiveTargetInternal(config: ActiveTargetConfig): ActiveTargetInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		svgRect: null,
		svgCircle: null,
		config
	};
}

function extensionClean(state: ActiveTargetInstanceInternal) {
	state.svgRect = null;
	state.svgCircle = null;
}

function createActiveTargetInstance(config: ActiveTargetConfig): ActiveTargetInstance {
	const internalState = createActiveTargetInternal(config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMount<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({
					causes: ['layout.refreshGeometry'],
					// we really need almost all: setDrag, updateTarget, clear, clearActive, so just take all interaction mutations
					prefixes: ['state.interaction.']
				}) && isUpdateContextRenderable(context);
			if (!needsRender) {
				return; // no-op
			}
			context.invalidation.markDirty(DirtyLayer.Highlight);
		},
		render(context) {
			assert(
				context.invalidation.dirtyLayers !== 0,
				'Render should only be called when there are dirty layers'
			);

			// For AI: `release-targeting` is also represented by `dragSession`.
			// `dragSession` here is the active interaction session, not only lifted-piece drag.
			const square = context.currentFrame.state.interaction.dragSession?.targetSquare;
			if (square === undefined || square === null) {
				if (internalState.svgRect !== null) {
					internalState.svgRect.remove();
					internalState.svgRect = null;
					assert(internalState.svgCircle, 'svgCircle should be available if svgRect is available');
					internalState.svgCircle.remove();
					internalState.svgCircle = null;
				}
				return;
			}
			const geometry = context.currentFrame.layout.geometry;
			const r = geometry.squareRect(square);
			const rectAttributes = {
				x: r.x.toString(),
				y: r.y.toString(),
				width: r.size.toString(),
				height: r.size.toString(),
				fill: internalState.config.squareColor.color,
				'fill-opacity': internalState.config.squareColor.opacity.toString(),
				'shape-rendering': 'crispEdges'
			};
			const radius = geometry.squareSize * internalState.config.halo.radiusRatio;
			const centerX = r.x + r.size / 2;
			const centerY = r.y + r.size / 2;
			const haloAttributes = {
				cx: centerX.toString(),
				cy: centerY.toString(),
				r: radius.toString(),
				fill: internalState.config.halo.color.color,
				'fill-opacity': internalState.config.halo.color.opacity.toString()
			};
			if (internalState.svgRect === null) {
				assert(internalState.slotRoots, 'Slot roots should be available when render is called');
				internalState.svgRect = createSvgElement(internalState.slotRoots.underPieces, 'rect', {
					'data-chessboard-id': 'active-target-square-highlight',
					...rectAttributes
				});
				internalState.svgCircle = createSvgElement(internalState.slotRoots.overPieces, 'circle', {
					'data-chessboard-id': 'active-target-halo',
					...haloAttributes
				});
			} else {
				updateElementAttributes(internalState.svgRect, rectAttributes);
				assert(internalState.svgCircle, 'svgCircle should be available if svgRect is available');
				updateElementAttributes(internalState.svgCircle, haloAttributes);
			}
		},
		unmount() {
			extensionUnmount<ExtensionSlotsType>(internalState);
			extensionClean(internalState);
		},
		destroy() {
			extensionDestroy<ExtensionSlotsType>(internalState);
			extensionClean(internalState);
		}
	};
}
