import { Writable } from 'type-fest';
import {
	ExtensionAllocatedSlotsInternal,
	ExtensionSlotName
} from '../../extensions/types/basic/mount.js';
import { RenderSystemInitOptionsInternal, SvgRoots } from '../types.js';
import { createSvgDefsElement, createSvgElement, createSvgRootElement } from './helpers.js';

export function createSvgRoots(options: RenderSystemInitOptionsInternal): SvgRoots {
	const { element } = options;
	const svgRoot = createSvgRootElement(element, { 'data-chessboard-id': 'svg-root' });
	svgRoot.style.setProperty('user-select', 'none');
	svgRoot.style.setProperty('-webkit-user-select', 'none');
	svgRoot.style.setProperty('touch-action', 'pinch-zoom');
	svgRoot.style.setProperty('-webkit-touch-callout', 'none');
	svgRoot.style.setProperty('-webkit-tap-highlight-color', 'transparent');
	// Don't clip board-local overlay visuals (e.g. mobile lifted drag piece
	// scaled above the top rank) at the SVG viewport.
	svgRoot.style.setProperty('overflow', 'visible');

	// Create children in the correct order
	const board = createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'board-root' });
	const coordinates = createSvgElement(svgRoot, 'g', {
		'data-chessboard-id': 'coordinates-root'
	});
	const underPieces = createSvgElement(svgRoot, 'g', {
		'data-chessboard-id': 'under-pieces-root'
	});
	const pieces = createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'pieces-root' });
	const overPieces = createSvgElement(svgRoot, 'g', {
		'data-chessboard-id': 'over-pieces-root'
	});
	const animation = createSvgElement(svgRoot, 'g', {
		'data-chessboard-id': 'animation-root'
	});
	const underDrag = createSvgElement(svgRoot, 'g', {
		'data-chessboard-id': 'under-drag-root'
	});
	const drag = createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'drag-root' });
	const overDrag = createSvgElement(svgRoot, 'g', {
		'data-chessboard-id': 'over-drag-root'
	});

	const result: SvgRoots = {
		svgRoot,
		board,
		coordinates,
		underPieces,
		pieces,
		overPieces,
		animation,
		underDrag,
		drag,
		overDrag
	};

	return result;
}

export function allocateExtensionSlotRoots(
	svgRoots: SvgRoots,
	extensionId: string,
	slots: readonly ExtensionSlotName[]
): ExtensionAllocatedSlotsInternal {
	const result = {} as Writable<ExtensionAllocatedSlotsInternal>;
	for (const slot of slots) {
		const id = `extension-slot-root-${slot}-${extensionId}`;
		if (slot === 'defs') {
			result[slot] = createSvgDefsElement(svgRoots.svgRoot, { 'data-chessboard-id': id });
		} else {
			result[slot] = createSvgElement(svgRoots[slot], 'g', { 'data-chessboard-id': id });
		}
	}
	return result;
}
