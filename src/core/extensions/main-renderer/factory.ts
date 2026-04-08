import { createSvgRendererBoard } from './board/factory';
import {
	EXTENSION_ID,
	EXTENSION_SLOTS,
	SvgRendererDefinition,
	SvgRendererInitOptions,
	SvgRendererInstance
} from './types/extension';
import { SvgRendererInstanceInternal } from './types/instance';

export function createSvgRenderer(options: SvgRendererInitOptions): SvgRendererDefinition {
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createSvgRendererInstance(options);
		}
	};
}

function createSvgRendererBoardInternal(
	options: SvgRendererInitOptions
): SvgRendererInstanceInternal {
	const board = createSvgRendererBoard(options.board ?? {});
	return { board, slotRoots: null };
}

function validateIsMounted(
	state: SvgRendererInstanceInternal
): asserts state is SvgRendererInstanceInternal & {
	slotRoots: NonNullable<SvgRendererInstanceInternal['slotRoots']>;
} {
	if (state.slotRoots === null) {
		throw new Error('Extension instance is not mounted yet');
	}
}
function createSvgRendererInstance(options: SvgRendererInitOptions): SvgRendererInstance {
	const internalState = createSvgRendererBoardInternal(options);
	return {
		id: EXTENSION_ID,
		mount(env) {
			internalState.slotRoots = env.slotRoots;
		},
		onStateUpdate(context) {
			const boardResult = internalState.board.onUpdate(context);
			return boardResult;
		},
		renderState(context) {
			validateIsMounted(internalState);
			internalState.board.render(context, internalState.slotRoots.board);
		},
		unmount() {
			// For now nothing to do, everything will be just deleted by the chessboard runtime
		}
	};
}
