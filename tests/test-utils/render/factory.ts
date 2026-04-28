import { vi } from 'vitest';
import type { ExtensionInvalidationState } from '../../../src/extensions/invalidation/types.js';
import type { ExtensionSlotName } from '../../../src/extensions/types/basic/mount.js';
import type { RenderFrameSnapshot } from '../../../src/extensions/types/basic/render.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type {
	ExtensionSystemExtensionRecord,
	ExtensionSystemSharedDataForRenderSystem
} from '../../../src/extensions/types/main.js';
import type { SceneRenderGeometry, SizeSnapshot } from '../../../src/layout/geometry/types.js';
import { allocateExtensionSlotRoots, createSvgRoots } from '../../../src/render/svg/factory.js';
import type {
	RenderExtensionRecord,
	RenderSystemInitOptions,
	RenderSystemInternal,
	SvgRoots
} from '../../../src/render/types.js';
import type { RuntimeStateSnapshot } from '../../../src/state/types.js';

export interface FakeExtensionOptions {
	id: string;
	slots?: readonly ExtensionSlotName[];
}

function createFakeInvalidation(): ExtensionInvalidationState {
	return {
		dirtyLayers: 0,
		markDirty: vi.fn(),
		clearDirty: vi.fn(),
		clear: vi.fn()
	};
}

function createFakeAnimationController() {
	return {
		sessions: new Map()
	};
}

export function createFakeExtensionRecord(
	opts: FakeExtensionOptions
): ExtensionSystemExtensionRecord {
	const instance: AnyExtensionInstance = {
		id: opts.id,
		mount: vi.fn(),
		unmount: vi.fn(),
		destroy: vi.fn(),
		onUpdate: vi.fn(),
		render: vi.fn()
	} as unknown as AnyExtensionInstance;

	const definition: AnyExtensionDefinition = {
		id: opts.id,
		slots: opts.slots ?? [],
		createInstance: vi.fn(() => instance)
	};

	return {
		id: opts.id,
		definition,
		instance,
		invalidation: createFakeInvalidation(),
		animation:
			createFakeAnimationController() as unknown as ExtensionSystemExtensionRecord['animation']
	};
}

export interface FakeSharedDataOptions {
	extensions?: FakeExtensionOptions[];
	transientVisualsSubscribers?: string[];
}

export function createFakeSharedData(
	opts: FakeSharedDataOptions = {}
): ExtensionSystemSharedDataForRenderSystem {
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	for (const extOpts of opts.extensions ?? []) {
		extensions.set(extOpts.id, createFakeExtensionRecord(extOpts));
	}
	return {
		extensions,
		transientVisualsSubscribers: new Set(opts.transientVisualsSubscribers ?? [])
	};
}

export function createMinimalRenderSystemOptions(
	opts: FakeSharedDataOptions = {}
): RenderSystemInitOptions {
	return {
		doc: document,
		sharedDataFromExtensionSystem: createFakeSharedData(opts)
	};
}

// --- Helpers for state render pass tests ---

export interface FakeRenderFrameOptions {
	sceneWidth?: number;
	sceneHeight?: number;
}

export function createFakeRenderFrame(opts: FakeRenderFrameOptions = {}): RenderFrameSnapshot {
	const width = opts.sceneWidth ?? 400;
	const height = opts.sceneHeight ?? 400;
	const sceneSize: SizeSnapshot = { width, height };
	const geometry: SceneRenderGeometry = {
		sceneSize,
		boardRect: { x: 0, y: 0, width, height },
		squareSize: width / 8,
		orientation: 0,
		getSquareRect: () => ({ x: 0, y: 0, width: width / 8, height: height / 8 })
	};
	return {
		state: {} as RuntimeStateSnapshot,
		layout: {
			sceneSize: { width, height },
			orientation: 0,
			geometry,
			layoutEpoch: 1
		}
	};
}

export interface FakeRenderInternalOptions {
	extensions?: FakeExtensionOptions[];
	mounted?: boolean;
}

export function createFakeRenderInternal(
	opts: FakeRenderInternalOptions = {}
): RenderSystemInternal {
	const svgRoots: SvgRoots = createSvgRoots({
		doc: document,
		sharedDataFromExtensionSystem: {
			extensions: new Map(),
			transientVisualsSubscribers: new Set()
		},
		performRender: () => {}
	});

	const extensions = new Map<string, RenderExtensionRecord>();
	for (const extOpts of opts.extensions ?? []) {
		const record = createFakeExtensionRecord(extOpts);
		extensions.set(record.id, {
			id: record.id,
			extension: record,
			render: {
				slots: allocateExtensionSlotRoots(svgRoots, record.id, record.definition.slots)
			}
		});
	}

	const state: RenderSystemInternal = {
		container: opts.mounted !== false ? document.createElement('div') : null,
		currentFrame: null,
		svgRoots,
		scheduler: { schedule: vi.fn(), flushNow: vi.fn(), cancel: vi.fn() },
		extensions,
		transientVisualsSubscribers: new Set()
	};

	return state;
}
