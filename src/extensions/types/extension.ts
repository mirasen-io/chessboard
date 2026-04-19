import { SceneEvent } from './basic/events.js';
import { ExtensionInstanceMountOptions, ExtensionSlotName } from './basic/mount.js';
import {
	ExtensionAnimationFinishedContext,
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from './context/animation.js';
import { ExtensionRenderContext } from './context/render.js';
import { ExtensionRenderTransientVisualsContext } from './context/transient-visuals.js';
import { ExtensionUIMoveRequestContext } from './context/ui-move.js';
import { ExtensionUpdateContext } from './context/update.js';
import { ExtensionRuntimeSurface } from './surface/main.js';

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
