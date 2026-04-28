import { vi } from 'vitest';
import type { ExtensionSystem } from '../../../src/extensions/types/main.js';
import { createLayout } from '../../../src/layout/factory.js';
import type { Layout } from '../../../src/layout/types.js';
import type { RenderExtensionRecord, RenderSystem } from '../../../src/render/types.js';
import type { RuntimeMutationPipeContext } from '../../../src/runtime/mutation/pipeline.js';
import { createRuntimeState } from '../../../src/state/factory.js';
import type { RuntimeState } from '../../../src/state/types.js';

/**
 * Creates a mock RenderSystem with only the fields needed by mutation pipes.
 */
export function createMockRenderSystem(
	overrides: {
		isMounted?: boolean;
		extensions?: Map<string, RenderExtensionRecord>;
	} = {}
): RenderSystem {
	const extensions = overrides.extensions ?? new Map();
	return {
		isMounted: overrides.isMounted ?? false,
		container: overrides.isMounted ? (document.createElement('div') as HTMLElement) : null,
		extensions,
		requestRender: vi.fn(),
		requestRenderAnimation: vi.fn(),
		requestRenderVisuals: vi.fn(),
		mount: vi.fn(),
		unmount: vi.fn()
	};
}

/**
 * Creates a mock ExtensionSystem with only the fields needed by mutation pipes.
 */
export function createMockExtensionSystem(
	overrides: {
		hasSubmittedAnimations?: boolean;
		currentFrame?: ExtensionSystem['currentFrame'];
	} = {}
): ExtensionSystem {
	return {
		get currentFrame() {
			return overrides.currentFrame ?? null;
		},
		get hasSubmittedAnimations() {
			return overrides.hasSubmittedAnimations ?? false;
		},
		getPublicRecord: vi.fn(() => ({})),
		getSharedDataForRenderSystem: vi.fn(() => ({
			extensions: new Map<string, never>(),
			transientVisualsSubscribers: new Set<string>()
		})),
		onUpdate: vi.fn(),
		onUIMoveRequest: vi.fn(),
		onEvent: vi.fn(),
		completeDrag: vi.fn(),
		onUnmount: vi.fn(),
		onDestroy: vi.fn()
	};
}

/**
 * Creates a RuntimeMutationPipeContext with real state/layout and mock render/extension systems.
 */
export function createMockPipeContext(
	overrides: {
		state?: RuntimeState;
		layout?: Layout;
		renderSystem?: RenderSystem;
		extensionSystem?: ExtensionSystem;
		previous?: RuntimeMutationPipeContext['previous'];
	} = {}
): RuntimeMutationPipeContext {
	return {
		previous: overrides.previous ?? null,
		current: {
			state: overrides.state ?? createRuntimeState({}),
			layout: overrides.layout ?? createLayout(),
			renderSystem: overrides.renderSystem ?? createMockRenderSystem(),
			extensionSystem: overrides.extensionSystem ?? createMockExtensionSystem()
		}
	};
}
