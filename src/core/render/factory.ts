import { ExtensionRecordInternal } from '../extensions/types';
import { mergeReadonlySessions } from '../mutation/session';
import { createExtensionAnimationController } from './animation/factory';
import { createExtensionInvalidationState } from './invalidation/factory';
import { performAnimationPass } from './rendering/animation';
import { performRenderStatePass } from './rendering/state';
import { createScheduler } from './scheduler/scheduler';
import { allocateExtensionSlotRoots, createSvgRoots } from './svg/factory';
import {
	Render,
	RenderAnimationRequest,
	RenderInitOptions,
	RenderInitOptionsInternal,
	RenderInternal,
	RenderStateRequest,
	RenderVisualsRequest
} from './types';

function createRenderInternal(options: RenderInitOptionsInternal): RenderInternal {
	const svgRoots = createSvgRoots(options);

	const scheduler = createScheduler({
		render: options.performRender
	});

	const extensions = new Map<string, ExtensionRecordInternal>();
	for (const extensionDraft of options.extensionsDraft.values()) {
		const extensionInternal: ExtensionRecordInternal = {
			...extensionDraft,
			render: {
				slots: allocateExtensionSlotRoots(svgRoots, extensionDraft.definition.slots),
				invalidation: createExtensionInvalidationState(),
				animation: createExtensionAnimationController()
			}
		};
		extensions.set(extensionDraft.id, extensionInternal);
	}

	return {
		lastRendered: null,
		svgRoots,
		scheduler,
		extensions,
		callbacks: options.callbacks
	};
}

interface PerformRenderOptions {
	stateRequest: RenderStateRequest | null;
	animationRequest: RenderAnimationRequest | null;
	requestNextRenderAnimation: (request: RenderAnimationRequest | null) => void;
	visualsRequest: RenderVisualsRequest | null;
}

function performRender(state: RenderInternal, options: PerformRenderOptions) {
	// First we check and run renderState,
	if (options.stateRequest) {
		performRenderStatePass(state, options.stateRequest);
		if (!state.lastRendered) {
			throw new Error('After renderState, lastRendered context should be set');
		}
		state.callbacks.renderedState(options.stateRequest, state.lastRendered);
	}

	// Then we check and run renderAnimation,
	if (options.animationRequest) {
		const nextRequest = performAnimationPass(state, options.animationRequest);
		options.requestNextRenderAnimation(nextRequest);
	}

	// Finally we run renderVisuals.
	if (options.visualsRequest) {
		renderVisuals(state, options.visualsRequest);
		state.callbacks.renderedVisuals(options.visualsRequest);
	}
}

export function createRender(options: RenderInitOptions): Render {
	let pendingStateRequest: RenderStateRequest | null = null;
	let pendingAnimationRequest: RenderAnimationRequest | null = null;
	let pendingVisualsRequest: RenderVisualsRequest | null = null;

	function performRenderClosure() {
		const stateRequest = pendingStateRequest;
		pendingStateRequest = null;
		const animationRequest = pendingAnimationRequest;
		pendingAnimationRequest = null;
		const visualsRequest = pendingVisualsRequest;
		pendingVisualsRequest = null;
		performRender(internalState, {
			stateRequest: stateRequest,
			animationRequest: animationRequest,
			requestNextRenderAnimation: (request) => {
				if (request) {
					pendingAnimationRequest = request;
					internalState.scheduler.schedule();
				}
			},
			visualsRequest: visualsRequest
		});
	}

	const internalState = createRenderInternal({
		...options,
		performRender: performRenderClosure
	});

	return {
		extensions: internalState.extensions,
		requestRenderState(request) {
			pendingStateRequest = {
				...request,
				mutation: pendingStateRequest?.mutation
					? mergeReadonlySessions(pendingStateRequest.mutation, request.mutation)
					: request.mutation
			};
			internalState.scheduler.schedule();
		},
		requestRenderAnimation(request) {
			pendingAnimationRequest = request;
			internalState.scheduler.schedule();
		},
		requestRenderVisuals(request) {
			pendingVisualsRequest = {
				...request,
				mutation: pendingVisualsRequest?.mutation
					? mergeReadonlySessions(pendingVisualsRequest.mutation, request.mutation)
					: request.mutation
			};
			internalState.scheduler.schedule();
		}
	};
}
