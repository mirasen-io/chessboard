import { describe, expect, it } from 'vitest';
import { createLayout } from '../../src/core/layout/factory';
import type { LayoutMutationPayloadByCause } from '../../src/core/layout/mutation';
import { createMutationSession } from '../../src/core/state/mutation/session';

function makeContainer(size: number): HTMLElement {
	return { clientWidth: size, clientHeight: size } as unknown as HTMLElement;
}

describe('core/layout', () => {
	describe('initial state', () => {
		it('getBoardSize() returns 0', () => {
			const layout = createLayout();
			expect(layout.getBoardSize()).toBe(0);
		});

		it('getGeometry() returns null', () => {
			const layout = createLayout();
			expect(layout.getGeometry()).toBeNull();
		});

		it('getLayoutVersion() returns 0', () => {
			const layout = createLayout();
			expect(layout.getLayoutVersion()).toBe(0);
		});
	});

	describe('refreshGeometry', () => {
		it('positive size initializes geometry', () => {
			const layout = createLayout();
			const session = createMutationSession<LayoutMutationPayloadByCause>();

			const result = layout.refreshGeometry(makeContainer(400), 'white', session);

			expect(result).toBe(true);
			expect(layout.getGeometry()).not.toBeNull();
			expect(layout.getGeometry()!.boardSize).toBe(400);
			expect(layout.getGeometry()!.orientation).toBe('white');
			expect(layout.getBoardSize()).toBe(400);
			expect(layout.getLayoutVersion()).toBe(1);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(true);
		});

		it('same size + same orientation is a no-op', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const result = layout.refreshGeometry(makeContainer(400), 'white', session);

			expect(result).toBe(false);
			expect(layout.getLayoutVersion()).toBe(1);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(false);
			expect(session.hasChanges()).toBe(false);
		});

		it('same size + different orientation is changed', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const result = layout.refreshGeometry(makeContainer(400), 'black', session);

			expect(result).toBe(true);
			expect(layout.getGeometry()!.orientation).toBe('black');
			expect(layout.getLayoutVersion()).toBe(2);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(true);
		});

		it('valid size change is changed', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const result = layout.refreshGeometry(makeContainer(500), 'white', session);

			expect(result).toBe(true);
			expect(layout.getBoardSize()).toBe(500);
			expect(layout.getLayoutVersion()).toBe(2);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(true);
		});

		it('valid -> zero clears geometry and bumps version', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const result = layout.refreshGeometry(makeContainer(0), 'white', session);

			expect(result).toBe(true);
			expect(layout.getGeometry()).toBeNull();
			expect(layout.getBoardSize()).toBe(0);
			expect(layout.getLayoutVersion()).toBe(2);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(true);
		});

		it('valid -> negative also clears geometry and bumps version', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const container = { clientWidth: -1, clientHeight: -1 } as unknown as HTMLElement;
			const result = layout.refreshGeometry(container, 'white', session);

			expect(result).toBe(true);
			expect(layout.getGeometry()).toBeNull();
			expect(layout.getBoardSize()).toBe(0);
			expect(layout.getLayoutVersion()).toBe(2);
		});

		it('zero when already boardSize=0 and geometry=null is a no-op', () => {
			const layout = createLayout();
			const session = createMutationSession<LayoutMutationPayloadByCause>();

			const result = layout.refreshGeometry(makeContainer(0), 'white', session);

			expect(result).toBe(false);
			expect(layout.getLayoutVersion()).toBe(0);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(false);
			expect(session.hasChanges()).toBe(false);
		});

		it('negative when already boardSize=0 and geometry=null is a no-op', () => {
			const layout = createLayout();
			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const container = { clientWidth: -1, clientHeight: -1 } as unknown as HTMLElement;

			const result = layout.refreshGeometry(container, 'white', session);

			expect(result).toBe(false);
			expect(layout.getLayoutVersion()).toBe(0);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(false);
		});

		it('non-square container uses Math.min of width and height', () => {
			const layout = createLayout();
			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const container = { clientWidth: 400, clientHeight: 300 } as unknown as HTMLElement;

			layout.refreshGeometry(container, 'white', session);

			expect(layout.getBoardSize()).toBe(300);
		});
	});

	describe('refreshGeometryForOrientation', () => {
		it('with boardSize=0 and geometry=null is a no-op', () => {
			const layout = createLayout();
			const session = createMutationSession<LayoutMutationPayloadByCause>();

			const result = layout.refreshGeometryForOrientation('white', session);

			expect(result).toBe(false);
			expect(layout.getLayoutVersion()).toBe(0);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(false);
			expect(session.hasChanges()).toBe(false);
		});

		it('with initialized layout + same orientation is a no-op', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const result = layout.refreshGeometryForOrientation('white', session);

			expect(result).toBe(false);
			expect(layout.getLayoutVersion()).toBe(1);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(false);
			expect(session.hasChanges()).toBe(false);
		});

		it('with initialized layout + different orientation rebuilds and is changed', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const session = createMutationSession<LayoutMutationPayloadByCause>();
			const result = layout.refreshGeometryForOrientation('black', session);

			expect(result).toBe(true);
			expect(layout.getGeometry()!.orientation).toBe('black');
			expect(layout.getGeometry()!.boardSize).toBe(400);
			expect(layout.getLayoutVersion()).toBe(2);
			expect(session.hasMutation('board.layout.refreshGeometry')).toBe(true);
		});
	});

	describe('getSnapshot', () => {
		it('reflects initial state', () => {
			const layout = createLayout();
			const snap = layout.getSnapshot();

			expect(snap.boardSize).toBe(0);
			expect(snap.geometry).toBeNull();
			expect(snap.layoutVersion).toBe(0);
		});

		it('reflects state after positive refresh', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const snap = layout.getSnapshot();

			expect(snap.boardSize).toBe(400);
			expect(snap.layoutVersion).toBe(1);
			expect(snap.geometry).not.toBeNull();
			expect(snap.geometry!.boardSize).toBe(400);
			expect(snap.geometry!.orientation).toBe('white');
		});

		it('reflects cleared state after valid -> zero refresh', () => {
			const layout = createLayout();
			layout.refreshGeometry(
				makeContainer(400),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);
			layout.refreshGeometry(
				makeContainer(0),
				'white',
				createMutationSession<LayoutMutationPayloadByCause>()
			);

			const snap = layout.getSnapshot();

			expect(snap.boardSize).toBe(0);
			expect(snap.geometry).toBeNull();
			expect(snap.layoutVersion).toBe(2);
		});
	});
});
