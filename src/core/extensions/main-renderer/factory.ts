import { createSvgRendererAnimation } from './animation/factory';
import { createSvgRendererBoard } from './board/factory';
import { createSvgRendererDrag } from './drag/factory';
import { rendererAllocateExtensionSlots, rendererRemoveExtensionSlots } from './extensions';
import { createSvgElement, createSvgGroup, updateElementAttributes } from './helpers';
import { rendererMount, rendererUnmount } from './lifecycle';
import {
	SvgRenderer,
	SvgRendererInitOptions,
	SvgRendererInternals,
	SvgRendererInternalsExtensions
} from './types';

function createSvgRendererInternals(
	doc: Document,
	options: SvgRendererInitOptions
): SvgRendererInternals {
	const svgRoot = createSvgElement(doc, 'svg', {
		'data-chessboard-id': 'renderer-root'
	});
	const defsRoot = createSvgElement(doc, 'defs', {
		'data-chessboard-id': 'renderer-defs-root'
	});
	const extensions: SvgRendererInternalsExtensions = {
		underPieces: createSvgGroup(doc, { 'data-chessboard-id': 'extension-under-pieces' }),
		overPieces: createSvgGroup(doc, { 'data-chessboard-id': 'extension-over-pieces' }),
		dragUnder: createSvgGroup(doc, { 'data-chessboard-id': 'extension-drag-under' }),
		dragOver: createSvgGroup(doc, { 'data-chessboard-id': 'extension-drag-over' }),
		defs: createSvgGroup(doc, { 'data-chessboard-id': 'extension-defs' }),
		allocatedSlots: new Map()
	};
	const board = createSvgRendererBoard(doc, options.board ?? {});
	const drag = createSvgRendererDrag(doc);
	const animation = createSvgRendererAnimation(doc);

	// Append in the required order
	defsRoot.appendChild(board.defsRoot);
	defsRoot.appendChild(drag.defsRoot);
	defsRoot.appendChild(animation.defsRoot);
	defsRoot.appendChild(extensions.defs);
	svgRoot.appendChild(defsRoot);
	svgRoot.appendChild(board.root);
	svgRoot.appendChild(board.coords);
	svgRoot.appendChild(extensions.underPieces);
	svgRoot.appendChild(board.pieces);
	svgRoot.appendChild(extensions.overPieces);
	svgRoot.appendChild(animation.root);
	svgRoot.appendChild(extensions.dragUnder);
	svgRoot.appendChild(drag.root);
	svgRoot.appendChild(extensions.dragOver);
	// svgRoot.appendChild(defsDynamic);

	return {
		container: null,
		svgRoot,
		defsRoot,
		board,
		drag,
		animation,
		extensions,
		lastBoardFrame: null
	};
}

export function createSvgRenderer(doc: Document, options: SvgRendererInitOptions): SvgRenderer {
	const internalState = createSvgRendererInternals(doc, options);
	return {
		get container() {
			return internalState.container;
		},
		mount(container) {
			// Mount ourselves into the container
			rendererMount(internalState, container);
		},
		unmount() {
			rendererUnmount(internalState);
		},
		renderBoard(context) {
			const size = String(context.geometry.boardSize);
			updateElementAttributes(internalState.svgRoot, {
				width: size,
				height: size,
				viewBox: `0 0 ${size} ${size}`
			});
			internalState.board.render({
				previous: internalState.lastBoardFrame,
				current: context,
				invalidation: context.invalidation
			});
			internalState.lastBoardFrame = {
				board: context.board,
				suppressedSquares: context.suppressedSquares,
				geometry: context.geometry
			};
		},
		renderDrag(context) {
			internalState.drag.render(context);
		},
		renderAnimations(context) {
			internalState.animation.render(context);
		},
		allocateExtensionSlots(extensionId, slotNames) {
			return rendererAllocateExtensionSlots(internalState, extensionId, slotNames);
		},
		removeExtensionSlots(extensionId) {
			return rendererRemoveExtensionSlots(internalState, extensionId);
		}
	};
}
