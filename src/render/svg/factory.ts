import { Writable } from 'type-fest';
import {
	ExtensionAllocatedSlotsInternal,
	ExtensionSlotName
} from '../../extensions/types/basic/mount.js';
import { RenderSystemInitOptionsInternal, SvgRoots } from '../types.js';
import { createSvgElement } from './helpers.js';

export function createSvgRoots(options: RenderSystemInitOptionsInternal): SvgRoots {
	const { doc } = options;
	const svgRoot = createSvgElement(doc, 'svg', { 'data-chessboard-id': 'svg-root' });
	svgRoot.style.setProperty('user-select', 'none');
	svgRoot.style.setProperty('-webkit-user-select', 'none');
	svgRoot.style.setProperty('touch-action', 'pinch-zoom');
	svgRoot.style.setProperty('-webkit-touch-callout', 'none');
	svgRoot.style.setProperty('-webkit-tap-highlight-color', 'transparent');
	const result: SvgRoots = {
		svgRoot,
		defs: createSvgElement(doc, 'defs', { 'data-chessboard-id': 'defs-root' }),
		board: createSvgElement(doc, 'g', { 'data-chessboard-id': 'board-root' }),
		coordinates: createSvgElement(doc, 'g', { 'data-chessboard-id': 'coordinates-root' }),
		underPieces: createSvgElement(doc, 'g', { 'data-chessboard-id': 'under-pieces-root' }),
		pieces: createSvgElement(doc, 'g', { 'data-chessboard-id': 'pieces-root' }),
		overPieces: createSvgElement(doc, 'g', { 'data-chessboard-id': 'over-pieces-root' }),
		animation: createSvgElement(doc, 'g', { 'data-chessboard-id': 'animation-root' }),
		underDrag: createSvgElement(doc, 'g', { 'data-chessboard-id': 'under-drag-root' }),
		drag: createSvgElement(doc, 'g', { 'data-chessboard-id': 'drag-root' }),
		overDrag: createSvgElement(doc, 'g', { 'data-chessboard-id': 'over-drag-root' })
	};

	// Attach layers in the correct order
	svgRoot.appendChild(result.defs);
	svgRoot.appendChild(result.board);
	svgRoot.appendChild(result.coordinates);
	svgRoot.appendChild(result.underPieces);
	svgRoot.appendChild(result.pieces);
	svgRoot.appendChild(result.overPieces);
	svgRoot.appendChild(result.animation);
	svgRoot.appendChild(result.underDrag);
	svgRoot.appendChild(result.drag);
	svgRoot.appendChild(result.overDrag);
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
		result[slot] = createSvgElement(svgRoots[slot], 'g', { 'data-chessboard-id': id });
	}
	return result;
}
