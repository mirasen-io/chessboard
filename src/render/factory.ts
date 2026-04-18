import { RenderFrameSnapshot } from '../extensions/types/basic/render';
import { TransientInput } from '../extensions/types/basic/transient-visuals';
import { renderMount, renderUnmount } from './mount';
import { performAnimationCleanup, performAnimationPass } from './rendering/animation';
import { validateIsMounted } from './rendering/helpers';
import { performRenderPass } from './rendering/state';
import { performRenderTransientVisualsPass } from './rendering/visuals';
import { createScheduler } from './scheduler/scheduler';
import { allocateExtensionSlotRoots, createSvgRoots } from './svg/factory';
import {
	RenderExtensionRecord,
	RenderSystem,
	RenderSystemInitOptions,
	RenderSystemInitOptionsInternal,
	RenderSystemInternal
} from './types';

function createRenderInternal(options: RenderSystemInitOptionsInternal): RenderSystemInternal {
	const svgRoots = createSvgRoots(options);

	const scheduler = createScheduler({
		render: options.performRender
	});

	const extensions = new Map<string, RenderExtensionRecord>();
	for (const extensionSystemExt of options.sharedDataFromExtensionSystem.extensions.values()) {
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
		currentFrame: null,
		svgRoots,
		scheduler,
		extensions,
		transientVisualsSubscribers: options.sharedDataFromExtensionSystem.transientVisualsSubscribers
	};
}

interface PerformRenderOptions {
	stateRequest: RenderFrameSnapshot | null;
	animationRequest: true | null;
	requestRenderAnimation: () => void;
	requestRender: () => void;
	visualsRequest: TransientInput | null;
}

function performRender(state: RenderSystemInternal, options: PerformRenderOptions) {
	// First we check and run renderPass, then deferred animation cleanup.
	if (options.stateRequest) {
		performRenderPass(state, options.stateRequest);
		performAnimationCleanup(state);
	}

	// Then we check and run renderAnimation,
	if (options.animationRequest) {
		const nextRequest = performAnimationPass(state);
		if (nextRequest.requestRenderAnimation) {
			options.requestRenderAnimation();
		}
		if (nextRequest.requestRender) {
			options.requestRender();
		}
	}

	// Finally we run renderVisuals.
	if (options.visualsRequest) {
		performRenderTransientVisualsPass(state, options.visualsRequest);
	}
}

export function createRenderSystem(options: RenderSystemInitOptions): RenderSystem {
	let pendingStateRequest: RenderFrameSnapshot | null = null;
	let pendingAnimationRequest: true | null = null;
	let pendingVisualsRequest: TransientInput | null = null;

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
			requestRenderAnimation: () => {
				pendingAnimationRequest = pendingAnimationRequest ?? true;
				internalState.scheduler.schedule();
			},
			requestRender: () => {
				pendingStateRequest = pendingStateRequest ?? internalState.currentFrame;
				internalState.scheduler.schedule();
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
		requestRender(request) {
			validateIsMounted(internalState);
			pendingStateRequest = request ?? internalState.currentFrame;
			internalState.scheduler.schedule();
		},
		requestRenderAnimation() {
			validateIsMounted(internalState);
			pendingAnimationRequest = true;
			internalState.scheduler.schedule();
		},
		requestRenderVisuals(request) {
			validateIsMounted(internalState);
			pendingVisualsRequest = request;
			internalState.scheduler.schedule();
		},
		mount(element) {
			renderMount(internalState, element);
		},
		unmount() {
			renderUnmount(internalState);
			internalState.scheduler.cancel();
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
