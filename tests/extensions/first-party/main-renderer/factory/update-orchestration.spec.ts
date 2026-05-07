import { describe, expect, it } from 'vitest';
import { createMainRenderer } from '../../../../../src/extensions/first-party/main-renderer/factory.js';
import { PieceCode, SQUARE_COUNT } from '../../../../../src/state/board/types/internal.js';
import { createAnimationUpdateContext } from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';
import {
	createDragUpdateContext,
	createLiftedPieceDragSession
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import {
	createMainRendererRuntimeSurface,
	createOnAnimationFinishedContext,
	mountMainRenderer
} from '../../../../test-utils/extensions/first-party/main-renderer/factory.js';
import { createMockExtensionCreateInstanceOptions } from '../../../../test-utils/extensions/factory.js';

function createMountedInstance() {
	const mocks = createMainRendererRuntimeSurface();
	const def = createMainRenderer();
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: mocks.surface })
	);
	mountMainRenderer(instance);
	return { instance, ...mocks };
}

describe('main-renderer update orchestration – animation', () => {
	it('onUpdate with piece move triggers animation.submit', () => {
		const { instance, submit } = createMountedInstance();

		const board1 = new Uint8Array(SQUARE_COUNT);
		board1[12] = PieceCode.WhitePawn;
		const board2 = new Uint8Array(SQUARE_COUNT);
		board2[28] = PieceCode.WhitePawn;

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: { pieces: board1, turn: 0, positionEpoch: 0 },
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: { pieces: board2, turn: 0, positionEpoch: 0 },
				change: {
					lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn },
					deferredUIMoveRequest: null
				}
			}
		});

		instance.onUpdate!(ctx);

		expect(submit).toHaveBeenCalledTimes(1);
		expect(submit).toHaveBeenCalledWith({ duration: 180 });
	});

	it('onUpdate without board change does not trigger animation.submit', () => {
		const { instance, submit } = createMountedInstance();

		const ctx = createAnimationUpdateContext({
			causes: ['state.view.setAutoPromote'],
			previousState: {}
		});

		instance.onUpdate!(ctx);

		expect(submit).not.toHaveBeenCalled();
	});
});

describe('main-renderer update orchestration – drag', () => {
	it('onUpdate with lifted-piece drag subscribes to transient visuals', () => {
		const { instance, subscribe } = createMountedInstance();

		const ctx = createDragUpdateContext({
			dragSession: createLiftedPieceDragSession()
		});

		instance.onUpdate!(ctx);

		expect(subscribe).toHaveBeenCalledTimes(1);
	});

	it('onUpdate without drag does not subscribe to transient visuals', () => {
		const { instance, subscribe } = createMountedInstance();

		const ctx = createDragUpdateContext({ dragSession: null });
		instance.onUpdate!(ctx);

		expect(subscribe).not.toHaveBeenCalled();
	});
});

describe('main-renderer update orchestration – onAnimationFinished', () => {
	it('onAnimationFinished does not throw with empty finished sessions', () => {
		const { instance } = createMountedInstance();
		const ctx = createOnAnimationFinishedContext();

		expect(() => instance.onAnimationFinished!(ctx)).not.toThrow();
	});
});
