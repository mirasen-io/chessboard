import { createSvgGroup } from '../helpers';
import { renderAnimations } from './render';
import { SvgRendererAnimation, SvgRendererAnimationInternals } from './types';

function createSvgRendererAnimationInternals(doc: Document): SvgRendererAnimationInternals {
	return {
		root: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-animation-root' }),
		defsRoot: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-animation-defs-root' }),
		activeSessionGroup: null
	};
}

export function createSvgRendererAnimation(doc: Document): SvgRendererAnimation {
	const internalState = createSvgRendererAnimationInternals(doc);
	return {
		...internalState,
		get activeSessionGroup() {
			return internalState.activeSessionGroup;
		},
		render(context) {
			renderAnimations(internalState, context);
		}
	};
}
