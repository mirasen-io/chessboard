import { describe, expect, it } from 'vitest';
import { createMainRenderer } from '../../../../../src/extensions/first-party/main-renderer/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import {
	createAnimationCleanContext,
	createAnimationPrepareContext,
	createAnimationRenderContext
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';
import {
	createDragTransientVisualsContext,
	createDragUpdateContext
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import {
	createMainRendererRuntimeSurface,
	createOnAnimationFinishedContext,
	mountMainRenderer
} from '../../../../test-utils/extensions/first-party/main-renderer/factory.js';
import { createPiecesRenderContext } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';
import { createMockExtensionCreateInstanceOptions } from '../../../../test-utils/extensions/factory.js';

function createInstance() {
	const { surface } = createMainRendererRuntimeSurface();
	const def = createMainRenderer();
	return def.createInstance(createMockExtensionCreateInstanceOptions({ runtimeSurface: surface }));
}

describe('main-renderer – mount guards: before mount', () => {
	it('render throws before mount', () => {
		const instance = createInstance();
		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });

		expect(() => instance.render!(ctx)).toThrow('Extension instance is not mounted yet');
	});

	it('renderTransientVisuals throws before mount', () => {
		const instance = createInstance();
		const ctx = createDragTransientVisualsContext();

		expect(() => instance.renderTransientVisuals!(ctx)).toThrow(
			'Extension instance is not mounted yet'
		);
	});

	it('prepareAnimation throws before mount', () => {
		const instance = createInstance();
		const ctx = createAnimationPrepareContext({ submittedSessions: [] });

		expect(() => instance.prepareAnimation!(ctx)).toThrow('Extension instance is not mounted yet');
	});

	it('renderAnimation throws before mount', () => {
		const instance = createInstance();
		const ctx = createAnimationRenderContext({ activeSessions: [] });

		expect(() => instance.renderAnimation!(ctx)).toThrow('Extension instance is not mounted yet');
	});

	it('onUpdate does not throw before mount', () => {
		const instance = createInstance();
		const ctx = createDragUpdateContext({ dragSession: null });

		expect(() => instance.onUpdate!(ctx)).not.toThrow();
	});

	it('cleanAnimation does not throw before mount', () => {
		const instance = createInstance();
		const { context } = createAnimationCleanContext({ finishedSessions: [] });

		expect(() => instance.cleanAnimation!(context)).not.toThrow();
	});

	it('onAnimationFinished does not throw before mount', () => {
		const instance = createInstance();
		const ctx = createOnAnimationFinishedContext();

		expect(() => instance.onAnimationFinished!(ctx)).not.toThrow();
	});
});

describe('main-renderer – mount guards: after mount', () => {
	it('render does not throw after mount', () => {
		const instance = createInstance();
		mountMainRenderer(instance);
		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });

		expect(() => instance.render!(ctx)).not.toThrow();
	});
});

describe('main-renderer – mount guards: after unmount', () => {
	it('render throws after unmount', () => {
		const instance = createInstance();
		mountMainRenderer(instance);
		instance.unmount!();

		const ctx = createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board });
		expect(() => instance.render!(ctx)).toThrow('Extension instance is not mounted yet');
	});

	it('renderTransientVisuals throws after unmount', () => {
		const instance = createInstance();
		mountMainRenderer(instance);
		instance.unmount!();

		const ctx = createDragTransientVisualsContext();
		expect(() => instance.renderTransientVisuals!(ctx)).toThrow(
			'Extension instance is not mounted yet'
		);
	});
});
