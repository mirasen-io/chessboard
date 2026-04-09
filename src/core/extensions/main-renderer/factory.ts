import { toMerged } from 'es-toolkit';
import { createMainRendererBoard } from './board/factory';
import { createMainRendererCoordinates } from './coordinates/factory';
import { DEFAULT_MAIN_RENDERER_CONFIG, MainRendererConfig } from './types/config';
import {
	EXTENSION_ID,
	EXTENSION_SLOTS,
	MainRendererDefinition,
	MainRendererInitOptions,
	MainRendererInstance
} from './types/extension';
import { MainRendererInstanceInternal } from './types/instance';

export function createMainRenderer(options: MainRendererInitOptions = {}): MainRendererDefinition {
	const config: MainRendererConfig = toMerged(DEFAULT_MAIN_RENDERER_CONFIG, options);
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createMainRendererInstance(config);
		}
	};
}

function createMainRendererInternalState(config: MainRendererConfig): MainRendererInstanceInternal {
	const board = createMainRendererBoard(config.colors.board);
	const coordinates = createMainRendererCoordinates(config.colors.coordinates);
	return { board, coordinates, slotRoots: null };
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
function createMainRendererInstance(config: MainRendererConfig): MainRendererInstance {
	const internalState = createMainRendererInternalState(config);
	return {
		id: EXTENSION_ID,
		mount(env) {
			internalState.slotRoots = env.slotRoots;
		},
		onStateUpdate(context) {
			internalState.board.onUpdate(context);
			// result = boardResult;
			// internalState.coordinates.onUpdate(context); // For now the coordinates are updated together with the board
			// result = toMerged(result, coordinatesResult);
			// return result;
		},
		renderState(context) {
			validateIsMounted(internalState);
			internalState.board.render(context, internalState.slotRoots.board);
			internalState.coordinates.render(context, internalState.slotRoots.coordinates);
		},
		unmount() {
			// For now nothing to do, everything will be just deleted by the chessboard runtime
		}
	};
}
