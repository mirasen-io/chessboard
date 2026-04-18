import { PreparedNodeMap } from '../../../../animation/render/types';
import { AnimationPlan } from '../../../../animation/types';
import { Square } from '../../../../state/board/types/internal';
import {
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from '../../../types/context/animation';
import { ExtensionUpdateContext } from '../../../types/context/update';
import { ExtensionRuntimeSurface } from '../../../types/surface/main';
import type { PieceUrls } from '../types/internal';

export interface MainRendererAnimationEntry {
	plan: AnimationPlan;
	nodes: PreparedNodeMap | null;
}

export interface MainRendererAnimationInternal {
	readonly config: PieceUrls;
	readonly runtimeSurface: ExtensionRuntimeSurface;
	readonly entries: Map<number, MainRendererAnimationEntry>;
}

export interface MainRendererAnimation {
	onUpdate(context: ExtensionUpdateContext): void;
	prepareAnimation(context: ExtensionPrepareAnimationContext, layer: SVGElement): void;
	renderAnimation(context: ExtensionRenderAnimationContext): void;
	cleanAnimation(context: ExtensionCleanAnimationContext): void;
	getSuppressedSquares(): ReadonlySet<Square>;
	unmount(): void;
}
