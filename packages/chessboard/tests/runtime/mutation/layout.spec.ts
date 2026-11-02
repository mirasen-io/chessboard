import { describe, expect, it, vi } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import { layoutRefreshGeometryPipe } from '../../../src/runtime/mutation/layout.js';
import type { RuntimeMutationPayloadByCause } from '../../../src/runtime/mutation/types.js';
import { createRuntimeState } from '../../../src/state/factory.js';
import {
	createMockExtensionSystem,
	createMockRenderSystem
} from '../../test-utils/runtime/mutation.js';

function createSession() {
	return createMutationSession<RuntimeMutationPayloadByCause>();
}

function createContextWithMockLayout() {
	const mockLayout = {
		sceneSize: null,
		orientation: 0,
		geometry: null,
		layoutEpoch: 0,
		refreshGeometry: vi.fn(() => false),
		getSnapshot: vi.fn(() => ({
			sceneSize: null,
			orientation: 0,
			geometry: null,
			layoutEpoch: 0
		}))
	};
	const state = createRuntimeState({ view: { orientation: 'black' } });
	return {
		context: {
			previous: null,
			current: {
				state,
				layout: mockLayout,
				renderSystem: createMockRenderSystem(),
				extensionSystem: createMockExtensionSystem()
			}
		},
		mockLayout
	};
}

describe('layoutRefreshGeometryPipe', () => {
	it('calls refreshGeometry when state.view.setOrientation mutation present', () => {
		const { context, mockLayout } = createContextWithMockLayout();
		const session = createSession();
		session.addMutation('state.view.setOrientation', true);

		layoutRefreshGeometryPipe(context, session);

		expect(mockLayout.refreshGeometry).toHaveBeenCalledOnce();
		expect(mockLayout.refreshGeometry).toHaveBeenCalledWith(
			{ orientation: context.current.state.view.orientation },
			session
		);
	});

	it('no-op when state.view.setOrientation mutation absent', () => {
		const { context, mockLayout } = createContextWithMockLayout();
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		layoutRefreshGeometryPipe(context, session);

		expect(mockLayout.refreshGeometry).not.toHaveBeenCalled();
	});
});
