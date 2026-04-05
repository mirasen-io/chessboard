import { RenderGeometry } from '../../../layout/geometry/types';
import { BoardStateSnapshot } from '../../../state/board/types';
import { InteractionStateSnapshot } from '../../../state/interaction/types';
import { VisualsStateSnapshot } from '../../../state/visuals/types';

export interface SvgRendererDragInternals {
	readonly root: SVGGElement;
	readonly defsRoot: SVGGElement;
}

export interface DragRenderContext {
	readonly interaction: InteractionStateSnapshot;
	readonly visuals: VisualsStateSnapshot;
	readonly board: BoardStateSnapshot;
	readonly geometry: RenderGeometry;
}

export interface SvgRendererDrag {
	readonly root: SVGGElement;
	readonly defsRoot: SVGGElement;
	render(context: DragRenderContext): void;
}
