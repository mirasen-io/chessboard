import { RenderGeometry } from '../renderer/types';
import { InvalidationStateExtensionSnapshot, InvalidationWriter } from '../scheduler/types';
import { BoardStateSnapshot, Move } from '../state/boardTypes';
import { InteractionStateSnapshot } from '../state/interactionTypes';
import { ViewStateSnapshot } from '../state/viewTypes';

export type ExtensionSlotName = 'underPieces' | 'overPieces' | 'dragUnder' | 'dragOver';

export type ExtensionSlotRoots<TSlots extends ExtensionSlotName> = Record<TSlots, SVGGElement>;

export interface BoardExtensionMountEnvInternal {
	slotRoots: Partial<Record<ExtensionSlotName, SVGGElement>>;
}
export interface BoardExtensionMountEnv<TSlots extends ExtensionSlotName> {
	slotRoots: ExtensionSlotRoots<TSlots>;
}

export interface BoardExtensionUpdateContext {
	board: BoardStateSnapshot;
	view: ViewStateSnapshot;
	interaction: InteractionStateSnapshot;
	lastMove: Move | null;
	layoutVersion: number;
	layoutChanged: boolean;
	writer: InvalidationWriter;
}

export interface BoardExtensionRenderContext {
	board: BoardStateSnapshot;
	view: ViewStateSnapshot;
	interaction: InteractionStateSnapshot;
	geometry: RenderGeometry;
	invalidation: InvalidationStateExtensionSnapshot;
}

export interface BoardExtensionMounted<TPublic> {
	/**
	 * Returns the stable public handle for this mounted extension instance.
	 * Repeated calls must return the same object reference.
	 */
	getPublic(): TPublic;
	update(ctx: BoardExtensionUpdateContext): void;
	renderBoard(ctx: BoardExtensionRenderContext): void;
	unmount(): void;
}

export interface BoardExtensionDefinitionInternal {
	id: string;
	slots: readonly ExtensionSlotName[];
	mount(env: BoardExtensionMountEnvInternal): BoardExtensionMounted<unknown>;
}
export interface BoardExtensionDefinition<TPublic, TSlots extends ExtensionSlotName> {
	id: string;
	slots: readonly TSlots[];
	mount(env: BoardExtensionMountEnv<TSlots>): BoardExtensionMounted<TPublic>;
}
