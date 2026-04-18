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
} from './types';

export function createLastMove(config: LastMoveInitConfig = {}): LastMoveDefinition {
	const mergedConfig = toMerged(DEFAULT_CONFIG, config) as LastMoveConfig;
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createLastMoveInstance(mergedConfig);
		}
	};
}

function createLastMoveInternal(config: LastMoveConfig): LastMoveInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		svgRectFrom: null,
		svgRectTo: null,
		config
	};
}

function extensionClean(state: LastMoveInstanceInternal) {
	state.svgRectFrom = null;
	state.svgRectTo = null;
}

function createLastMoveInstance(config: LastMoveConfig): LastMoveInstance {
	const internalState = createLastMoveInternal(config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMount<ExtensionSlotsType>(internalState, env.slotRoots);
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
			const rFrom = geometry.squareRect(fromSq);
			const rTo = geometry.squareRect(toSq);
			const rectFromAttributes = {
				x: rFrom.x.toString(),
				y: rFrom.y.toString(),
				width: rFrom.size.toString(),
				height: rFrom.size.toString(),
				fill: internalState.config.color,
				'fill-opacity': internalState.config.opacity.toString(),
				'shape-rendering': 'crispEdges'
			};
			const rectToAttributes = {
				x: rTo.x.toString(),
				y: rTo.y.toString(),
				width: rTo.size.toString(),
				height: rTo.size.toString(),
				fill: internalState.config.color,
				'fill-opacity': internalState.config.opacity.toString(),
				'shape-rendering': 'crispEdges'
			};

			if (internalState.svgRectFrom === null) {
				assert(internalState.slotRoots, 'Slot roots should be available when render is called');
				internalState.svgRectFrom = createSvgElement(internalState.slotRoots.underPieces, 'rect', {
					'data-chessboard-id': 'last-move-square-from-highlight',
					...rectFromAttributes
				});
				internalState.svgRectTo = createSvgElement(internalState.slotRoots.underPieces, 'rect', {
					'data-chessboard-id': 'last-move-square-to-highlight',
					...rectToAttributes
				});
			} else {
				updateElementAttributes(internalState.svgRectFrom, rectFromAttributes);
				assert(
					internalState.svgRectTo,
					'svgRectTo should be available if svgRectFrom is available'
				);
				updateElementAttributes(internalState.svgRectTo, rectToAttributes);
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
