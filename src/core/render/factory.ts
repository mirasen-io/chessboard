import { RenderStateFrameSnapshot } from '../extensions/types';
import { VisualsStateSnapshot } from '../state/visuals/types';
import { renderMount, renderUnmount } from './mount';
import { performAnimationPass } from './rendering/animation';
import { validateIsMounted } from './rendering/helpers';
import { performRenderStatePass } from './rendering/state';
import { performRenderVisualsPass } from './rendering/visuals';
import { createScheduler } from './scheduler/scheduler';
import { allocateExtensionSlotRoots, createSvgRoots } from './svg/factory';
import {
	Render,
	RenderExtensionRecord,
	RenderInitOptions,
	RenderInitOptionsInternal,
	RenderInternal
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
	stateRequest: RenderStateFrameSnapshot | null;
	animationRequest: true | null;
	requestNextRenderAnimation: () => void;
	visualsRequest: VisualsStateSnapshot | null;
}

function performRender(state: RenderInternal, options: PerformRenderOptions) {
	// First we check and run renderState,
	if (options.stateRequest) {
		performRenderStatePass(state, options.stateRequest);
	}

	// Then we check and run renderAnimation,
	if (options.animationRequest) {
		const nextRequest = performAnimationPass(state);
		if (nextRequest) {
			options.requestNextRenderAnimation();
		}
	}

	// Finally we run renderVisuals.
	if (options.visualsRequest) {
		performRenderVisualsPass(state, options.visualsRequest);
	}
}

export function createRender(options: RenderInitOptions): Render {
	let pendingStateRequest: RenderStateFrameSnapshot | null = null;
	let pendingAnimationRequest: true | null = null;
	let pendingVisualsRequest: VisualsStateSnapshot | null = null;

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
			requestNextRenderAnimation: () => {
				if (animationRequest) {
					pendingAnimationRequest = true;
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
				...request
			};
			internalState.scheduler.schedule();
		},
		requestRenderAnimation() {
			validateIsMounted(internalState);
			pendingAnimationRequest = true;
			internalState.scheduler.schedule();
		},
		requestRenderVisuals(request) {
			validateIsMounted(internalState);
			pendingVisualsRequest = {
				...request
			};
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
