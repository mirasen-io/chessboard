import type { RuntimeInteractionAction } from '../../../extensions/types/basic/events.js';
import type { TransientInput } from '../../../extensions/types/basic/transient-visuals.js';
import type { ExtensionOnEventContext } from '../../../extensions/types/context/events.js';
import type { PieceCode, Square } from '../../../state/board/types/internal.js';
import type { InteractionStateSnapshot } from '../../../state/interaction/types/main.js';

export interface RuntimeInteractionSurface {
	getInteractionStateSnapshot(): InteractionStateSnapshot;
	getPieceCodeAt(square: Square): PieceCode;
	startLiftedDrag(source: Square, target: Square, startButton: number): void;
	startReleaseTargetingDrag(source: Square, target: Square, startButton: number): void;
	completeCoreDragTo(target: Square): void;
	completeExtensionDrag(target: Square | null): void;
	updateDragSessionCurrentTarget(target: Square | null): void;
	cancelActiveInteraction(): void;
	cancelInteraction(): void;
	transientInput(input: TransientInput): void;
	onEvent(context: ExtensionOnEventContext): void;
}

type _AssertTrue<T extends true> = T;
type _RuntimeInteractionActionTypesMissingFromSurface = Exclude<
	RuntimeInteractionAction['type'],
	keyof RuntimeInteractionSurface
>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AssertRuntimeInteractionActionKeysAreSurfaceKeys = _AssertTrue<
	_RuntimeInteractionActionTypesMissingFromSurface extends never ? true : false
>;

export interface InteractionControllerInternal {
	readonly surface: RuntimeInteractionSurface;
}

export interface InteractionControllerInitOptions {
	surface: RuntimeInteractionSurface;
}

export type InteractionControllerOnEventContext = Omit<
	ExtensionOnEventContext,
	'runtimeInteractionActionPreview'
>;

export interface InteractionController {
	onEvent(context: InteractionControllerOnEventContext): void;
}
