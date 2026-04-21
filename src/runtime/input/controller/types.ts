import { TransientInput } from '../../../extensions/types/basic/transient-visuals.js';
import { ExtensionOnEventContext } from '../../../extensions/types/context/events.js';
import { PieceCode, Square } from '../../../state/board/types/internal.js';
import { InteractionStateSnapshot } from '../../../state/interaction/types/main.js';

export interface RuntimeInteractionSurface {
	getInteractionStateSnapshot(): InteractionStateSnapshot;
	getPieceCodeAt(square: Square): PieceCode;
	startLiftedDrag(source: Square, target: Square): void;
	startReleaseTargetingDrag(source: Square, target: Square): void;
	completeCoreDragTo(target: Square): void;
	completeExtensionDrag(target: Square | null): void;
	updateDragSessionCurrentTarget(target: Square | null): void;
	cancelActiveInteraction(): void;
	cancelInteraction(): void;
	transientInput(input: TransientInput): void;
	onEvent(context: ExtensionOnEventContext): void;
}

export interface InteractionControllerInternal {
	readonly surface: RuntimeInteractionSurface;
}

export interface InteractionControllerInitOptions {
	surface: RuntimeInteractionSurface;
}

export interface InteractionController {
	onEvent(context: ExtensionOnEventContext): void;
}
