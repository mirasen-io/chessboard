import { LayoutSnapshot } from '../layout/types';
import { BoardRuntimeReadonlyMutationSession } from '../runtime/mutation/types';
import { ColorInput, Move, MoveInput, PositionInput, SquareInput } from '../state/board/types';
import { BoardRuntimeStateSnapshot } from '../state/types';
import { Movability } from '../state/view/types';
import {
	ExtensionInvalidationState,
	ExtensionReadonlyInvalidationState
} from './invalidation/types';

export type ExtensionSlotName =
	| 'defs'
	| 'board'
	| 'coordinates'
	| 'underPieces'
	| 'pieces'
	| 'overPieces'
	| 'animation'
	| 'underDrag'
	| 'drag'
	| 'overDrag';

export const ALL_EXTENSION_SLOTS = [
	'defs',
	'board',
	'coordinates',
	'underPieces',
	'pieces',
	'overPieces',
	'animation',
	'underDrag',
	'drag',
	'overDrag'
] as const satisfies readonly ExtensionSlotName[];

type _CheckAllExtensionSlotsExact = [ExtensionSlotName] extends [
	(typeof ALL_EXTENSION_SLOTS)[number]
]
	? [(typeof ALL_EXTENSION_SLOTS)[number]] extends [ExtensionSlotName]
		? true
		: false
	: false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkAllExtensionSlotsExact: _CheckAllExtensionSlotsExact = true;

export type ExtensionSlotSvgRoots<TSlots extends readonly ExtensionSlotName[]> = Readonly<
	Record<TSlots[number], SVGGElement>
>;

export type ExtensionAllocatedSlotsInternal = Partial<
	ExtensionSlotSvgRoots<readonly ExtensionSlotName[]>
>;

export interface ExtensionInstanceMountOptions<TSlots extends readonly ExtensionSlotName[]> {
	slotRoots: ExtensionSlotSvgRoots<TSlots>;
}

export interface UpdateStateFrameSnapshotUnmounted {
	readonly isMounted: false;
	readonly state: BoardRuntimeStateSnapshot;
}

export interface UpdateStateFrameSnapshotMounted {
	readonly isMounted: true;
	readonly state: BoardRuntimeStateSnapshot;
	readonly layout: LayoutSnapshot;
}

export type UpdateStateFrameSnapshot =
	| UpdateStateFrameSnapshotUnmounted
	| UpdateStateFrameSnapshotMounted;

export interface ExtensionAnimationSessionSubmitOptions {
	duration: DOMHighResTimeStamp;
}

export type ExtensionAnimationStatus = 'submitted' | 'active' | 'ended' | 'cancelled';

export interface ExtensionAnimationSession {
	readonly id: string;
	readonly startTime: DOMHighResTimeStamp;
	readonly duration: DOMHighResTimeStamp;
	readonly status: ExtensionAnimationStatus;
}

export interface ExtensionAnimationController {
	submit(options: ExtensionAnimationSessionSubmitOptions): ExtensionAnimationSession;
	cancel(sessionId: string): void;
	getAll(
		status?: ExtensionAnimationStatus | Iterable<ExtensionAnimationStatus>
	): readonly ExtensionAnimationSession[];
}

export interface ExtensionOnUpdateStateContextCommon {
	readonly previous: UpdateStateFrameSnapshot | null;
	readonly mutation: BoardRuntimeReadonlyMutationSession;
	readonly current: UpdateStateFrameSnapshot;
}

export interface ExtensionOnUpdateStateContextCommonUnmounted extends ExtensionOnUpdateStateContextCommon {
	readonly current: UpdateStateFrameSnapshotUnmounted;
}

export interface ExtensionOnUpdateStateContextCommonMounted extends ExtensionOnUpdateStateContextCommon {
	readonly current: UpdateStateFrameSnapshotMounted;
}

export type ExtensionOnUpdateStateContextUnmounted = ExtensionOnUpdateStateContextCommonUnmounted;

export interface ExtensionOnUpdateStateContextMounted extends ExtensionOnUpdateStateContextCommonMounted {
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationController;
}

export type ExtensionOnUpdateStateContext =
	| ExtensionOnUpdateStateContextUnmounted
	| ExtensionOnUpdateStateContextMounted;

export interface RenderLayoutSnapshot extends LayoutSnapshot {
	readonly geometry: NonNullable<LayoutSnapshot['geometry']>;
}

export interface RenderStateFrameSnapshot {
	readonly state: BoardRuntimeStateSnapshot;
	readonly layout: RenderLayoutSnapshot;
}

export interface ExtensionRenderStateContext {
	readonly current: RenderStateFrameSnapshot;
	readonly invalidation: ExtensionReadonlyInvalidationState;
	readonly animation: ExtensionAnimationController;
}

export type ExtensionRenderAnimationContext = ExtensionRenderStateContext;

export type ExtensionRenderVisualsContext = ExtensionRenderStateContext;

export interface ExtensionInstance<
	TId extends string,
	TSlots extends readonly ExtensionSlotName[],
	TPublic
> {
	readonly id: TId;
	// Lifecycle
	mount(env: ExtensionInstanceMountOptions<TSlots>): void;
	unmount(): void;
	// Render state cycle
	onStateUpdate(context: ExtensionOnUpdateStateContext): void;
	renderState?(context: ExtensionRenderStateContext): void;
	// Animation
	prepareAnimation?(
		context: ExtensionRenderAnimationContext,
		sessions: readonly ExtensionAnimationSession[]
	): void;
	renderAnimation?(
		context: ExtensionRenderAnimationContext,
		sessions: readonly ExtensionAnimationSession[]
	): void;
	cleanAnimation?(
		context: ExtensionRenderAnimationContext,
		sessions: readonly ExtensionAnimationSession[]
	): void;
	// Visuals
	renderVisuals?(context: ExtensionRenderVisualsContext): void;
	// Public API promoted to board.extensions.<extensionId>.API
	getPublic?(): TPublic;
}

export type AnyExtensionInstance = ExtensionInstance<string, readonly ExtensionSlotName[], unknown>;

export interface BoardRuntimeExtensionSurfaceSnapshot {
	state: BoardRuntimeStateSnapshot;
	layout: LayoutSnapshot;
}

export interface BoardRuntimeExtensionSurfaceRenderRequest {
	state?: boolean;
	animation?: boolean;
	visuals?: boolean;
}

export interface BoardRuntimeExtensionSurface {
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
	getSnapshot(): BoardRuntimeExtensionSurfaceSnapshot;
	requestRender(request: BoardRuntimeExtensionSurfaceRenderRequest): void;
}

export interface ExtensionCreateInstanceOptions {
	runtime: BoardRuntimeExtensionSurface;
}
export interface ExtensionDefinition<
	TId extends string,
	TSlots extends readonly ExtensionSlotName[],
	TPublic
> {
	readonly id: TId;
	readonly slots: TSlots;
	createInstance(options: ExtensionCreateInstanceOptions): ExtensionInstance<TId, TSlots, TPublic>;
}

export type AnyExtensionDefinition = ExtensionDefinition<
	string,
	readonly ExtensionSlotName[],
	unknown
>;

export const MAIN_RENDERER_EXTENSION_ID = 'main-renderer' as const;

type ExtensionDefinitionId<T> =
	T extends ExtensionDefinition<infer TId, readonly ExtensionSlotName[], unknown> ? TId : never;

type ExtensionDefinitionPublicApi<T> =
	T extends ExtensionDefinition<string, readonly ExtensionSlotName[], infer TPublicApi>
		? TPublicApi
		: never;

type ExtensionDefinitionHasPublicApi<T> = [ExtensionDefinitionPublicApi<T>] extends [never]
	? false
	: true;

export type ExtensionsPublicMap<TExtensions extends readonly AnyExtensionDefinition[]> = {
	[TDef in TExtensions[number] as ExtensionDefinitionHasPublicApi<TDef> extends true
		? ExtensionDefinitionId<TDef>
		: never]: ExtensionDefinitionPublicApi<TDef>;
};

export interface ExtensionAnimationSessionInternalSurface extends ExtensionAnimationSession {
	setStatus(status: ExtensionAnimationStatus): void;
}

export interface ExtensionAnimationControllerInternalSurface extends ExtensionAnimationController {
	getAll(
		status?: ExtensionAnimationStatus | Iterable<ExtensionAnimationStatus>
	): readonly ExtensionAnimationSessionInternalSurface[];
	remove(sessionId: string | Iterable<string>): void;
	clear(): void;
}

export interface ExtensionSystemExtensionRecord {
	readonly id: string;
	readonly definition: AnyExtensionDefinition;
	readonly instance: AnyExtensionInstance;
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationControllerInternalSurface;
}

export interface ExtensionSystemInitOptions {
	createInstanceOptions: ExtensionCreateInstanceOptions;
	extensions?: readonly AnyExtensionDefinition[];
}

export interface ExtensionSystemInternal {
	readonly extensions: Map<string, ExtensionSystemExtensionRecord>;
	lastUpdated: ExtensionOnUpdateStateContextCommon | null;
}

export interface ExtensionSystemUpdateRequest {
	readonly state: UpdateStateFrameSnapshot;
	readonly mutation: BoardRuntimeReadonlyMutationSession;
}

export interface ExtensionSystem {
	readonly extensions: ReadonlyMap<string, ExtensionSystemExtensionRecord>;
	readonly lastUpdated: ExtensionOnUpdateStateContextCommon | null;
	updateState(request: ExtensionSystemUpdateRequest): void;
	onUnmount(): void;
	onDestroy(): void;
}
