import { describe, expect, it, vi } from 'vitest';
import type { ExtensionAnimationSessionInternalSurface } from '../../../src/extensions/types/basic/animation.js';
import { createLayout } from '../../../src/layout/factory.js';
import { createMutationSession } from '../../../src/mutation/session.js';
import type { RenderExtensionRecord } from '../../../src/render/types.js';
import { requestRenderPipe } from '../../../src/runtime/mutation/request-render.js';
import type { RuntimeMutationPayloadByCause } from '../../../src/runtime/mutation/types.js';
import { ColorCode } from '../../../src/state/board/types/internal.js';
import { createRuntimeState } from '../../../src/state/factory.js';
import {
	createMockExtensionSystem,
	createMockRenderSystem
} from '../../test-utils/runtime/mutation.js';

function createSession() {
	return createMutationSession<RuntimeMutationPayloadByCause>();
}

function createMockExtensionRecord(opts: {
	dirtyLayers?: number;
	animations?: readonly ExtensionAnimationSessionInternalSurface[];
}): RenderExtensionRecord {
	return {
		id: 'test-ext',
		extension: {
			id: 'test-ext',
			definition: {} as RenderExtensionRecord['extension']['definition'],
			instance: {} as RenderExtensionRecord['extension']['instance'],
			invalidation: {
				dirtyLayers: opts.dirtyLayers ?? 0,
				markDirty: vi.fn(),
				clearDirty: vi.fn(),
				clear: vi.fn()
			},
			animation: {
				submit: vi.fn(),
				cancel: vi.fn(),
				getAll: vi.fn(
					() => opts.animations ?? ([] as readonly ExtensionAnimationSessionInternalSurface[])
				),
				remove: vi.fn(),
				clear: vi.fn()
			}
		},
		render: {
			slots: {} as RenderExtensionRecord['render']['slots']
		}
	};
}

function createRenderableFrame() {
	return {
		isMounted: true as const,
		state: createRuntimeState({}).getSnapshot(),
		layout: {
			sceneSize: { width: 400, height: 400 },
			orientation: ColorCode.White,
			geometry: {
				sceneSize: { width: 400, height: 400 },
				orientation: ColorCode.White,
				boardRect: { x: 0, y: 0, width: 400, height: 400 },
				squareSize: 50,
				getSquareRect: vi.fn()
			},
			layoutEpoch: 1
		}
	};
}

describe('requestRenderPipe', () => {
	it('no-op when extensionSystem.currentFrame is null', () => {
		const extensionSystem = createMockExtensionSystem({ currentFrame: null });
		const renderSystem = createMockRenderSystem({ isMounted: true });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRender).not.toHaveBeenCalled();
		expect(renderSystem.requestRenderAnimation).not.toHaveBeenCalled();
	});

	it('no-op when frame is not mounted (isMounted: false)', () => {
		const frame = {
			isMounted: false as const,
			state: createRuntimeState({}).getSnapshot()
		};
		const extensionSystem = createMockExtensionSystem({ currentFrame: frame });
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRender).not.toHaveBeenCalled();
		expect(renderSystem.requestRenderAnimation).not.toHaveBeenCalled();
	});

	it('no-op when frame is mounted but geometry is null', () => {
		const frame = {
			isMounted: true as const,
			state: createRuntimeState({}).getSnapshot(),
			layout: {
				sceneSize: { width: 400, height: 400 },
				orientation: ColorCode.White,
				geometry: null,
				layoutEpoch: 0
			}
		};
		const extensionSystem = createMockExtensionSystem({ currentFrame: frame });
		const renderSystem = createMockRenderSystem({ isMounted: true });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRender).not.toHaveBeenCalled();
		expect(renderSystem.requestRenderAnimation).not.toHaveBeenCalled();
	});

	it('calls requestRender when an extension has dirtyLayers !== 0', () => {
		const frame = createRenderableFrame();
		const extensionSystem = createMockExtensionSystem({ currentFrame: frame });
		const extRecord = createMockExtensionRecord({ dirtyLayers: 1 });
		const extensions = new Map([['test-ext', extRecord]]);
		const renderSystem = createMockRenderSystem({ isMounted: true, extensions });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRender).toHaveBeenCalledOnce();
		expect(renderSystem.requestRender).toHaveBeenCalledWith(frame);
	});

	it('does not call requestRender when all extensions have dirtyLayers === 0', () => {
		const frame = createRenderableFrame();
		const extensionSystem = createMockExtensionSystem({ currentFrame: frame });
		const extRecord = createMockExtensionRecord({ dirtyLayers: 0 });
		const extensions = new Map([['test-ext', extRecord]]);
		const renderSystem = createMockRenderSystem({ isMounted: true, extensions });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRender).not.toHaveBeenCalled();
	});

	it('calls requestRenderAnimation when extensions have submitted/active animations', () => {
		const frame = createRenderableFrame();
		const extensionSystem = createMockExtensionSystem({ currentFrame: frame });
		const mockAnimation = {
			id: 1,
			startTime: 0,
			duration: 300,
			status: 'submitted' as const,
			elapsedTime: 0,
			progress: 0,
			pendingCleanup: false,
			setStatus: vi.fn(),
			markPendingCleanup: vi.fn()
		};
		const extRecord = createMockExtensionRecord({ animations: [mockAnimation] });
		const extensions = new Map([['test-ext', extRecord]]);
		const renderSystem = createMockRenderSystem({ isMounted: true, extensions });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRenderAnimation).toHaveBeenCalledOnce();
	});

	it('does not call requestRenderAnimation when no animations', () => {
		const frame = createRenderableFrame();
		const extensionSystem = createMockExtensionSystem({ currentFrame: frame });
		const extRecord = createMockExtensionRecord({ animations: [] });
		const extensions = new Map([['test-ext', extRecord]]);
		const renderSystem = createMockRenderSystem({ isMounted: true, extensions });
		const context = {
			previous: null,
			current: {
				state: createRuntimeState({}),
				layout: createLayout(),
				renderSystem,
				extensionSystem
			}
		};
		const session = createSession();

		requestRenderPipe(context, session);

		expect(renderSystem.requestRenderAnimation).not.toHaveBeenCalled();
	});
});
