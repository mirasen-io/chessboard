import assert from '@ktarmyshov/assert';
import { toMerged } from 'es-toolkit';
import { createVisualSvgElement, updateSvgElementAttributes } from '../../../render/svg/helpers.js';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import type { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import {
	DEFAULT_CONFIG,
	DirtyLayer,
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType,
	LastMoveConfig,
	LastMoveDefinition,
	LastMoveInitConfig,
	LastMoveInstance,
	LastMoveInstanceInternal
} from './types.js';

export function createLastMove(config: LastMoveInitConfig = {}): LastMoveDefinition {
	const mergedConfig = toMerged(DEFAULT_CONFIG, config) as LastMoveConfig;
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance(options) {
			return createLastMoveInstance(options, mergedConfig);
		}
	};
}

function createLastMoveInternal(
	options: ExtensionCreateInstanceOptions,
	config: LastMoveConfig
): LastMoveInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(options),
		svgRectFrom: null,
		svgRectTo: null,
		config
	};
}

function extensionClean(state: LastMoveInstanceInternal) {
	state.svgRectFrom = null;
	state.svgRectTo = null;
}

function createLastMoveInstance(
	options: ExtensionCreateInstanceOptions,
	config: LastMoveConfig
): LastMoveInstance {
	const internalState = createLastMoveInternal(options, config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({
					causes: ['state.change.setLastMove', 'layout.refreshGeometry']
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

			const fromSq = context.currentFrame.state.change.lastMove?.from;
			const toSq = context.currentFrame.state.change.lastMove?.to;
			if (fromSq === undefined || fromSq === null || toSq === undefined || toSq === null) {
				if (internalState.svgRectFrom !== null) {
					internalState.svgRectFrom.remove();
					internalState.svgRectFrom = null;
					assert(
						internalState.svgRectTo,
						'svgRectTo should be available if svgRectFrom is available'
					);
					internalState.svgRectTo.remove();
					internalState.svgRectTo = null;
				}
				return;
			}
			const geometry = context.currentFrame.layout.geometry;
			const rFrom = geometry.getSquareRect(fromSq);
			const rTo = geometry.getSquareRect(toSq);
			const rectFromAttributes = {
				x: rFrom.x.toString(),
				y: rFrom.y.toString(),
				width: rFrom.width.toString(),
				height: rFrom.height.toString(),
				fill: internalState.config.color,
				'fill-opacity': internalState.config.opacity.toString(),
				'shape-rendering': 'crispEdges'
			};
			const rectToAttributes = {
				x: rTo.x.toString(),
				y: rTo.y.toString(),
				width: rTo.width.toString(),
				height: rTo.height.toString(),
				fill: internalState.config.color,
				'fill-opacity': internalState.config.opacity.toString(),
				'shape-rendering': 'crispEdges'
			};

			if (internalState.svgRectFrom === null) {
				assert(internalState.slotRoots, 'Slot roots should be available when render is called');
				internalState.svgRectFrom = createVisualSvgElement(
					internalState.slotRoots.underPieces,
					'rect',
					{
						'data-chessboard-id': 'last-move-square-from-highlight',
						...rectFromAttributes
					}
				);
				internalState.svgRectTo = createVisualSvgElement(
					internalState.slotRoots.underPieces,
					'rect',
					{
						'data-chessboard-id': 'last-move-square-to-highlight',
						...rectToAttributes
					}
				);
			} else {
				updateSvgElementAttributes(internalState.svgRectFrom, rectFromAttributes);
				assert(
					internalState.svgRectTo,
					'svgRectTo should be available if svgRectFrom is available'
				);
				updateSvgElementAttributes(internalState.svgRectTo, rectToAttributes);
			}
		},
		unmount() {
			extensionUnmountBase<ExtensionSlotsType>(internalState, EXTENSION_ID);
			extensionClean(internalState);
		},
		destroy() {
			extensionDestroyBase<ExtensionSlotsType>(internalState, EXTENSION_ID);
			extensionClean(internalState);
		}
	};
}
