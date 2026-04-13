import { SceneEvent } from './basic/events';
import { ExtensionInstanceMountOptions, ExtensionSlotName } from './basic/mount';
import {
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from './context/animation';
import { ExtensionRenderContext } from './context/render';
import { ExtensionRenderTransientVisualsContext } from './context/transient-visuals';
import { ExtensionUpdateContext } from './context/update';
import { ExtensionRuntimeSurface } from './surface/main';

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
	onUpdate(context: ExtensionUpdateContext): void;
	render?(context: ExtensionRenderContext): void;
	// Animation
	prepareAnimation?(context: ExtensionPrepareAnimationContext): void;
	renderAnimation?(context: ExtensionRenderAnimationContext): void;
	cleanAnimation?(context: ExtensionCleanAnimationContext): void;
	// Transient Visuals
	renderTransientVisuals?(context: ExtensionRenderTransientVisualsContext): void;
	// Events
	onEvent?(event: SceneEvent): void;
	// Public API promoted to board.extensions.<extensionId>.API
	getPublic?(): TPublic;
}

export type AnyExtensionInstance = ExtensionInstance<string, readonly ExtensionSlotName[], unknown>;

export interface ExtensionCreateInstanceOptions {
	runtimeSurface: ExtensionRuntimeSurface;
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
