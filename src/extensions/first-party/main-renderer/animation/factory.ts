import { cleanAnimationPlan } from '../../../../animation/render/plan.js';
import type { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import type { PieceSymbolResolver } from '../piece-symbols.js';
import type { MainRendererConfigAnimation } from '../types/template.js';
import {
	getAnimationSuppressedSquares,
	rendererAnimationClean,
	rendererAnimationPrepare,
	rendererAnimationRender
} from './render.js';
import type { MainRendererAnimation, MainRendererAnimationInternal } from './types.js';
import { rendererAnimationOnUpdate } from './update.js';

export function createMainRendererAnimation(
	runtimeSurface: ExtensionRuntimeSurface,
	resolver: PieceSymbolResolver,
	getAnimationConfig: () => MainRendererConfigAnimation
): MainRendererAnimation {
	const state: MainRendererAnimationInternal = {
		runtimeSurface,
		resolver,
		entries: new Map(),
		getAnimationConfig
	};
	return {
		onUpdate(context) {
			rendererAnimationOnUpdate(state, context);
		},
		prepareAnimation(context, slot) {
			rendererAnimationPrepare(state, context, slot);
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
