import { SceneEvent } from '../../../extensions/types/basic/events';
import { TransientInput } from '../../../extensions/types/basic/transient-visuals';
import { Move, Square } from '../../../state/board/types';
import { InteractionStateSnapshot } from '../../../state/interaction/types';

export interface RuntimeInteractionSurface {
	getInteractionStateSnapshot(): InteractionStateSnapshot;
	getPieceCodeAt(square: Square): number;
	startLiftedDrag(source: Square, target: Square): void;
	dropTo(target: Square): Move;
	startReleaseTargetingDrag(source: Square, target: Square): void;
	releaseTo(target: Square): Move;
	updateDragSessionCurrentTarget(target: Square | null): void;
	cancelActiveInteraction(): void;
	cancelInteraction(): void;
	transientInput(input: TransientInput): void;
}

export interface InteractionControllerInternal {
	readonly surface: RuntimeInteractionSurface;
}

export interface InteractionControllerInitOptions {
	surface: RuntimeInteractionSurface;
}

export interface InteractionController {
	onEvent(event: SceneEvent): void;
}
