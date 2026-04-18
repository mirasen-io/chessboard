import { SceneEvent } from './basic/events';
import { ExtensionInstanceMountOptions, ExtensionSlotName } from './basic/mount';
import {
	ExtensionAnimationFinishedContext,
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from './context/animation';
import { ExtensionRenderContext } from './context/render';
import { ExtensionRenderTransientVisualsContext } from './context/transient-visuals';
import { ExtensionUIMoveRequestContext } from './context/ui-move';
import { ExtensionUpdateContext } from './context/update';
import { ExtensionRuntimeSurface } from './surface/main';

interface ExtensionInstanceBase<TId extends string, TSlots extends readonly ExtensionSlotName[]> {
	readonly id: TId;
	// Lifecycle
	mount(env: ExtensionInstanceMountOptions<TSlots>): void;
	unmount(): void;
	destroy(): void;
	// Render state cycle
	onUpdate(context: ExtensionUpdateContext): void;
	onUIMoveRequest?(context: ExtensionUIMoveRequestContext): void;
	render?(context: ExtensionRenderContext): void;
	// Animation
	prepareAnimation?(context: ExtensionPrepareAnimationContext): void;
	renderAnimation?(context: ExtensionRenderAnimationContext): void;
	onAnimationFinished?(context: ExtensionAnimationFinishedContext): void;
	cleanAnimation?(context: ExtensionCleanAnimationContext): void;
	// Transient Visuals
	renderTransientVisuals?(context: ExtensionRenderTransientVisualsContext): void;
	// Events
	onEvent?(event: SceneEvent): void;
}

type ExtensionInstancePublicPart<TPublic> = [TPublic] extends [never]
	? Record<never, never>
	: {
			getPublic(): TPublic;
		};

export type ExtensionInstance<
	TId extends string,
	TSlots extends readonly ExtensionSlotName[],
	TPublic = never
> = ExtensionInstanceBase<TId, TSlots> & ExtensionInstancePublicPart<TPublic>;

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

export type ExtensionDefinitionId<T> =
	T extends ExtensionDefinition<infer TId, readonly ExtensionSlotName[], unknown> ? TId : never;

export type ExtensionDefinitionPublicApi<T> =
	T extends ExtensionDefinition<string, readonly ExtensionSlotName[], infer TPublicApi>
		? TPublicApi
		: never;
