import { describe, expect, it } from 'vitest';
import { createLayout } from '../../src/layout/factory.js';
import type { LayoutMutationPayloadByCause } from '../../src/layout/mutation.js';
import { createMutationSession } from '../../src/mutation/session.js';
import { ColorCode } from '../../src/state/board/types/internal.js';
import { createMockContainer } from '../test-utils/layout/fixtures.js';

function createLayoutMutationSession() {
	return createMutationSession<LayoutMutationPayloadByCause>();
}

describe('createLayout', () => {
	describe('initial defaults', () => {
		it('sceneSize is null', () => {
			const layout = createLayout();
			expect(layout.sceneSize).toBeNull();
		});

		it('orientation is ColorCode.White', () => {
			const layout = createLayout();
			expect(layout.orientation).toBe(ColorCode.White);
		});

		it('geometry is null', () => {
			const layout = createLayout();
			expect(layout.geometry).toBeNull();
		});

		it('layoutEpoch is 0', () => {
			const layout = createLayout();
			expect(layout.layoutEpoch).toBe(0);
		});
	});

	describe('refreshGeometry', () => {
		it('returns true and records mutation on change', () => {
			const layout = createLayout();
			const session = createLayoutMutationSession();
			const container = createMockContainer(400, 400);

			const changed = layout.refreshGeometry({ container, orientation: ColorCode.White }, session);

			expect(changed).toBe(true);
			expect(session.hasMutation({ causes: ['layout.refreshGeometry'] })).toBe(true);
		});

		it('returns false and does not record mutation on no-op', () => {
			const layout = createLayout();
			const container = createMockContainer(400, 400);

			// First refresh to set state
			const session1 = createLayoutMutationSession();
			layout.refreshGeometry({ container, orientation: ColorCode.White }, session1);

			// Second refresh with same params
			const session2 = createLayoutMutationSession();
			const changed = layout.refreshGeometry({ container, orientation: ColorCode.White }, session2);

			expect(changed).toBe(false);
			expect(session2.hasMutation({ causes: ['layout.refreshGeometry'] })).toBe(false);
		});

		it('getters reflect updated state after refresh', () => {
			const layout = createLayout();
			const session = createLayoutMutationSession();
			const container = createMockContainer(800, 800);

			layout.refreshGeometry({ container, orientation: ColorCode.Black }, session);

			expect(layout.sceneSize).toEqual({ width: 800, height: 800 });
			expect(layout.orientation).toBe(ColorCode.Black);
			expect(layout.geometry).not.toBeNull();
			expect(layout.geometry!.squareSize).toBe(100);
			expect(layout.layoutEpoch).toBe(1);
		});

		it('sequential refreshes produce correct sequential epochs', () => {
			const layout = createLayout();

			const s1 = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(400, 400), orientation: ColorCode.White },
				s1
			);
			expect(layout.layoutEpoch).toBe(1);

			const s2 = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(600, 600), orientation: ColorCode.White },
				s2
			);
			expect(layout.layoutEpoch).toBe(2);

			const s3 = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(600, 600), orientation: ColorCode.Black },
				s3
			);
			expect(layout.layoutEpoch).toBe(3);
		});
	});

	describe('getSnapshot', () => {
		it('returns correct structure matching current state', () => {
			const layout = createLayout();
			const session = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(400, 400), orientation: ColorCode.White },
				session
			);

			const snapshot = layout.getSnapshot();

			expect(snapshot.sceneSize).toEqual({ width: 400, height: 400 });
			expect(snapshot.orientation).toBe(ColorCode.White);
			expect(snapshot.geometry).not.toBeNull();
			expect(snapshot.layoutEpoch).toBe(1);
		});

		it('snapshot isolation: previous snapshot does not change after a later refresh', () => {
			const layout = createLayout();
			const s1 = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(400, 400), orientation: ColorCode.White },
				s1
			);

			const snapshotBefore = layout.getSnapshot();

			const s2 = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(800, 800), orientation: ColorCode.Black },
				s2
			);

			// Previous snapshot should still reflect old state
			expect(snapshotBefore.sceneSize).toEqual({ width: 400, height: 400 });
			expect(snapshotBefore.orientation).toBe(ColorCode.White);
			expect(snapshotBefore.layoutEpoch).toBe(1);

			// New snapshot should reflect new state
			const snapshotAfter = layout.getSnapshot();
			expect(snapshotAfter.sceneSize).toEqual({ width: 800, height: 800 });
			expect(snapshotAfter.orientation).toBe(ColorCode.Black);
			expect(snapshotAfter.layoutEpoch).toBe(2);
		});

		it('two snapshots are different references', () => {
			const layout = createLayout();
			const snap1 = layout.getSnapshot();
			const snap2 = layout.getSnapshot();
			expect(snap1).not.toBe(snap2);
		});

		it('snapshot clones nested references (sceneSize and geometry)', () => {
			const layout = createLayout();
			const session = createLayoutMutationSession();
			layout.refreshGeometry(
				{ container: createMockContainer(400, 400), orientation: ColorCode.White },
				session
			);

			const snapshot = layout.getSnapshot();

			// sceneSize: equal values but not same reference
			expect(snapshot.sceneSize).toEqual(layout.sceneSize);
			expect(snapshot.sceneSize).not.toBe(layout.sceneSize);

			// geometry: equal values but not same reference
			expect(snapshot.geometry).toEqual(layout.geometry);
			expect(snapshot.geometry).not.toBe(layout.geometry);
		});
	});
});
