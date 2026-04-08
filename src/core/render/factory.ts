import { mergeReadonlySessions } from '../mutation/session';
import { renderMount, renderUnmount } from './mount';
import { performAnimationPass } from './rendering/animation';
import { validateIsMounted } from './rendering/helpers';
import { performRenderStatePass } from './rendering/state';
import { performRenderVisualsPass } from './rendering/visuals';
import { createScheduler } from './scheduler/scheduler';
import { allocateExtensionSlotRoots, createSvgRoots } from './svg/factory';
import {
	Render,
	RenderAnimationRequest,
	RenderExtensionRecord,
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

	const extensions = new Map<string, RenderExtensionRecord>();
	for (const extensionSystemExt of options.extensions.values()) {
		const extensionInternal: RenderExtensionRecord = {
			id: extensionSystemExt.id,
			extension: extensionSystemExt,
			render: {
				slots: allocateExtensionSlotRoots(
					svgRoots,
					extensionSystemExt.id,
					extensionSystemExt.definition.slots
				)
			}
		};
		extensions.set(extensionInternal.id, extensionInternal);
	}

	return {
		container: null,
		lastRendered: null,
		svgRoots,
		scheduler,
		extensions
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
	}

	// Then we check and run renderAnimation,
	if (options.animationRequest) {
		const nextRequest = performAnimationPass(state, options.animationRequest);
		options.requestNextRenderAnimation(nextRequest);
	}

	// Finally we run renderVisuals.
	if (options.visualsRequest) {
		performRenderVisualsPass(state, options.visualsRequest);
		if (!state.lastRendered) {
			throw new Error('After renderVisuals, lastRendered context should be set');
		}
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
			validateIsMounted(internalState);
			pendingStateRequest = {
				...request,
				mutation: pendingStateRequest?.mutation
					? mergeReadonlySessions([pendingStateRequest.mutation, request.mutation])
					: request.mutation
			};
			internalState.scheduler.schedule();
		},
		requestRenderAnimation(request) {
			validateIsMounted(internalState);
			pendingAnimationRequest = request;
			internalState.scheduler.schedule();
		},
		requestRenderVisuals(request) {
			validateIsMounted(internalState);
			pendingVisualsRequest = {
				...request,
				mutation: pendingVisualsRequest?.mutation
					? mergeReadonlySessions([pendingVisualsRequest.mutation, request.mutation])
					: request.mutation
			};
			internalState.scheduler.schedule();
		},
		mount(element) {
			renderMount(internalState, element);
		},
		unmount() {
			renderUnmount(internalState);
			pendingStateRequest = null;
			pendingAnimationRequest = null;
			pendingVisualsRequest = null;
		},
		get isMounted() {
			return internalState.container !== null;
		},
		get container() {
			return internalState.container;
		}
	};
}
