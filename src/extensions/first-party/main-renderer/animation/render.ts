import { collectSuppressedSquares } from '../../../../animation/planner';
import {
	cleanAnimationPlan,
	prepareAnimationPlan,
	renderAnimationPlan
} from '../../../../animation/render/plan';
import type { Square } from '../../../../state/board/types/internal';
import type {
	ExtensionCleanAnimationContext,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext
} from '../../../types/context/animation';
import type { MainRendererAnimationInternal } from './types';

const EMPTY_SQUARES: ReadonlySet<Square> = new Set();

export function rendererAnimationPrepare(
	state: MainRendererAnimationInternal,
	context: ExtensionPrepareAnimationContext,
	layer: SVGElement
): void {
	for (const session of context.submittedSessions) {
		const entry = state.entries.get(session.id);
		if (entry && entry.nodes === null) {
			entry.nodes = prepareAnimationPlan(
				entry.plan,
				context.currentFrame.layout.geometry,
				state.config,
				layer
			);
		}
	}
}

export function rendererAnimationRender(
	state: MainRendererAnimationInternal,
	context: ExtensionRenderAnimationContext
): void {
	for (const session of context.activeSessions) {
		const entry = state.entries.get(session.id);
		if (entry && entry.nodes !== null) {
			renderAnimationPlan(entry.nodes, context.currentFrame.layout.geometry, session.progress);
		}
	}
}

export function rendererAnimationClean(
	state: MainRendererAnimationInternal,
	context: ExtensionCleanAnimationContext
): void {
	for (const session of context.finishedSessions) {
		const entry = state.entries.get(session.id);
		if (entry) {
			if (entry.nodes !== null) {
				cleanAnimationPlan(entry.nodes);
			}
			state.entries.delete(session.id);
		}
	}
}

export function getAnimationSuppressedSquares(
	state: MainRendererAnimationInternal
): ReadonlySet<Square> {
	// get submitted and active animation sessions
	const sessions = state.runtimeSurface.animation.getAll(['submitted', 'active']);
	if (sessions.length === 0) return EMPTY_SQUARES;
	const result = new Set<Square>();
	for (const session of sessions) {
		const entry = state.entries.get(session.id);
		if (!entry) continue;
		for (const sq of collectSuppressedSquares(entry.plan.tracks)) {
			result.add(sq);
		}
	}
	return result;
}
