import { describe, expect, it } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode } from '../../../src/state/board/types/internal.js';
import type { DragSessionExtensionOwned } from '../../../src/state/interaction/types/internal.js';

function createTestRuntime() {
	return createRuntime({ doc: document });
}

// The public Runtime type says startDrag(session: ExtensionDragSession),
// but the actual runtime implementation accepts DragSessionExtensionOwned (with owner).
// We cast to exercise the real internal surface behavior.
function callStartDrag(
	runtime: ReturnType<typeof createRuntime>,
	session: DragSessionExtensionOwned
) {
	return (runtime.startDrag as (session: DragSessionExtensionOwned) => boolean)(session);
}

describe('runtime startDrag command', () => {
	it('returns true when starting a valid extension-owned drag session', () => {
		const runtime = createTestRuntime();
		const result = callStartDrag(runtime, {
			owner: 'test-ext',
			type: 'lifted-piece-drag',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4')
		});
		expect(result).toBe(true);
	});

	it('snapshot reflects the drag session', () => {
		const runtime = createTestRuntime();
		callStartDrag(runtime, {
			owner: 'test-ext',
			type: 'lifted-piece-drag',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4')
		});

		const snapshot = runtime.getSnapshot();
		expect(snapshot.state.interaction.dragSession).not.toBeNull();
		expect(snapshot.state.interaction.dragSession!.owner).toBe('test-ext');
		expect(snapshot.state.interaction.dragSession!.type).toBe('lifted-piece-drag');
		expect(snapshot.state.interaction.dragSession!.sourceSquare).toBe(normalizeSquare('e2'));
		expect(snapshot.state.interaction.dragSession!.targetSquare).toBe(normalizeSquare('e4'));
	});

	it('throws when starting a drag session while another is active', () => {
		const runtime = createTestRuntime();
		callStartDrag(runtime, {
			owner: 'ext-a',
			type: 'lifted-piece-drag',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4')
		});

		expect(() =>
			callStartDrag(runtime, {
				owner: 'ext-b',
				type: 'release-targeting',
				sourceSquare: normalizeSquare('d7'),
				sourcePieceCode: PieceCode.BlackPawn,
				targetSquare: normalizeSquare('d5')
			})
		).toThrow(/Cannot set a new drag session/);
	});

	it('can start a new drag session after clearing the previous one', () => {
		const runtime = createTestRuntime();
		callStartDrag(runtime, {
			owner: 'ext-a',
			type: 'lifted-piece-drag',
			sourceSquare: normalizeSquare('e2'),
			sourcePieceCode: PieceCode.WhitePawn,
			targetSquare: normalizeSquare('e4')
		});

		runtime.clearActiveInteraction();

		const result = callStartDrag(runtime, {
			owner: 'ext-b',
			type: 'release-targeting',
			sourceSquare: normalizeSquare('d7'),
			sourcePieceCode: PieceCode.BlackPawn,
			targetSquare: normalizeSquare('d5')
		});
		expect(result).toBe(true);

		const snapshot = runtime.getSnapshot();
		expect(snapshot.state.interaction.dragSession).not.toBeNull();
		expect(snapshot.state.interaction.dragSession!.owner).toBe('ext-b');
		expect(snapshot.state.interaction.dragSession!.type).toBe('release-targeting');
	});
});
