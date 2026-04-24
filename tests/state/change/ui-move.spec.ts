import { describe, expect, it } from 'vitest';
import { RoleCode, type Square } from '../../../src/state/board/types/internal.js';
import { createPendingUIMoveRequest } from '../../../src/state/change/factory/ui-move.js';
import { makeMoveDestination } from '../../test-utils/state/change/fixtures.js';

const SOURCE: Square = 12 as Square; // e2

describe('createPendingUIMoveRequest', () => {
	describe('initial state', () => {
		it('starts as unresolved with null resolvedMoveRequest', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			expect(req.status).toBe('unresolved');
			expect(req.resolvedMoveRequest).toBeNull();
			expect(req.sourceSquare).toBe(SOURCE);
		});
	});

	describe('defer()', () => {
		it('transitions from unresolved to deferred', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.defer();
			expect(req.status).toBe('deferred');
		});

		it('throws when already deferred', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.defer();
			expect(() => req.defer()).toThrow();
		});

		it('throws when already resolved', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.autoresolve();
			expect(() => req.defer()).toThrow();
		});
	});

	describe('resolve()', () => {
		it('transitions from unresolved to resolved with given request', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			const moveRequest = { from: SOURCE, to: 28 as Square };
			req.resolve(moveRequest);
			expect(req.status).toBe('resolved');
			expect(req.resolvedMoveRequest).toBe(moveRequest);
		});

		it('transitions from deferred to resolved', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.defer();
			const moveRequest = { from: SOURCE, to: 28 as Square };
			req.resolve(moveRequest);
			expect(req.status).toBe('resolved');
			expect(req.resolvedMoveRequest).toBe(moveRequest);
		});

		it('throws when already resolved', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.resolve({ from: SOURCE, to: 28 as Square });
			expect(() => req.resolve({ from: SOURCE, to: 28 as Square })).toThrow();
		});
	});

	describe('canBeAutoResolved', () => {
		it('is true when unresolved and no promotedTo', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			expect(req.canBeAutoResolved).toBe(true);
		});

		it('is true when unresolved and promotedTo is empty array', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination({ promotedTo: [] }));
			expect(req.canBeAutoResolved).toBe(true);
		});

		it('is true when unresolved and promotedTo has single element', () => {
			const req = createPendingUIMoveRequest(
				SOURCE,
				makeMoveDestination({ promotedTo: [RoleCode.Queen] })
			);
			expect(req.canBeAutoResolved).toBe(true);
		});

		it('is false when unresolved and promotedTo has multiple elements', () => {
			const req = createPendingUIMoveRequest(
				SOURCE,
				makeMoveDestination({ promotedTo: [RoleCode.Queen, RoleCode.Knight] })
			);
			expect(req.canBeAutoResolved).toBe(false);
		});

		it('is false when deferred', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.defer();
			expect(req.canBeAutoResolved).toBe(false);
		});

		it('is false when resolved', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.autoresolve();
			expect(req.canBeAutoResolved).toBe(false);
		});
	});

	describe('autoresolve()', () => {
		it('builds MoveRequest without promotedTo when none specified', () => {
			const dest = makeMoveDestination({ to: 28 as Square });
			const req = createPendingUIMoveRequest(SOURCE, dest);
			req.autoresolve();
			expect(req.status).toBe('resolved');
			expect(req.resolvedMoveRequest).toEqual({
				from: SOURCE,
				to: 28
			});
		});

		it('builds MoveRequest with single promotedTo', () => {
			const dest = makeMoveDestination({
				to: 60 as Square, // e8
				promotedTo: [RoleCode.Queen]
			});
			const req = createPendingUIMoveRequest(SOURCE, dest);
			req.autoresolve();
			expect(req.resolvedMoveRequest).toEqual({
				from: SOURCE,
				to: 60,
				promotedTo: RoleCode.Queen
			});
		});

		it('includes capturedSquare and secondary from destination', () => {
			const dest = makeMoveDestination({
				to: 28 as Square,
				capturedSquare: 28 as Square,
				secondary: { from: 7 as Square, to: 5 as Square }
			});
			const req = createPendingUIMoveRequest(SOURCE, dest);
			req.autoresolve();
			expect(req.resolvedMoveRequest).toEqual({
				from: SOURCE,
				to: 28,
				capturedSquare: 28,
				secondary: { from: 7, to: 5 }
			});
		});

		it('throws when not auto-resolvable (multiple promotedTo)', () => {
			const dest = makeMoveDestination({
				promotedTo: [RoleCode.Queen, RoleCode.Knight]
			});
			const req = createPendingUIMoveRequest(SOURCE, dest);
			expect(() => req.autoresolve()).toThrow();
		});

		it('throws when already deferred', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.defer();
			expect(() => req.autoresolve()).toThrow();
		});
	});

	describe('getSnapshot()', () => {
		it('returns snapshot with derived canBeAutoResolved', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			const snap = req.getSnapshot();
			expect(snap.status).toBe('unresolved');
			expect(snap.sourceSquare).toBe(SOURCE);
			expect(snap.canBeAutoResolved).toBe(true);
			expect(snap.resolvedMoveRequest).toBeNull();
		});

		it('reflects state changes after autoresolve', () => {
			const req = createPendingUIMoveRequest(SOURCE, makeMoveDestination());
			req.autoresolve();
			const snap = req.getSnapshot();
			expect(snap.status).toBe('resolved');
			expect(snap.canBeAutoResolved).toBe(false);
			expect(snap.resolvedMoveRequest).not.toBeNull();
		});
	});
});
