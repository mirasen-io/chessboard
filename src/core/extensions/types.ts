import { ReadonlyDeep } from 'type-fest';
import { LayoutSnapshot } from '../layout/types';
import { BoardRuntimeReadonlyMutationSession } from '../runtime/mutation/types';
import { BoardRuntimeStateSnapshot } from '../state/types';
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

export interface ExtensionAnimationSessionSubmitOptions<TData> {
	duration: DOMHighResTimeStamp;
	data: TData;
}

export type ExtensionAnimationStatus = 'submitted' | 'active' | 'ended' | 'cancelled';

export interface ExtensionAnimationSession {
	readonly id: string;
	readonly startTime: DOMHighResTimeStamp;
	readonly duration: DOMHighResTimeStamp;
	readonly status: ExtensionAnimationStatus;
	setData<TData>(data: TData): void;
	getData<TData>(): TData;
}

export interface ExtensionAnimationController {
	submit<TData>(options: ExtensionAnimationSessionSubmitOptions<TData>): ExtensionAnimationSession;
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

export type ExtensionOnUpdateStateContextBaseUnmounted =
	ExtensionOnUpdateStateContextCommonUnmounted;

export interface ExtensionOnUpdateStateContextBaseMounted extends ExtensionOnUpdateStateContextCommonMounted {
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationController;
}

export type ExtensionOnUpdateStateContextBase =
	| ExtensionOnUpdateStateContextBaseUnmounted
	| ExtensionOnUpdateStateContextBaseMounted;

type ExtensionRenderPreviousDataField<TExtensionData> = [TExtensionData] extends [void]
	? unknown
	: {
			readonly previousData: ReadonlyDeep<TExtensionData>;
		};

export type ExtensionOnUpdateStateContext<TExtensionData> = ExtensionOnUpdateStateContextBase &
	ExtensionRenderPreviousDataField<TExtensionData>;

export type AnyExtensionOnUpdateStateContext = ExtensionOnUpdateStateContext<unknown>;

export interface RenderLayoutSnapshot extends LayoutSnapshot {
	readonly geometry: NonNullable<LayoutSnapshot['geometry']>;
}

export interface RenderStateFrameSnapshot {
	readonly state: BoardRuntimeStateSnapshot;
	readonly layout: RenderLayoutSnapshot;
}

export interface ExtensionRenderStateContextCommon {
	readonly previous: RenderStateFrameSnapshot | null;
	readonly mutation: BoardRuntimeReadonlyMutationSession;
	readonly current: RenderStateFrameSnapshot;
}

export interface ExtensionRenderStateContextBase extends ExtensionRenderStateContextCommon {
	readonly invalidation: ExtensionReadonlyInvalidationState;
	readonly animation: ExtensionAnimationController;
}

type ExtensionRenderCurrentDataField<TExtensionData> = [TExtensionData] extends [void]
	? unknown
	: {
			readonly currentData: ReadonlyDeep<TExtensionData>;
		};

export type ExtensionRenderStateContext<TExtensionData> = ExtensionRenderStateContextBase &
	ExtensionRenderPreviousDataField<TExtensionData> &
	ExtensionRenderCurrentDataField<TExtensionData>;

export type AnyExtensionRenderStateContext = ExtensionRenderStateContext<unknown>;

export type ExtensionRenderAnimationContextBase = ExtensionRenderStateContextBase;

export type ExtensionRenderAnimationContext<TExtensionData> = ExtensionRenderAnimationContextBase &
	ExtensionRenderPreviousDataField<TExtensionData> &
	ExtensionRenderCurrentDataField<TExtensionData>;

export type AnyExtensionRenderAnimationContext = ExtensionRenderAnimationContext<unknown>;

export type ExtensionRenderVisualsContextBase = ExtensionRenderStateContextBase;

export type ExtensionRenderVisualsContext<TExtensionData> = ExtensionRenderVisualsContextBase &
	ExtensionRenderPreviousDataField<TExtensionData> &
	ExtensionRenderCurrentDataField<TExtensionData>;

export type AnyExtensionRenderVisualsContext = ExtensionRenderVisualsContext<unknown>;

export interface ExtensionInstance<
	TId extends string,
	TSlots extends readonly ExtensionSlotName[],
	TPublic,
	TOnStateUpdateData
> {
	readonly id: TId;
	// Lifecycle
	mount(env: ExtensionInstanceMountOptions<TSlots>): void;
	unmount(): void;
	// Render state cycle
	onStateUpdate(context: ExtensionOnUpdateStateContext<TOnStateUpdateData>): TOnStateUpdateData;
	renderState?(context: ExtensionRenderStateContext<TOnStateUpdateData>): void;
	// Animation
	prepareAnimation?(
		context: ExtensionRenderAnimationContext<TOnStateUpdateData>,
		sessions: readonly ExtensionAnimationSession[]
	): void;
	renderAnimation?(
		context: ExtensionRenderAnimationContext<TOnStateUpdateData>,
		sessions: readonly ExtensionAnimationSession[]
	): void;
	cleanAnimation?(
		context: ExtensionRenderAnimationContext<TOnStateUpdateData>,
		sessions: readonly ExtensionAnimationSession[]
	): void;
	// Visuals
	renderVisuals?(context: ExtensionRenderVisualsContext<TOnStateUpdateData>): void;
	// Public API promoted to board.extensions.<extensionId>.API
	getPublic?(): TPublic;
}

export type AnyExtensionInstance = ExtensionInstance<
	string,
	readonly ExtensionSlotName[],
	unknown,
	unknown
>;

export interface ExtensionDefinition<
	TId extends string,
	TSlots extends readonly ExtensionSlotName[],
	TPublic,
	TOnStateUpdateData
> {
	readonly id: TId;
	readonly slots: TSlots;
	createInstance(): ExtensionInstance<TId, TSlots, TPublic, TOnStateUpdateData>;
}

export type AnyExtensionDefinition = ExtensionDefinition<
	string,
	readonly ExtensionSlotName[],
	unknown,
	unknown
>;

export const MAIN_RENDERER_EXTENSION_ID = 'main-renderer' as const;

export type MainRendererExtensionDefinition = ExtensionDefinition<
	typeof MAIN_RENDERER_EXTENSION_ID,
	readonly ExtensionSlotName[],
	unknown,
	unknown
>;

export type MainRendererExtensionInstance = ExtensionInstance<
	typeof MAIN_RENDERER_EXTENSION_ID,
	readonly ExtensionSlotName[],
	unknown,
	unknown
>;

type ExtensionDefinitionId<T> =
	T extends ExtensionDefinition<infer TId, readonly ExtensionSlotName[], unknown, unknown>
		? TId
		: never;

type ExtensionDefinitionPublicApi<T> =
	T extends ExtensionDefinition<string, readonly ExtensionSlotName[], infer TPublicApi, unknown>
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

export interface ExtensionStoredData {
	previous: unknown | null;
	current: unknown | null;
}

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
	readonly storedData: ExtensionStoredData;
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationControllerInternalSurface;
}

export interface ExtensionSystemInitOptions {
	extensions: readonly AnyExtensionDefinition[];
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
	updateState(request: ExtensionSystemUpdateRequest): void;
	onUnmount(): void;
}
