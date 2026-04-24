import { toMerged } from 'es-toolkit';
import { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import { createMainRendererAnimation } from './animation/factory.js';
import { createMainRendererBoard } from './board/factory.js';
import { createMainRendererCoordinates } from './coordinates/factory.js';
import { createMainRendererDrag } from './drag/factory.js';
import { normalizeMainRendererConfig } from './normalize.js';
import { createMainRendererPieces } from './pieces/factory.js';
import {
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType,
	MainRendererDefinition,
	MainRendererInitOptions,
	MainRendererInstance
} from './types/extension.js';
import { MainRendererInstanceInternal } from './types/instance.js';
import { DEFAULT_MAIN_RENDERER_CONFIG, MainRendererConfig } from './types/internal.js';

export function createMainRenderer(options: MainRendererInitOptions = {}): MainRendererDefinition {
	const config: MainRendererConfig = toMerged(
		DEFAULT_MAIN_RENDERER_CONFIG,
		normalizeMainRendererConfig(options)
	);
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance(options) {
			return createMainRendererInstance(options, config);
		}
	};
}

function createMainRendererInternal(
	options: ExtensionCreateInstanceOptions,
	config: MainRendererConfig
): MainRendererInstanceInternal {
	const board = createMainRendererBoard(config.colors.board);
	const coordinates = createMainRendererCoordinates(config.colors.coordinates);
	const pieces = createMainRendererPieces(config.pieceUrls);
	const drag = createMainRendererDrag(config.pieceUrls, options.runtimeSurface);
	const animation = createMainRendererAnimation(config.pieceUrls, options.runtimeSurface);
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		board,
		coordinates,
		pieces,
		drag,
		animation,
		runtimeSurface: options.runtimeSurface
	};
}

function extensionUnmountLocal(state: MainRendererInstanceInternal) {
	// internalState.board.unmount();
	// internalState.coordinates.unmount();
	state.pieces.unmount();
	state.drag.unmount();
	state.animation.unmount();
}

function validateIsMounted(
	state: MainRendererInstanceInternal
): asserts state is MainRendererInstanceInternal & {
	slotRoots: NonNullable<MainRendererInstanceInternal['slotRoots']>;
} {
	if (state.slotRoots === null) {
		throw new Error('Extension instance is not mounted yet');
	}
}
function createMainRendererInstance(
	options: ExtensionCreateInstanceOptions,
	config: MainRendererConfig
): MainRendererInstance {
	const internalState = createMainRendererInternal(options, config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			internalState.board.onUpdate(context);
			internalState.animation.onUpdate(context);
			internalState.pieces.onUpdate(context, internalState.animation.getSuppressedSquares());
			internalState.drag.onUpdate(context);
		},
		render(context) {
			validateIsMounted(internalState);
			internalState.board.render(context, internalState.slotRoots.board);
			internalState.coordinates.render(context, internalState.slotRoots.coordinates);
			internalState.pieces.render(context, internalState.slotRoots.pieces);
		},
		renderTransientVisuals(context) {
			validateIsMounted(internalState);
			internalState.drag.renderTransientVisuals(context, internalState.slotRoots.drag);
		},
		prepareAnimation(context) {
			validateIsMounted(internalState);
			internalState.animation.prepareAnimation(context, internalState.slotRoots.animation);
		},
		renderAnimation(context) {
			validateIsMounted(internalState);
			internalState.animation.renderAnimation(context);
		},
		onAnimationFinished(context) {
			internalState.pieces.refreshSuppressedSquares(
				context,
				internalState.animation.getSuppressedSquares()
			);
		},
		cleanAnimation(context) {
			internalState.animation.cleanAnimation(context);
		},
		unmount() {
			extensionUnmountLocal(internalState);
			extensionUnmountBase<ExtensionSlotsType>(internalState);
		},
		destroy() {
			extensionUnmountLocal(internalState);
			extensionDestroyBase<ExtensionSlotsType>(internalState);
		}
	};
}
