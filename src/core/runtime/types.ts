import { SvgRendererInitOptions } from '../extensions/main-renderer/types/extension';
import { AnyExtensionDefinition, ExtensionSystem } from '../extensions/types';
import { Layout, LayoutSnapshot } from '../layout/types';
import { Render } from '../render/types';
import { ColorInput, Move, MoveInput, PositionInput, SquareInput } from '../state/board/types';
import {
	BoardRuntimeState,
	BoardRuntimeStateInitOptions,
	BoardRuntimeStateSnapshot
} from '../state/types';
import { Movability } from '../state/view/types';
import { BoardRuntimeMutationPipeline } from './mutation/pipeline';

export interface BoardRuntimeInternal {
	readonly state: BoardRuntimeState;
	readonly layout: Layout;
	readonly mutation: BoardRuntimeMutationPipeline;
	readonly render: Render;
	readonly extensions: ExtensionSystem;
	resizeObserver: ResizeObserver | null;
}

export interface BoardRuntimeInitOptionsRenderInternal {
	doc: Document;
	renderer?: SvgRendererInitOptions;
}

export interface BoardRuntimeInitOptionsInternal {
	state?: BoardRuntimeStateInitOptions;
	extensions?: AnyExtensionDefinition[];
	render: BoardRuntimeInitOptionsRenderInternal;
}

export interface BoardRuntimeInitOptionsRender {
	doc: Document;
	renderer?: SvgRendererInitOptions;
}

export interface BoardRuntimeInitOptions {
	state?: BoardRuntimeStateInitOptions;
	extensions?: AnyExtensionDefinition[];
	render: BoardRuntimeInitOptionsRender;
}

export interface BoardRuntimeSnapshot {
	state: BoardRuntimeStateSnapshot;
	layout: LayoutSnapshot;
}

/**
 * Public interface for the internal runtime.
 * Orchestrates board state, view state, interaction state, and invalidation.
 * Board/view/interaction reducers own mutation logic; the runtime coordinates scheduling
 * and geometry updates in response to state changes.
 */
export interface BoardRuntime {
	// Lifecycle
	mount(container: HTMLElement): void;
	unmount(): void;
	// Board state
	setPosition(input: PositionInput): boolean;
	setTurn(turn: ColorInput): boolean;
	move(move: MoveInput): Move;
	// View state
	setOrientation(orientation: ColorInput): boolean;
	setMovability(movability: Movability): boolean;
	// Interaction — semantic selection transition
	// Synchronized: sets selectedSquare + derives destinations + clears drag/target.
	// Throws if a drag session is active (use cancelInteraction() first).
	// Does NOT check occupancy, color, or legality — "select a square", not "select a piece".
	select(square: SquareInput | null): boolean;
	// cancelInteraction: clear active interaction mode and currentTarget, preserve selection context.
	// Clears dragSession, currentTarget, and releaseTargetingActive.
	// Keeps selectedSquare + destinations.
	cancelInteraction(): boolean;
	getSnapshot(): BoardRuntimeSnapshot;
}
