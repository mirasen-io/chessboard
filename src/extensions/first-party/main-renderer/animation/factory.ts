import { cleanAnimationPlan } from '../../../../animation/render/plan.js';
import type { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import type { PieceUrls } from '../types/internal.js';
import {
	getAnimationSuppressedSquares,
	rendererAnimationClean,
	rendererAnimationPrepare,
	rendererAnimationRender
} from './render.js';
import type { MainRendererAnimation, MainRendererAnimationInternal } from './types.js';
import { rendererAnimationOnUpdate } from './update.js';

export function createMainRendererAnimation(
	config: PieceUrls,
	runtimeSurface: ExtensionRuntimeSurface
): MainRendererAnimation {
	const state: MainRendererAnimationInternal = {
		config,
		runtimeSurface,
		entries: new Map()
	};
	return {
		onUpdate(context) {
			rendererAnimationOnUpdate(state, context);
		},
		prepareAnimation(context, layer) {
			rendererAnimationPrepare(state, context, layer);
		},
		renderAnimation(context) {
			rendererAnimationRender(state, context);
		},
		cleanAnimation(context) {
			rendererAnimationClean(state, context);
		},
		getSuppressedSquares() {
			return getAnimationSuppressedSquares(state);
		},
		unmount() {
			for (const entry of state.entries.values()) {
				if (entry.nodes !== null) {
					cleanAnimationPlan(entry.nodes);
				}
			}
			state.entries.clear();
		}
	};
}
