import assert from '@ktarmyshov/assert';
import { toMerged } from 'es-toolkit';
import { clearElementChildren, createSvgElement } from '../../../render/svg/helpers';
import { isNonEmptyPieceCode } from '../../../state/board/check';
import { fromPieceCode } from '../../../state/board/piece';
import { MovabilityModeCode } from '../../../state/interaction/types/internal';
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
	LegalMovesConfig,
	LegalMovesDefinition,
	LegalMovesInitConfig,
	LegalMovesInstance,
	LegalMovesInstanceInternal
} from './types';

export function createLegalMoves(config: LegalMovesInitConfig = {}): LegalMovesDefinition {
	const mergedConfig = toMerged(DEFAULT_CONFIG, config) as LegalMovesConfig;
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createLegalMovesInstance(mergedConfig);
		}
	};
}

function createLegalMovesInternal(config: LegalMovesConfig): LegalMovesInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		svgCircles: [],
		config
	};
}

function extensionClean(state: LegalMovesInstanceInternal) {
	state.svgCircles = [];
}

function createLegalMovesInstance(config: LegalMovesConfig): LegalMovesInstance {
	const internalState = createLegalMovesInternal(config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMount<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({
					causes: ['layout.refreshGeometry'],
					// we really need almost all: setDrag, updateTarget, clear, clearActive, setMovability, so just take all interaction mutations
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

			assert(internalState.slotRoots, 'Slot roots should be available when render is called');
			clearElementChildren(internalState.slotRoots.overPieces);
			internalState.svgCircles = [];

			const interaction = context.currentFrame.state.interaction;
			const needsRender =
				interaction.movability.mode === MovabilityModeCode.Strict &&
				interaction.activeDestinations.size > 0 &&
				interaction.selected !== null;

			if (!needsRender) {
				return; // no-op
			}

			const geometry = context.currentFrame.layout.geometry;
			const commonAttributesEmpty = {
				r: (geometry.squareSize * internalState.config.emptySquare.radiusRatio).toString(),
				fill: internalState.config.emptySquare.color.color,
				'fill-opacity': internalState.config.emptySquare.color.opacity.toString()
			};
			const commonAttributesCapture = {
				r: (geometry.squareSize * internalState.config.captureTarget.radiusRatio).toString(),
				stroke: internalState.config.captureTarget.color.color,
				'stroke-opacity': internalState.config.captureTarget.color.opacity.toString(),
				'stroke-width': (
					geometry.squareSize * internalState.config.captureTarget.strokeWidthRatio
				).toString(),
				fill: 'none'
			}; // TODO: Remove, this is just for visual test
			for (const [square, destination] of interaction.activeDestinations) {
				const rect = geometry.squareRect(square);
				const circleX = rect.x + geometry.squareSize / 2;
				const circleY = rect.y + geometry.squareSize / 2;
				const selectedPieceCode =
					context.currentFrame.state.board.pieces[interaction.selected.square];
				const targetPieceCode = context.currentFrame.state.board.pieces[destination.to];
				const isCapture =
					isNonEmptyPieceCode(targetPieceCode) &&
					fromPieceCode(targetPieceCode).color !== fromPieceCode(selectedPieceCode).color;
				const attributes = {
					cx: circleX.toString(),
					cy: circleY.toString(),
					...(!isCapture ? commonAttributesEmpty : commonAttributesCapture)
				};
				const circle = createSvgElement(internalState.slotRoots.overPieces, 'circle', {
					'data-chessboard-id': `legal-move-from-${square}-to-${destination.to}`,
					...attributes
				});
				internalState.svgCircles.push(circle);
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
