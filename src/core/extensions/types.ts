import { ReadonlyDeep } from 'type-fest';
import { RenderGeometry } from '../layout/geometry/types';
import { LayoutSnapshot } from '../layout/types';
import { BoardRuntimeReadonlyMutationSession } from '../runtime/mutation/types';
import { BoardRuntimeStateSnapshot } from '../state/types';

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

export type ExtensionAllocatedSlotsInternal = ExtensionSlotSvgRoots<readonly ExtensionSlotName[]>;

export interface ExtensionInstanceMountOptions<TSlots extends readonly ExtensionSlotName[]> {
	slotRoots: ExtensionSlotSvgRoots<TSlots>;
}

export type ExtensionLayoutSnapshot = LayoutSnapshot &
	ReadonlyDeep<{
		readonly geometry: RenderGeometry;
	}>;

export interface RenderStateFrameSnapshot {
	readonly state: BoardRuntimeStateSnapshot;
	readonly layout: ExtensionLayoutSnapshot;
}

export interface ExtensionReadonlyInvalidationState {
	readonly dirtyLayers: number; // bitfield of Layer values
}

export interface ExtensionInvalidationState extends ExtensionReadonlyInvalidationState {
	markDirty(layers: number): void;
	clearDirty(layers: number): void;
	clear(): void;
}

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

export interface ExtensionOnUpdateStateContextCommonBase {
	readonly previous: RenderStateFrameSnapshot | null;
	readonly mutation: BoardRuntimeReadonlyMutationSession;
	readonly current: RenderStateFrameSnapshot;
}

export interface ExtensionOnUpdateStateContextBase extends ExtensionOnUpdateStateContextCommonBase {
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationController;
}

type ExtensionRenderPreviousDataField<TExtensionData> = [TExtensionData] extends [void]
	? unknown
	: {
			readonly previousData: ReadonlyDeep<TExtensionData>;
		};

export type ExtensionOnUpdateStateContext<TExtensionData> = ExtensionOnUpdateStateContextBase &
	ExtensionRenderPreviousDataField<TExtensionData>;

export type AnyExtensionOnUpdateStateContext = ExtensionOnUpdateStateContext<unknown>;

type ExtensionRenderCurrentDataField<TExtensionData> = [TExtensionData] extends [void]
	? unknown
	: {
			readonly currentData: ReadonlyDeep<TExtensionData>;
		};

export interface ExtensionRenderStateContextCommonBase {
	readonly previous: RenderStateFrameSnapshot | null;
	readonly mutation: BoardRuntimeReadonlyMutationSession;
	readonly current: RenderStateFrameSnapshot;
}

export interface ExtensionRenderStateContextBase extends ExtensionRenderStateContextCommonBase {
	readonly invalidation: ExtensionReadonlyInvalidationState;
	readonly animation: ExtensionAnimationController;
}

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
	onMount(env: ExtensionInstanceMountOptions<TSlots>): void;
	onDestroy(): void;
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

export interface ExtensionRecordInternalRender {
	readonly slots: ExtensionAllocatedSlotsInternal;
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationControllerInternalSurface;
}

export interface ExtensionRecordInternalDraft {
	readonly id: string;
	readonly definition: AnyExtensionDefinition;
	readonly instance: AnyExtensionInstance;
	readonly data: ExtensionStoredData;
}

export interface ExtensionRecordInternal extends ExtensionRecordInternalDraft {
	readonly render: ExtensionRecordInternalRender;
}

export interface ExtensionSystemInitOptions {
	extensions: [MainRendererExtensionDefinition, ...AnyExtensionDefinition[]];
}

export interface ExtensionSystemInternal {
	draftExtensions: Map<string, ExtensionRecordInternalDraft> | null;
	readonly extensions: Map<string, ExtensionRecordInternal>;
	extensionsFinalized: boolean;
	lastRenderedState: ExtensionRenderStateContextCommonBase | null;
}

export interface ExtensionSystemUpdateRequest {
	readonly state: RenderStateFrameSnapshot;
	readonly mutation: BoardRuntimeReadonlyMutationSession;
}

export interface ExtensionSystem {
	readonly draftExtensions: ReadonlyMap<string, ExtensionRecordInternalDraft> | null;
	readonly extensions: ReadonlyMap<string, ExtensionRecordInternal>;
	updateState(request: ExtensionSystemUpdateRequest): void;
	setFinalExtensions(extensions: ReadonlyMap<string, ExtensionRecordInternal>): void;
	setLastRenderedState(context: ExtensionRenderStateContextCommonBase): void;
}
