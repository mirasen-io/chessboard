import { describe, expect, it, vi } from 'vitest';
import { createLayout } from '../../../src/layout/factory.js';
import { createMutationSession } from '../../../src/mutation/session.js';
import { extensionSystemUpdatePipe } from '../../../src/runtime/mutation/extension-update.js';
import type { RuntimeMutationPayloadByCause } from '../../../src/runtime/mutation/types.js';
import { createRuntimeState } from '../../../src/state/factory.js';
import {
	createMockExtensionSystem,
	createMockRenderSystem
} from '../../test-utils/runtime/mutation.js';

function createSession() {
	return createMutationSession<RuntimeMutationPayloadByCause>();
}

describe('extensionSystemUpdatePipe', () => {
	it('calls extensionSystem.onUpdate when state. prefix mutations present', () => {
		const extensionSystem = createMockExtensionSystem();
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		extensionSystemUpdatePipe(context, session);

		expect(extensionSystem.onUpdate).toHaveBeenCalledOnce();
	});

	it('calls extensionSystem.onUpdate when layout. prefix mutations present', () => {
		const extensionSystem = createMockExtensionSystem();
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('layout.refreshGeometry', true);

		extensionSystemUpdatePipe(context, session);

		expect(extensionSystem.onUpdate).toHaveBeenCalledOnce();
	});

	it('does not call extensionSystem.onUpdate when no state./layout. mutations', () => {
		const extensionSystem = createMockExtensionSystem();
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('runtime.interaction.completeCoreDragTo', true, {
			owner: 'core' as const,
			type: 'lifted-piece-drag' as const,
			sourceSquare: 0 as const,
			sourcePieceCode: 1 as const,
			targetSquare: 8 as const
		});

		extensionSystemUpdatePipe(context, session);

		expect(extensionSystem.onUpdate).not.toHaveBeenCalled();
	});

	it('passes isMounted: false without layout when unmounted', () => {
		const extensionSystem = createMockExtensionSystem();
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		extensionSystemUpdatePipe(context, session);

		const call = (extensionSystem.onUpdate as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.state.isMounted).toBe(false);
		expect(call.state).not.toHaveProperty('layout');
	});

	it('passes isMounted: true with layout snapshot when mounted', () => {
		const extensionSystem = createMockExtensionSystem();
		const renderSystem = createMockRenderSystem({ isMounted: true });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		extensionSystemUpdatePipe(context, session);

		const call = (extensionSystem.onUpdate as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.state.isMounted).toBe(true);
		expect(call.state).toHaveProperty('layout');
	});

	it('calls requestRenderAnimation when hasSubmittedAnimations is true after onUpdate', () => {
		const extensionSystem = createMockExtensionSystem({ hasSubmittedAnimations: true });
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		extensionSystemUpdatePipe(context, session);

		expect(renderSystem.requestRenderAnimation).toHaveBeenCalledOnce();
	});

	it('does not call requestRenderAnimation when no submitted animations', () => {
		const extensionSystem = createMockExtensionSystem({ hasSubmittedAnimations: false });
		const renderSystem = createMockRenderSystem({ isMounted: false });
		const state = createRuntimeState({});
		const layout = createLayout();
		const context = {
			previous: null,
			current: { state, layout, renderSystem, extensionSystem }
		};
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		extensionSystemUpdatePipe(context, session);

		expect(renderSystem.requestRenderAnimation).not.toHaveBeenCalled();
	});
});
