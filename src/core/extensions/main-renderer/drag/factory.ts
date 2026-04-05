import { createSvgGroup } from '../helpers';
import { renderDrag } from './render';
import { SvgRendererDrag, SvgRendererDragInternals } from './types';

function createSvgRendererDragInternals(doc: Document): SvgRendererDragInternals {
	return {
		root: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-drag-root' }),
		defsRoot: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-drag-defs' })
	};
}

export function createSvgRendererDrag(doc: Document): SvgRendererDrag {
	const internalState = createSvgRendererDragInternals(doc);
	return {
		...internalState,
		render(context) {
			renderDrag(internalState, context);
		}
	};
}
