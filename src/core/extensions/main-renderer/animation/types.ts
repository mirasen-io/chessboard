import { AnimationSessionSnapshot } from '../../../animation/types';
import { RenderGeometry } from '../../../layout/geometry/types';
import { BoardStateSnapshot } from '../../../state/board/types';

export interface SvgRendererAnimationInternals {
	readonly root: SVGGElement;
	readonly defsRoot: SVGGElement;
	activeSessionGroup: SVGGElement | null;
}

export interface AnimationRenderContext {
	readonly session: AnimationSessionSnapshot | null;
	readonly board: BoardStateSnapshot;
	readonly geometry: RenderGeometry;
}

export interface SvgRendererAnimation {
	readonly root: SVGGElement;
	readonly defsRoot: SVGGElement;
	readonly activeSessionGroup: SVGGElement | null;
	render(context: AnimationRenderContext): void;
}
