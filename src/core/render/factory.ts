import { createExtensionAnimationController } from './animation/factory';
import { createExtensionInvalidationState } from './invalidation/factory';
import { renderState } from './rendering/state';
import { createScheduler } from './scheduler/scheduler';
import { allocateExtensionSlotRoots, createSvgRoots } from './svg/factory';
import {
	Render,
	RenderExtensionInternal,
	RenderInitOpptionsInternal,
	RenderInitOptions,
	RenderInternal,
	RenderStateRequest
} from './types';

function createRenderInternal(options: RenderInitOpptionsInternal): RenderInternal {
	const svgRoots = createSvgRoots(options);

	const scheduler = createScheduler({
		render: options.performRenderState
	});

	const extensions = new Map<string, RenderExtensionInternal>();
	for (const extensionDefinition of options.extensions) {
		if (extensions.has(extensionDefinition.id)) {
			throw new Error(
				`Duplicate extension id detected during render initialization: ${extensionDefinition.id}`
			);
		}
		const extensionInternal: RenderExtensionInternal = {
			instance: extensionDefinition.createInstance(),
			slots: allocateExtensionSlotRoots(svgRoots, extensionDefinition.slots),
			invalidation: createExtensionInvalidationState(),
			animation: createExtensionAnimationController(),
			data: {
				previous: undefined,
				current: null
			}
		};
		extensions.set(extensionDefinition.id, extensionInternal);
	}

	return {
		svgRoots,
		scheduler,
		previouslyRendered: null,
		extensions
	};
}

export function createRender(options: RenderInitOptions): Render {
	let pendingRequest: RenderStateRequest | null = null;

	function performRender() {
		const request = pendingRequest;
		pendingRequest = null;
		renderState(internalState!, request);
	}

	const internalState = createRenderInternal({
		...options,
		performRenderState: performRender
		// performRenderAnimation,
		// performRenderVisuals
	});

	return {};
}
