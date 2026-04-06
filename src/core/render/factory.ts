import { MAIN_RENDERER_EXTENSION_ID } from '../extensions/types';
import { createExtensionAnimationController } from './animation/factory';
import { createExtensionInvalidationState } from './invalidation/factory';
import { renderState } from './rendering/state';
import { createScheduler } from './scheduler/scheduler';
import { allocateExtensionSlotRoots, createSvgRoots } from './svg/factory';
import {
	Render,
	RenderExtension,
	RenderInitOptions,
	RenderInitOptionsInternal,
	RenderInternal,
	RenderStateRequest
} from './types';

function createRenderInternal(options: RenderInitOptionsInternal): RenderInternal {
	const svgRoots = createSvgRoots(options);

	const scheduler = createScheduler({
		render: options.performRender
	});

	// Check that the first extension is the main renderer
	if (options.extensions.length === 0 || options.extensions[0].id !== MAIN_RENDERER_EXTENSION_ID) {
		throw new Error(
			`The first extension must be the main renderer with id '${MAIN_RENDERER_EXTENSION_ID}'`
		);
	}

	const extensions = new Map<string, RenderExtension>();
	for (const extensionInstance of options.extensions) {
		if (extensions.has(extensionInstance.id)) {
			throw new Error(
				`Duplicate extension id detected during render initialization: ${extensionInstance.id}`
			);
		}
		const extensionInternal: RenderExtension = {
			instance: extensionInstance,
			slots: allocateExtensionSlotRoots(svgRoots, extensionInstance.slots),
			invalidation: createExtensionInvalidationState(),
			animation: createExtensionAnimationController(),
			data: {
				previous: undefined,
				current: null
			}
		};
		extensions.set(extensionInstance.id, extensionInternal);
	}

	return {
		svgRoots,
		scheduler,
		previouslyRendered: null,
		extensions
	};
}

interface PerformRenderOptions {
	stateRequest: RenderStateRequest | null;
}

function performRender(state: RenderInternal, options: PerformRenderOptions) {
	// First we check and run renderState,
	if (options.stateRequest) {
		renderState(state, options.stateRequest);
	}
	// Then we check and run renderAnimation,
	for (const extension of state.extensions.values()) {
		const animationController = extension.animation;
		const activeAnimations = animationController.getAll(['submitted', 'active']);
		if (activeAnimations.length > 0) {
			// Yes we have some active animations
			// TODO: renderAnimation(state)
		}
	}
	// Finally we run renderVisuals.
}

export function createRender(options: RenderInitOptions): Render {
	let pendingStateRequest: RenderStateRequest | null = null;

	function performRenderClosure() {
		const request = pendingStateRequest;
		pendingStateRequest = null;
		performRender(internalState, { stateRequest: request });
	}

	const internalState = createRenderInternal({
		...options,
		performRender: performRenderClosure
	});

	return {};
}
