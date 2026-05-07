import assert from '@ktarmyshov/assert';
import { createVisualSvgElement, updateSvgElementAttributes } from '../../../render/svg/helpers.js';
import type { Square } from '../../../state/board/types/internal.js';
import { ColorCode } from '../../../state/board/types/internal.js';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import type { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import {
	DirtyLayer,
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType,
	WatermarkDefinition,
	WatermarkInstance,
	WatermarkInstanceInternal
} from './types.js';

export function createWatermark(): WatermarkDefinition {
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance(options) {
			return createWatermarkInstance(options);
		}
	};
}

function createWatermarkInternal(
	options: ExtensionCreateInstanceOptions
): WatermarkInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(options),
		svgWatermark: null
	};
}

function extensionClean(state: WatermarkInstanceInternal) {
	state.svgWatermark = null;
}

const watermarkUrl = new URL(
	'../../../../assets/watermark/mirasen.svg',
	import.meta.url
).toString();
const squareRatio = 0.8; // watermark size relative to square size
const opacity = '0.3';

function createWatermarkInstance(options: ExtensionCreateInstanceOptions): WatermarkInstance {
	const internalState = createWatermarkInternal(options);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({
					causes: ['layout.refreshGeometry']
				}) && isUpdateContextRenderable(context);
			if (!needsRender) {
				return;
			}
			context.invalidation.markDirty(DirtyLayer.Watermark);
		},
		render(context) {
			assert(
				context.invalidation.dirtyLayers !== 0,
				'Render should only be called when there are dirty layers'
			);

			const watermarkSquare: Square =
				context.currentFrame.state.view.orientation === ColorCode.White ? 7 : 56;
			const geometry = context.currentFrame.layout.geometry;
			const r = geometry.getSquareRect(watermarkSquare);
			const centerX = r.x + r.width / 2;
			const centerY = r.y + r.height / 2;
			const size = Math.min(r.width, r.height) * squareRatio;
			const x = centerX - size / 2;
			const y = centerY - size / 2;
			const watermarkAttributes = {
				opacity: opacity,
				x: x.toString(),
				y: y.toString(),
				width: size.toString(),
				height: size.toString(),
				href: watermarkUrl,
				'pointer-events': 'none'
			};
			if (internalState.svgWatermark === null) {
				assert(internalState.slotRoots, 'Slot roots should be available when render is called');
				internalState.svgWatermark = createVisualSvgElement(
					internalState.slotRoots.board,
					'image',
					{
						'data-chessboard-id': 'watermark',
						...watermarkAttributes
					}
				);
			} else {
				updateSvgElementAttributes(internalState.svgWatermark, watermarkAttributes);
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
