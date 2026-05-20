import { PreparedNodeMap } from '../../../../animation/render/types.js';
import { AnimationPlan } from '../../../../animation/types.js';
import { Square } from '../../../../state/board/types/internal.js';
import {
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from '../../../types/context/animation.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import type { PieceSymbolResolver } from '../piece-symbols.js';
import type { MainRendererConfig } from '../types/internal.js';

export interface MainRendererAnimationEntry {
	plan: AnimationPlan;
	nodes: PreparedNodeMap | null;
}

export interface MainRendererAnimationInternal {
	readonly runtimeSurface: ExtensionRuntimeSurface;
	readonly resolver: PieceSymbolResolver;
	readonly entries: Map<number, MainRendererAnimationEntry>;
	readonly getAnimationConfig: () => MainRendererConfig['animation'];
}

export interface MainRendererAnimation {
	onUpdate(context: ExtensionUpdateContext): void;
	prepareAnimation(context: ExtensionPrepareAnimationContext, slot: SVGGElement): void;
	renderAnimation(context: ExtensionRenderAnimationContext): void;
	cleanAnimation(context: ExtensionCleanAnimationContext): void;
	getSuppressedSquares(): ReadonlySet<Square>;
	unmount(): void;
}
