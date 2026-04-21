import { LayoutSnapshot } from '../../../layout/types.js';
import {
	ColorInput,
	MoveRequestInput,
	PiecePositionInput,
	PositionInput,
	SquareString
} from '../../../state/board/types/input.js';
import { Move } from '../../../state/board/types/internal.js';
import { DeferredUIMoveResolutionDetails } from '../../../state/change/types/ui-move.js';
import { MovabilityInput } from '../../../state/interaction/types/input.js';
import { DragSessionExtensionOwned } from '../../../state/interaction/types/internal.js';
import { RuntimeStateSnapshot } from '../../../state/types.js';
import { ExtensionDragSession } from '../basic/interaction.js';

export interface ExtensionRuntimeSurfaceCommandsSnapshot {
	readonly state: RuntimeStateSnapshot;
	readonly layout: LayoutSnapshot;
}

export interface ExtensionRuntimeSurfaceCommandsRenderRequest {
	state?: boolean;
	animation?: boolean;
}

export interface ExtensionRuntimeSurfaceCommands {
	// Board state
	setPosition(input: PositionInput): boolean;
	setPiecePosition(input: PiecePositionInput): boolean;
	setTurn(turn: ColorInput): boolean;
	move(request: MoveRequestInput): Move;
	// View state
	setOrientation(orientation: ColorInput): boolean;
	setMovability(movability: MovabilityInput): boolean;
	// Interaction state
	select(square: SquareString | null): boolean;
	startDrag(session: ExtensionDragSession): boolean;
	clearActiveInteraction(): boolean;
	clearInteraction(): boolean;
	// Deferred UI move
	resolveDeferredUIMoveRequest(details: DeferredUIMoveResolutionDetails): Move;
	cancelDeferredUIMoveRequest(): boolean;
	// Render
	requestRender(request: ExtensionRuntimeSurfaceCommandsRenderRequest): void;
	// Snapshot
	getSnapshot(): ExtensionRuntimeSurfaceCommandsSnapshot;
}

export interface ExtensionRuntimeSurfaceCommandsInternalSurface extends ExtensionRuntimeSurfaceCommands {
	startDrag(session: DragSessionExtensionOwned): boolean;
}
