import { SceneEvent } from '../../../extensions/types/basic/events.js';
import { TransientInput } from '../../../extensions/types/basic/transient-visuals.js';
import { PieceCode, Square } from '../../../state/board/types/internal.js';
import { InteractionStateSnapshot } from '../../../state/interaction/types/main.js';

export interface RuntimeInteractionSurface {
	getInteractionStateSnapshot(): InteractionStateSnapshot;
	getPieceCodeAt(square: Square): PieceCode;
	startLiftedDrag(source: Square, target: Square): void;
	dropTo(target: Square): void;
	startReleaseTargetingDrag(source: Square, target: Square): void;
	releaseTo(target: Square): void;
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
