import { describe, expect, it, vi } from 'vitest';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type { ExtensionRuntimeSurfaceCommands } from '../../../src/extensions/types/surface/commands.js';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import {
	createRuntimeInteractionSurface,
	notifyExtensionCancelDragIfOwned
} from '../../../src/runtime/factory/input.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, type Square } from '../../../src/state/board/types/internal.js';
import type { DragSessionExtensionOwned } from '../../../src/state/interaction/types/internal.js';
import { makeDragSessionCoreOwned } from '../../test-utils/state/interaction/fixtures.js';

let capturedCommands: ExtensionRuntimeSurfaceCommands | null = null;

function createDragCapableExtension(id: string): AnyExtensionDefinition {
	return {
		id,
		slots: [],
		createInstance(options) {
			capturedCommands = options.runtimeSurface.commands;
			return {
				id,
				completeDrag: vi.fn()
			} as unknown as AnyExtensionInstance;
		}
	};
}

function createExtensionWithoutCompleteDrag(id: string): AnyExtensionDefinition {
	return {
		id,
		slots: [],
		createInstance(options) {
			capturedCommands = options.runtimeSurface.commands;
			return {
				id
			} as unknown as AnyExtensionInstance;
		}
	};
}

function createTestRuntime(extDef?: AnyExtensionDefinition) {
	capturedCommands = null;
	const ext = extDef ?? createDragCapableExtension('test-ext');
	const runtime = createRuntime({ element: document.createElement('div'), extensions: [ext] });
	return { runtime, commands: capturedCommands! };
}

describe('runtime startDrag (extension-facing boundary)', () => {
	it('returns true when starting a valid drag session', () => {
		const { commands } = createTestRuntime();

		const result = commands.startDrag({
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4'),
			startButton: 0
		});

		expect(result).toBe(true);
	});

	it('snapshot reflects drag session with owner auto-populated', () => {
		const { runtime, commands } = createTestRuntime();

		commands.startDrag({
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4'),
			startButton: 0
		});

		const snapshot = runtime.getSnapshot();
		expect(snapshot.state.interaction.dragSession).not.toBeNull();
		expect(snapshot.state.interaction.dragSession!.owner).toBe('test-ext');
		expect(snapshot.state.interaction.dragSession!.type).toBe('lifted-piece-drag');
		expect(snapshot.state.interaction.dragSession!.sourceSquare).toBe(normalizeSquare('e2'));
		expect(snapshot.state.interaction.dragSession!.targetSquare).toBe(normalizeSquare('e4'));
	});

	it('throws when starting a drag while another session is active', () => {
		const { commands } = createTestRuntime();

		commands.startDrag({
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4'),
			startButton: 0
		});

		expect(() =>
			commands.startDrag({
				type: 'release-targeting',
				sourceSquare: normalizeSquare('d7'),
				sourcePieceCode: PieceCode.BlackPawn,
				targetSquare: normalizeSquare('d5'),
				startButton: 0
			})
		).toThrow(/Cannot set a new drag session/);
	});

	it('can start a new drag session after clearing the previous one', () => {
		const { runtime, commands } = createTestRuntime();

		commands.startDrag({
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4'),
			startButton: 0
		});

		runtime.clearActiveInteraction();

		const result = commands.startDrag({
			type: 'release-targeting',
			sourceSquare: normalizeSquare('d7'),
			sourcePieceCode: PieceCode.BlackPawn,
			targetSquare: normalizeSquare('d5'),
			startButton: 0
		});

		expect(result).toBe(true);
		const snapshot = runtime.getSnapshot();
		expect(snapshot.state.interaction.dragSession!.owner).toBe('test-ext');
		expect(snapshot.state.interaction.dragSession!.type).toBe('release-targeting');
	});

	it('throws when extension does not have completeDrag handler', () => {
		const { commands } = createTestRuntime(createExtensionWithoutCompleteDrag('no-drag-ext'));

		expect(() =>
			commands.startDrag({
				type: 'lifted-piece-drag',
				phase: 'active',
				sourceSquare: normalizeSquare('e2'),
				sourcePieceCode: PieceCode.WhitePawn,
				targetSquare: normalizeSquare('e4'),
				startButton: 0
			})
		).toThrow(/completeDrag/);
	});
});

describe('runtime cancelDrag notification on clearActiveInteraction', () => {
	it('calls cancelDrag on the owning extension for extension-owned drag', () => {
		const cancelDrag = vi.fn();
		const ext: AnyExtensionDefinition = {
			id: 'test-ext',
			slots: [],
			createInstance(options) {
				capturedCommands = options.runtimeSurface.commands;
				return {
					id: 'test-ext',
					completeDrag: vi.fn(),
					cancelDrag
				} as unknown as AnyExtensionInstance;
			}
		};
		const { runtime, commands } = createTestRuntime(ext);

		commands.startDrag({
			type: 'ext:draw',
			sourceSquare: normalizeSquare('e4'),
			sourcePieceCode: null,
			targetSquare: normalizeSquare('e4'),
			startButton: 2
		});

		runtime.clearActiveInteraction();

		expect(cancelDrag).toHaveBeenCalledTimes(1);
		expect(cancelDrag).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'ext:draw',
				owner: 'test-ext'
			})
		);
	});

	it('does not call cancelDrag for core-owned drag session', () => {
		const cancelDrag = vi.fn();
		const mockExtensionSystem = { cancelDrag } as never;

		notifyExtensionCancelDragIfOwned({ extensionSystem: mockExtensionSystem } as never, {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4'),
			startButton: 0
		});

		expect(cancelDrag).not.toHaveBeenCalled();
	});

	it('does not call cancelDrag when drag session is null', () => {
		const cancelDrag = vi.fn();
		const mockExtensionSystem = { cancelDrag } as never;

		notifyExtensionCancelDragIfOwned({ extensionSystem: mockExtensionSystem } as never, null);

		expect(cancelDrag).not.toHaveBeenCalled();
	});

	it('does not throw when extension has no cancelDrag handler', () => {
		const { runtime, commands } = createTestRuntime();

		commands.startDrag({
			type: 'ext:test',
			sourceSquare: normalizeSquare('a1'),
			sourcePieceCode: null,
			targetSquare: normalizeSquare('a1'),
			startButton: 0
		});

		expect(() => runtime.clearActiveInteraction()).not.toThrow();
	});
});

describe('createRuntimeInteractionSurface.completeCoreDragSessionTo assertion', () => {
	function createSurfaceWithDragSession(dragSession: ReturnType<typeof makeDragSessionCoreOwned>) {
		const mutationSession = { addMutation: vi.fn() };
		const interaction = {
			get dragSession() {
				return dragSession;
			},
			updateDragSessionCurrentTarget: vi.fn()
		};
		const fakeInternal = {
			state: { interaction },
			mutation: { getSession: () => mutationSession }
		};
		return {
			surface: createRuntimeInteractionSurface(() => fakeInternal as never),
			interaction
		};
	}

	it('throws when drag session is a pending lifted-piece (core-owned)', () => {
		const dragSession = makeDragSessionCoreOwned({
			phase: 'pending',
			sourceSquare: 12 as Square,
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: 28 as Square,
			startButton: 0,
			startPoint: { x: 0, y: 0 },
			thresholdPx: 4
		});
		const { surface, interaction } = createSurfaceWithDragSession(dragSession);

		expect(() => surface.completeCoreDragSessionTo(28 as Square)).toThrow(
			/core-owned active lifted-piece/
		);
		expect(interaction.updateDragSessionCurrentTarget).not.toHaveBeenCalled();
	});

	it('throws when drag session is release-targeting (core-owned but not active lifted-piece)', () => {
		const dragSession = makeDragSessionCoreOwned({
			type: 'release-targeting',
			sourceSquare: 12 as Square,
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: 28 as Square,
			startButton: 0
		});
		const { surface, interaction } = createSurfaceWithDragSession(dragSession);

		expect(() => surface.completeCoreDragSessionTo(28 as Square)).toThrow(
			/core-owned active lifted-piece/
		);
		expect(interaction.updateDragSessionCurrentTarget).not.toHaveBeenCalled();
	});
});

describe('createRuntimeInteractionSurface.completeExtensionDragSession', () => {
	function createSurfaceWithExtensionDragSession(initial: DragSessionExtensionOwned) {
		const mutationSession = { addMutation: vi.fn() };
		let currentSession: DragSessionExtensionOwned | null = initial;
		const interaction = {
			get dragSession() {
				return currentSession;
			},
			updateDragSessionCurrentTarget: vi.fn(),
			setDragSession: vi.fn((session: DragSessionExtensionOwned | null) => {
				currentSession = session;
				return true;
			})
		};
		const completeDrag = vi.fn();
		const fakeInternal = {
			state: { interaction },
			mutation: { getSession: () => mutationSession, run: vi.fn(() => false) },
			extensionSystem: { completeDrag },
			renderSystem: { requestRender: vi.fn() }
		};
		return {
			surface: createRuntimeInteractionSurface(() => fakeInternal as never),
			interaction,
			completeDrag
		};
	}

	it('accepts an extension-owned pending lifted-piece session', () => {
		const dragSession: DragSessionExtensionOwned = {
			owner: 'my-ext',
			type: 'lifted-piece-drag',
			phase: 'pending',
			sourceSquare: 12 as Square,
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: 28 as Square,
			startButton: 0,
			startPoint: { x: 0, y: 0 },
			thresholdPx: 4
		};
		const { surface, completeDrag, interaction } =
			createSurfaceWithExtensionDragSession(dragSession);

		expect(() => surface.completeExtensionDragSession(28 as Square)).not.toThrow();
		expect(completeDrag).toHaveBeenCalledTimes(1);
		expect(completeDrag).toHaveBeenCalledWith(
			expect.objectContaining({
				owner: 'my-ext',
				type: 'lifted-piece-drag',
				phase: 'pending'
			})
		);
		expect(interaction.setDragSession).toHaveBeenCalledWith(null, expect.anything());
	});
});
