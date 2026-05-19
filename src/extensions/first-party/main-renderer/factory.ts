import { cloneDeep } from 'es-toolkit';
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
import { createPieceSymbolResolver, ensurePieceSymbolsDefined } from './piece-symbols.js';
import { createMainRendererPieces } from './pieces/factory.js';
import {
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType,
	MainRendererDefinition,
	MainRendererInstance,
	RendererPublicAPI
} from './types/extension.js';
import { MainRendererInstanceInternal } from './types/instance.js';
import type { MainRendererConfig } from './types/internal.js';
import { DefaultMainRendererDesktopConfig } from './types/internal.js';
import type { MainRendererInitOptions } from './types/public.js';

export function createMainRenderer(options?: MainRendererInitOptions): MainRendererDefinition {
	const config = normalizeMainRendererConfig(options, DefaultMainRendererDesktopConfig);
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
	const pieceSymbolResolver = createPieceSymbolResolver(options.svgIds);
	const board = createMainRendererBoard(config.colors.board);
	const coordinates = createMainRendererCoordinates(config.colors.coordinates);
	const pieces = createMainRendererPieces(pieceSymbolResolver);
	const drag = createMainRendererDrag(options.runtimeSurface, pieceSymbolResolver);
	const animation = createMainRendererAnimation(options.runtimeSurface, pieceSymbolResolver);
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(options),
		board,
		coordinates,
		pieces,
		drag,
		animation,
		runtimeSurface: options.runtimeSurface,
		pieceSymbolResolver,
		config
	};
}

function createMainRendererInstancePublic(state: MainRendererInstanceInternal): RendererPublicAPI {
	return {
		getDragConfig() {
			return cloneDeep(state.config.drag);
		},
		setDragConfig(options) {
			state.config = normalizeMainRendererConfig({ drag: options }, state.config);
		}
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
	const publicInterface = createMainRendererInstancePublic(internalState);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
			ensurePieceSymbolsDefined(
				env.slotRoots.defs,
				internalState.config.pieceUrls,
				internalState.pieceSymbolResolver
			);
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
		},
		getPublic() {
			return publicInterface;
		}
	};
}
