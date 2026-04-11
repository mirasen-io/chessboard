import { LayoutSnapshot } from '../../../layout/types';
import {
	ColorInput,
	Move,
	MoveInput,
	PositionInput,
	SquareInput
} from '../../../state/board/types';
import { Movability } from '../../../state/interaction/types';
import { RuntimeStateSnapshot } from '../../../state/types';

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
	setTurn(turn: ColorInput): boolean;
	move(move: MoveInput): Move;
	// View state
	setOrientation(orientation: ColorInput): boolean;
	setMovability(movability: Movability): boolean;
	// Interaction state
	select(square: SquareInput | null): boolean;
	cancelInteraction(): boolean;
	// Snapshot
	getSnapshot(): ExtensionRuntimeSurfaceCommandsSnapshot;
	// Render
	requestRender(request: ExtensionRuntimeSurfaceCommandsRenderRequest): void;
}
