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
	SelectedSquareConfig,
	SelectedSquareDefinition,
	SelectedSquareInitConfig,
	SelectedSquareInstance,
	SelectedSquareInstanceInternal
} from './types';

export function createSelectedSquare(
	config: SelectedSquareInitConfig = {}
): SelectedSquareDefinition {
	const mergedConfig = toMerged(DEFAULT_CONFIG, config) as SelectedSquareConfig;
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createSelectedSquareInstance(mergedConfig);
		}
	};
}

function createSelectedSquareInternal(
	config: SelectedSquareConfig
): SelectedSquareInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		svgRect: null,
		config
	};
}

function extensionClean(state: SelectedSquareInstanceInternal) {
	state.svgRect = null;
}

function createSelectedSquareInstance(config: SelectedSquareConfig): SelectedSquareInstance {
	const internalState = createSelectedSquareInternal(config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMount<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({
					causes: [
						'state.interaction.setSelectedSquare',
						'state.interaction.clear',
						'layout.refreshGeometry'
					]
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

			const selectedSquare = context.currentFrame.state.interaction.selected?.square;
			if (selectedSquare === undefined || selectedSquare === null) {
				if (internalState.svgRect !== null) {
					internalState.svgRect.remove();
					internalState.svgRect = null;
				}
				return;
			}
			const geometry = context.currentFrame.layout.geometry;
			const r = geometry.squareRect(selectedSquare);
			const rectAttributes = {
				x: r.x.toString(),
				y: r.y.toString(),
				width: r.size.toString(),
				height: r.size.toString(),
				fill: internalState.config.color,
				'fill-opacity': internalState.config.opacity.toString(),
				'shape-rendering': 'crispEdges'
			};
			if (internalState.svgRect === null) {
				assert(internalState.slotRoots, 'Slot roots should be available when render is called');
				internalState.svgRect = createSvgElement(internalState.slotRoots.underPieces, 'rect', {
					'data-chessboard-id': 'selected-square-highlight',
					...rectAttributes
				});
			} else {
				updateElementAttributes(internalState.svgRect, rectAttributes);
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
