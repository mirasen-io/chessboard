import { describe, expect, it } from 'vitest';
import { createLayout } from '../../../src/layout/factory.js';
import { createRuntimeMutationPipeline } from '../../../src/runtime/mutation/factory.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import {
	type MoveSnapshot,
	type NonEmptyPieceCode,
	PieceCode
} from '../../../src/state/board/types/internal.js';
import { createRuntimeState } from '../../../src/state/factory.js';
import {
	createMockExtensionSystem,
	createMockRenderSystem
} from '../../test-utils/runtime/mutation.js';

function createPipelineContext() {
	const state = createRuntimeState({});
	const layout = createLayout();
	const renderSystem = createMockRenderSystem({ isMounted: false });
	const extensionSystem = createMockExtensionSystem();
	return { state, layout, renderSystem, extensionSystem };
}

function makeMoveSnapshot(): MoveSnapshot {
	return {
		from: normalizeSquare('e2'),
		to: normalizeSquare('e4'),
		piece: PieceCode.WhitePawn as NonEmptyPieceCode
	};
}

describe('createRuntimeMutationPipeline', () => {
	it('returns object with getSession, addMutation, run', () => {
		const pipeline = createRuntimeMutationPipeline();
		expect(pipeline.getSession).toBeTypeOf('function');
		expect(pipeline.addMutation).toBeTypeOf('function');
		expect(pipeline.run).toBeTypeOf('function');
	});

	it('run returns false when session has no mutations (no-op)', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();

		const result = pipeline.run(context);

		expect(result).toBe(false);
	});

	it('run returns true when session has mutations', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();
		pipeline.addMutation('state.board.setPosition', true);

		const result = pipeline.run(context);

		expect(result).toBe(true);
	});

	it('run clears the session after execution', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();
		pipeline.addMutation('state.board.setPosition', true);

		pipeline.run(context);

		expect(pipeline.getSession().hasMutation()).toBe(false);
	});

	it('second run without new mutations returns false (no-op)', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();
		pipeline.addMutation('state.board.setPosition', true);
		pipeline.run(context);

		const result = pipeline.run(context);

		expect(result).toBe(false);
	});

	it('updateLastMoveOnBoardMove sets lastMove after a move mutation', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();
		const move = makeMoveSnapshot();
		pipeline.addMutation('state.board.move', true, move);

		pipeline.run(context);

		expect(context.state.change.lastMove).toEqual(move);
	});

	it('clearLastMoveOnBoardSetPosition clears lastMove on setPosition', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();

		// First set a lastMove via a move
		const move = makeMoveSnapshot();
		pipeline.addMutation('state.board.move', true, move);
		pipeline.run(context);
		expect(context.state.change.lastMove).not.toBeNull();

		// Now setPosition should clear it
		pipeline.addMutation('state.board.setPosition', true);
		pipeline.run(context);

		expect(context.state.change.lastMove).toBeNull();
	});

	it('pipe ordering: clearLastMove runs after updateLastMove when both move and setPosition present', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();
		const move = makeMoveSnapshot();

		// Add both mutations in same session
		pipeline.addMutation('state.board.move', true, move);
		pipeline.addMutation('state.board.setPosition', true);

		pipeline.run(context);

		// clearLastMoveOnBoardSetPosition runs after updateLastMoveOnBoardMove,
		// so lastMove should be cleared (setPosition wins)
		expect(context.state.change.lastMove).toBeNull();
	});

	it('extensionSystem.onUpdate is called when state mutations present', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();
		pipeline.addMutation('state.board.setPosition', true);

		pipeline.run(context);

		expect(context.extensionSystem.onUpdate).toHaveBeenCalled();
	});

	it('extensionSystem.onUpdate is not called on no-op run', () => {
		const pipeline = createRuntimeMutationPipeline();
		const context = createPipelineContext();

		pipeline.run(context);

		expect(context.extensionSystem.onUpdate).not.toHaveBeenCalled();
	});
});
