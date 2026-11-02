import { isEqual } from 'es-toolkit/predicate';
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
import { denormalizeMainRendererConfig } from './denormalize.js';
import { createMainRendererDrag } from './drag/factory.js';
import { normalizeMainRendererConfig } from './normalize.js';
import { createPieceSymbolResolver, ensurePieceSymbolsDefined } from './piece-symbols.js';
import { createMainRendererPieces } from './pieces/factory.js';
import {
	DirtyLayer,
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
	// Forward reference: subsystems read color config through getters that close over the
	// internal state, so a runtime setConfig({ colors }) update is observed on the next render
	// without re-creating the subsystems.
	const board = createMainRendererBoard(() => internalState.config.colors.board);
	const coordinates = createMainRendererCoordinates(() => internalState.config.colors.coordinates);
	const pieces = createMainRendererPieces(pieceSymbolResolver);
	const drag = createMainRendererDrag(
		options.runtimeSurface,
		pieceSymbolResolver,
		() => internalState.config.drag
	);
	const animation = createMainRendererAnimation(
		options.runtimeSurface,
		pieceSymbolResolver,
		() => internalState.config.animation
	);
	const internalState = {
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
	return internalState;
}

function createMainRendererInstancePublic(state: MainRendererInstanceInternal): RendererPublicAPI {
	return {
		getConfig() {
			return denormalizeMainRendererConfig(state.config);
		},
		setConfig(options) {
			// Defensively strip pieceUrls so a non-TS caller cannot bypass the lifecycle.
			const { pieceUrls: _ignored, ...safeInput } = (options ?? {}) as MainRendererInitOptions;
			void _ignored;
			const previous = state.config;
			state.config = normalizeMainRendererConfig(safeInput, state.config);
			let dirty = 0;
			if (!isEqual(state.config.colors.board, previous.colors.board)) {
				dirty |= DirtyLayer.Board;
			}
			if (!isEqual(state.config.colors.coordinates, previous.colors.coordinates)) {
				dirty |= DirtyLayer.Coordinates;
			}
			if (dirty !== 0) {
				state.runtimeSurface.invalidation.markDirty(dirty);
				state.runtimeSurface.commands.requestRender({ state: true });
			}
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
