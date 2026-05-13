import { describe, expect, it, vi } from 'vitest';
import { VISUAL_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import { DirtyLayer } from '../../../../src/extensions/first-party/annotations/types/internal.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/annotations/types/main.js';
import {
	createGeometry,
	createRenderContext,
	setupMountedInstance,
	SQUARE_SIZE
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

function createPreviewRenderContext() {
	return createRenderContext({ dirtyLayers: DirtyLayer.PREVIEW });
}

function createCommittedAndPreviewRenderContext() {
	return createRenderContext({ dirtyLayers: DirtyLayer.COMMITTED | DirtyLayer.PREVIEW });
}

function startDrawGesture(
	instance: ReturnType<typeof setupMountedInstance>['instance'],
	sourceSquare: number
) {
	instance.onEvent!({
		rawEvent: new PointerEvent('pointerdown', { button: 2 }),
		sceneEvent: { targetSquare: sourceSquare },
		runtimeInteractionActionPreview: null
	} as never);
}

function updatePreviewTarget(
	instance: ReturnType<typeof setupMountedInstance>['instance'],
	targetSquare: number | null
) {
	const markDirty = vi.fn();
	instance.onUpdate!({
		previousFrame: null,
		mutation: { hasMutation: () => false, getPayloads: vi.fn(), getAll: vi.fn() },
		currentFrame: {
			isMounted: true,
			state: {
				interaction: {
					dragSession: { type: 'ext:draw', owner: EXTENSION_ID, targetSquare }
				}
			},
			layout: {
				sceneSize: { width: 400, height: 400 },
				orientation: 0,
				geometry: createGeometry(),
				layoutEpoch: 1
			}
		},
		invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
	} as never);
}

describe('annotations preview — render circle preview', () => {
	it('no active gesture renders nothing in drag slot', () => {
		const { instance, roots } = setupMountedInstance();

		instance.render!(createPreviewRenderContext());

		expect(roots.drag.children.length).toBe(0);
	});

	it('circle preview renders in drag slot when target === source', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);

		instance.render!(createPreviewRenderContext());

		expect(roots.drag.children.length).toBe(1);
		const circle = roots.drag.children[0] as SVGCircleElement;
		expect(circle.tagName).toBe('circle');
		expect(circle.getAttribute('data-chessboard-id')).toBe('annotation-circle-preview');
	});

	it('circle preview uses previewAdd geometry', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);

		instance.render!(createPreviewRenderContext());

		const circle = roots.drag.children[0] as SVGCircleElement;
		const expectedRadius = (SQUARE_SIZE * VISUAL_CONFIG.circle.previewAdd.radius).toString();
		const expectedStrokeWidth = (
			SQUARE_SIZE * VISUAL_CONFIG.circle.previewAdd.strokeWidth
		).toString();
		expect(circle.getAttribute('r')).toBe(expectedRadius);
		expect(circle.getAttribute('stroke-width')).toBe(expectedStrokeWidth);
		expect(circle.getAttribute('opacity')).toBe(VISUAL_CONFIG.circle.previewAdd.opacity.toString());
	});

	it('circle preview uses gesture color', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);

		instance.render!(createPreviewRenderContext());

		const circle = roots.drag.children[0] as SVGCircleElement;
		expect(circle.getAttribute('stroke')).toBe('#15781B');
	});

	it('circle remove preview uses previewRemoveOpacity when same-color committed circle exists', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.circle('e4', { color: '#15781B' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createPreviewRenderContext());

		const circle = roots.drag.children[0] as SVGCircleElement;
		expect(circle.getAttribute('opacity')).toBe(
			VISUAL_CONFIG.circle.previewRemoveOpacity.toString()
		);
	});

	it('different-color committed circle uses add/replace preview style', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.circle('e4', { color: '#882020' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createPreviewRenderContext());

		const circle = roots.drag.children[0] as SVGCircleElement;
		expect(circle.getAttribute('opacity')).toBe(VISUAL_CONFIG.circle.previewAdd.opacity.toString());
	});

	it('no preview elements render into overPieces from preview', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);

		const overPiecesChildrenBefore = roots.overPieces.children.length;
		instance.render!(createPreviewRenderContext());

		expect(roots.overPieces.children.length).toBe(overPiecesChildrenBefore);
	});

	it('square 0 works for circle preview', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 0);
		updatePreviewTarget(instance, 0);

		instance.render!(createPreviewRenderContext());

		expect(roots.drag.children.length).toBe(1);
		const circle = roots.drag.children[0] as SVGCircleElement;
		expect(circle.getAttribute('cx')).toBe((SQUARE_SIZE / 2).toString());
		expect(circle.getAttribute('cy')).toBe((SQUARE_SIZE / 2).toString());
	});
});

describe('annotations preview — render arrow preview', () => {
	it('arrow preview renders line in drag slot when target !== source', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const line = roots.drag.querySelector('line');
		expect(line).not.toBeNull();
		expect(line!.getAttribute('data-chessboard-id')).toBe('annotation-arrow-preview');
	});

	it('arrow preview renders marker in defs slot', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const marker = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		);
		expect(marker).not.toBeNull();
	});

	it('arrow preview marker contains path with correct color and data id', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const marker = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		);
		const path = marker!.querySelector('path');
		expect(path).not.toBeNull();
		expect(path!.getAttribute('fill')).toBe('#15781B');
		expect(path!.getAttribute('data-chessboard-id')).toBe('annotation-arrowhead-path-preview');
	});

	it('arrow preview marker path has no data-chessboard-extension-id', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const marker = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		);
		const path = marker!.querySelector('path');
		expect(path!.hasAttribute('data-chessboard-extension-id')).toBe(false);
	});

	it('arrow line marker-end references the correct marker href', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const line = roots.drag.querySelector('line')!;
		const marker = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		)!;
		const markerId = marker.getAttribute('id')!;
		expect(line.getAttribute('marker-end')).toBe(`url(#${markerId})`);
	});

	it('arrow preview uses previewAdd geometry for add style', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const line = roots.drag.querySelector('line')!;
		const expectedStrokeWidth = (
			SQUARE_SIZE * VISUAL_CONFIG.arrow.previewAdd.strokeWidth
		).toString();
		expect(line.getAttribute('stroke-width')).toBe(expectedStrokeWidth);
		expect(line.getAttribute('opacity')).toBe(VISUAL_CONFIG.arrow.previewAdd.opacity.toString());
	});

	it('same-color committed arrow uses committed geometry + remove-preview opacity', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.arrow('e4', 'e5', { color: '#15781B' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		const line = roots.drag.querySelector('line')!;
		const expectedStrokeWidth = (
			SQUARE_SIZE * VISUAL_CONFIG.arrow.committed.strokeWidth
		).toString();
		expect(line.getAttribute('stroke-width')).toBe(expectedStrokeWidth);
		expect(line.getAttribute('opacity')).toBe(VISUAL_CONFIG.arrow.previewRemoveOpacity.toString());
	});

	it('different-color committed arrow uses add/replace preview style', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.arrow('e4', 'e5', { color: '#882020' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		const line = roots.drag.querySelector('line')!;
		expect(line.getAttribute('opacity')).toBe(VISUAL_CONFIG.arrow.previewAdd.opacity.toString());
	});

	it('no preview elements render into overPieces from arrow preview', () => {
		const { instance, roots } = setupMountedInstance();
		const overPiecesChildrenBefore = roots.overPieces.children.length;

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		expect(roots.overPieces.children.length).toBe(overPiecesChildrenBefore);
	});

	it('marker is not rendered inside drag slot', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);

		instance.render!(createPreviewRenderContext());

		const markerInDrag = roots.drag.querySelector('marker');
		expect(markerInDrag).toBeNull();
	});
});

describe('annotations preview — transitions and cleanup', () => {
	it('clearing preview removes circle from drag', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createPreviewRenderContext());
		expect(roots.drag.children.length).toBe(1);

		instance.cancelDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: null
		} as never);
		instance.render!(createPreviewRenderContext());

		expect(roots.drag.children.length).toBe(0);
	});

	it('clearing preview removes line from drag and marker from defs', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		const markerBefore = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		);
		expect(markerBefore).not.toBeNull();

		instance.cancelDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: null
		} as never);
		instance.render!(createPreviewRenderContext());

		expect(roots.drag.querySelector('line')).toBeNull();
		expect(
			roots.defs.querySelector('marker[data-chessboard-id="annotation-arrowhead-preview"]')
		).toBeNull();
	});

	it('committed markers in defs remain untouched after clearing preview', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.arrow('a1', 'h8', { color: '#ff0000' });
		instance.render!(createRenderContext());

		const committedMarkerCount = roots.defs.querySelectorAll('marker').length;

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		instance.cancelDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: null
		} as never);
		instance.render!(createPreviewRenderContext());

		expect(roots.defs.querySelectorAll('marker').length).toBe(committedMarkerCount);
	});

	it('circle -> arrow transition removes circle and creates arrow', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createPreviewRenderContext());
		expect(roots.drag.querySelector('circle')).not.toBeNull();

		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		expect(roots.drag.querySelector('circle')).toBeNull();
		expect(roots.drag.querySelector('line')).not.toBeNull();
	});

	it('arrow -> circle transition removes arrow and creates circle', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());
		expect(roots.drag.querySelector('line')).not.toBeNull();

		updatePreviewTarget(instance, 28);
		instance.render!(createPreviewRenderContext());

		expect(roots.drag.querySelector('line')).toBeNull();
		expect(
			roots.defs.querySelector('marker[data-chessboard-id="annotation-arrowhead-preview"]')
		).toBeNull();
		expect(roots.drag.querySelector('circle')).not.toBeNull();
	});

	it('marker id is stable across multiple arrow preview renders', () => {
		const { instance, roots } = setupMountedInstance();
		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		const marker1 = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		)!;
		const id1 = marker1.getAttribute('id');

		updatePreviewTarget(instance, 44);
		instance.render!(createPreviewRenderContext());

		const marker2 = roots.defs.querySelector(
			'marker[data-chessboard-id="annotation-arrowhead-preview"]'
		)!;
		const id2 = marker2.getAttribute('id');

		expect(id1).toBe(id2);
	});

	it('committed annotations remain untouched during all preview operations', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.circle('a1', { color: '#ff0000' });
		api.arrow('e2', 'e4', { color: '#00ff00' });
		instance.render!(createRenderContext());

		const committedCircle = roots.overPieces.querySelector('circle');
		const committedLine = roots.overPieces.querySelector('line');

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createPreviewRenderContext());

		updatePreviewTarget(instance, 36);
		instance.render!(createPreviewRenderContext());

		expect(roots.overPieces.querySelector('circle')).toBe(committedCircle);
		expect(roots.overPieces.querySelector('line')).toBe(committedLine);
		expect(api.getCircles()).toEqual([{ square: 'a1', color: '#ff0000' }]);
		expect(api.getArrows()).toEqual([{ from: 'e2', to: 'e4', color: '#00ff00' }]);
	});
});

describe('annotations preview — committed suppression during remove-preview', () => {
	it('same-color circle remove-preview suppresses committed circle in overPieces', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.circle('e4', { color: '#15781B' });
		instance.render!(createRenderContext());
		expect(roots.overPieces.querySelector('circle')).not.toBeNull();

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(roots.overPieces.querySelector('circle')).toBeNull();
		expect(roots.drag.querySelector('circle')).not.toBeNull();
	});

	it('committed circle DOM is restored after preview clears', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.circle('e4', { color: '#15781B' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createCommittedAndPreviewRenderContext());
		expect(roots.overPieces.querySelector('circle')).toBeNull();

		instance.cancelDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: null
		} as never);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(roots.overPieces.querySelector('circle')).not.toBeNull();
	});

	it('same-color arrow remove-preview suppresses committed arrow in overPieces and defs', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.arrow('e4', 'e5', { color: '#15781B' });
		instance.render!(createRenderContext());
		expect(roots.overPieces.querySelector('line')).not.toBeNull();
		const committedMarkerCount = roots.defs.querySelectorAll('marker').length;
		expect(committedMarkerCount).toBe(1);

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(roots.overPieces.querySelector('line')).toBeNull();
		const remainingCommittedMarkers = roots.defs.querySelectorAll(
			'marker[data-chessboard-id^="annotation-arrowhead-committed"]'
		);
		expect(remainingCommittedMarkers.length).toBe(0);
	});

	it('committed arrow DOM/marker is restored after preview clears', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.arrow('e4', 'e5', { color: '#15781B' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createCommittedAndPreviewRenderContext());

		instance.cancelDrag!({
			type: 'ext:draw',
			owner: EXTENSION_ID,
			sourceSquare: 28,
			sourcePieceCode: null,
			targetSquare: null
		} as never);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(roots.overPieces.querySelector('line')).not.toBeNull();
		expect(
			roots.defs.querySelector('marker[data-chessboard-id^="annotation-arrowhead-committed"]')
		).not.toBeNull();
	});

	it('different-color committed circle is not suppressed', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.circle('e4', { color: '#882020' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(roots.overPieces.querySelector('circle')).not.toBeNull();
	});

	it('different-color committed arrow is not suppressed', () => {
		const { instance, api, roots } = setupMountedInstance();
		api.arrow('e4', 'e5', { color: '#882020' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(roots.overPieces.querySelector('line')).not.toBeNull();
	});

	it('api.getCircles() does not change during suppression', () => {
		const { instance, api } = setupMountedInstance();
		api.circle('e4', { color: '#15781B' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 28);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(api.getCircles()).toEqual([{ square: 'e4', color: '#15781B' }]);
	});

	it('api.getArrows() does not change during suppression', () => {
		const { instance, api } = setupMountedInstance();
		api.arrow('e4', 'e5', { color: '#15781B' });
		instance.render!(createRenderContext());

		startDrawGesture(instance, 28);
		updatePreviewTarget(instance, 36);
		instance.render!(createCommittedAndPreviewRenderContext());

		expect(api.getArrows()).toEqual([{ from: 'e4', to: 'e5', color: '#15781B' }]);
	});
});
