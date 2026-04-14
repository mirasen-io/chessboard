import type { PreparedNodeMap } from '../../../animation/render/types';
import type { AnimationPlan } from '../../../animation/types';
import type { Square } from '../../../state/board/types';
import type {
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from '../../types/context/animation';
import type { ExtensionUpdateContext } from '../../types/context/update';
import type { ExtensionRuntimeSurface } from '../../types/surface/main';
import type { PieceUrls } from '../types/config';

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
