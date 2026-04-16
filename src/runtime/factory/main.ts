import assert from '@ktarmyshov/assert';
import { createExtensionSystem } from '../../extensions/factory/main';
import { ExtensionRuntimeSurfaceCommands } from '../../extensions/types/surface/commands';
import { createLayout } from '../../layout/factory';
import { createRenderSystem } from '../../render/factory';
import { isNonEmptyPieceCode } from '../../state/board/check';
import { BoardStateMutationSession } from '../../state/board/mutation';
import { normalizeSquare } from '../../state/board/normalize';
import { createRuntimeState } from '../../state/factory';
import { InteractionStateMutationSession } from '../../state/interaction/mutation';
import { InteractionStateSelected } from '../../state/interaction/types/main';
import { ViewStateMutationSession } from '../../state/view/mutation';
import { createInteractionController } from '../input/controller/factory';
import { runtimeDestroy, runtimeMount, runtimeUnmount } from '../lifecycle';
import { createRuntimeMutationPipeline } from '../mutation/factory';
import { runtimeRunMutationPipeline } from '../mutation/run';
import type {
	Runtime,
	RuntimeInitOptions,
	RuntimeInitOptionsInternal,
	RuntimeInternal,
	RuntimeStatus
} from '../types';
import { createRuntimeInteractionSurface } from './input';

function createRuntimeInternal(options: RuntimeInitOptionsInternal): RuntimeInternal {
	const extensionSystem = createExtensionSystem(options);
	const render = createRenderSystem({
		doc: options.doc,
		sharedDataFromExtensionSystem: extensionSystem.getSharedDataForRenderSystem()
	});
	return {
		state: createRuntimeState(options.state ?? {}),
		layout: createLayout(),
		mutation: createRuntimeMutationPipeline(),
		renderSystem: render,
		extensionSystem: extensionSystem,
		resizeObserver: null,
		inputAdapter: null,
		interactionController: createInteractionController({
			surface: createRuntimeInteractionSurface(options.getInternalState)
		})
	};
}

function createExtensionRuntimeSurfaceCommands(
	getInternalState: () => RuntimeInternal
): ExtensionRuntimeSurfaceCommands {
	// @ts-expect-error - For now we just return partial object. TODO: REMOVE!!!!
	return {
		setPosition(input) {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.board.setPosition(
				input,
				mutationSession as BoardStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		setPiecePosition(input) {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.board.setPiecePosition(
				input,
				mutationSession as BoardStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		setTurn(turn) {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.board.setTurn(turn, mutationSession as BoardStateMutationSession);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		setOrientation(orientation) {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.view.setOrientation(
				orientation,
				mutationSession as ViewStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		setMovability(movability) {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.interaction.setMovability(
				movability,
				mutationSession as InteractionStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		select(square) {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			let interactionStateSelected: InteractionStateSelected | null = null;
			if (square !== null) {
				const normalizedSquare = normalizeSquare(square);
				const piece = state.state.board.getPieceCodeAt(normalizedSquare);
				assert(isNonEmptyPieceCode(piece), 'Selected square is expected to have a piece');
				interactionStateSelected = {
					square: normalizedSquare,
					pieceCode: piece
				};
			}
			const changed = state.state.interaction.setSelected(
				interactionStateSelected,
				mutationSession as InteractionStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		clearActiveInteraction() {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.interaction.clearActive(
				mutationSession as InteractionStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		clearInteraction() {
			const state = getInternalState();
			const mutationSession = state.mutation.getSession();
			const changed = state.state.interaction.clear(
				mutationSession as InteractionStateMutationSession
			);
			runtimeRunMutationPipeline(state);
			return changed;
		},
		getSnapshot() {
			const state = getInternalState();
			return {
				state: state.state.getSnapshot(),
				layout: state.layout.getSnapshot()
			};
		}
	};
}

export function createRuntime(options: RuntimeInitOptions): Runtime {
	let internalState: RuntimeInternal | null = null;
	let internalStatus: RuntimeStatus = 'constructing';
	function getInternalState(): RuntimeInternal {
		if (internalStatus === 'constructing' || internalStatus === 'destroyed') {
			throw new Error(`Cannot access internal state when runtime is ${internalStatus}`);
		}
		if (!internalState) {
			throw new Error('Internal state is not initialized');
		}
		return internalState;
	}

	// Create RuntimeExtensionSurface to pass to the extension system for initialization of extension instances
	const extensionSurface = createExtensionRuntimeSurfaceCommands(getInternalState);

	// Now construct the internal state
	const optionsInternal: RuntimeInitOptionsInternal = {
		...options,
		extensionRuntimeSurfaceCommands: extensionSurface,
		getInternalState
	};
	internalState = createRuntimeInternal(optionsInternal);

	// Initial creation, so we mark board position as mutated to trigger mutation pipeline
	internalState.mutation.addMutation('state.board.setPosition', true);

	// We will have two different interfaces here
	// One is returned, one is for controller - with different methods
	// At the moment our assumption that controller will use Runtime but not opposite direction
	// So we can construct these two objects separately so they would not be huge!
	// TODO: const inputControllerSurface = createRuntimeInputControllerSurface(internalState);

	// Initial run to process initial mutations and set up previousContext for the next runs
	internalStatus = 'unmounted';
	internalState.mutation.run(internalState);
	return {
		get status() {
			return internalStatus;
		},
		mount(container) {
			runtimeMount(getInternalState(), container);
			internalStatus = 'mounted';
		},
		unmount() {
			runtimeUnmount(getInternalState());
			internalStatus = 'unmounted';
		},
		destroy() {
			runtimeDestroy(getInternalState());
			internalStatus = 'destroyed';
			internalState = null;
		},
		...extensionSurface
	};
}
