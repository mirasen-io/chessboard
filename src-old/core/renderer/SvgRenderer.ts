import { PartialDeep } from 'type-fest';
import { createSvgGroup, SVG_NS } from '../helpers/svg';
import { setsEqual } from '../helpers/util';
import { DirtyLayer } from '../scheduler/types';
import type { BoardStateSnapshot, Color, Square } from '../state/boardTypes';
import { squareOf, toAlgebraic } from '../state/coords';
import { decodePiece } from '../state/encode';
import { cburnettPieceUrl } from './assets';
import { isLightSquare } from './geometry';
import { renderAnimationFrame } from './SvgAnimationFrameRenderer';
import type {
	AnimationRenderContext,
	BoardRenderContext,
	DragRenderContext,
	RenderConfig,
	Renderer,
	RenderGeometry
} from './types';
import { DEFAULT_RENDER_CONFIG } from './types';

type SvgRendererOptions = {
	/** Optional renderer visual configuration. */
	config?: PartialDeep<RenderConfig>;
};

type PieceNodeRecord = {
	root: SVGImageElement; // per-piece <image> — locally bounded piece node
};

/**
 * Minimal SVG renderer with split rendering passes.
 * Phase 3.10: Split into renderBoard/renderAnimations/renderDrag.
 *
 * Structure (ownership-based roots/slots):
 *  1) defsStatic
 *  2) boardRoot
 *  3) coordsRoot
 *  4) extensionsUnderPiecesRoot
 *  5) piecesRoot
 *  6) extensionsOverPiecesRoot
 *  7) animationRoot           <-- committed move animations only
 *  8) extensionsDragUnderRoot
 *  9) dragRoot
 * 10) extensionsDragOverRoot
 * 11) defsDynamic
 */
export class SvgRenderer implements Renderer {
	private svgRoot: SVGSVGElement | null = null;

	// Core-owned roots
	private boardRoot!: SVGGElement;
	private coordsRoot!: SVGGElement;
	private piecesRoot!: SVGGElement;
	private animationRoot!: SVGGElement; // committed animations only
	private dragRoot!: SVGGElement;

	// Reserved extension slots
	private extensionsUnderPiecesRoot!: SVGGElement;
	private extensionsOverPiecesRoot!: SVGGElement;
	private extensionsDragUnderRoot!: SVGGElement;
	private extensionsDragOverRoot!: SVGGElement;

	// Defs containers
	private defsStatic!: SVGDefsElement; // persistent defs (markers, etc.)
	private defsDynamic!: SVGDefsElement; // reserved for future extension use

	private config: RenderConfig;

	// Incremental piece DOM cache keyed by stable piece id from state.ids
	private pieceNodes: Map<number, PieceNodeRecord> = new Map();

	// Session group for active animation (owned by renderer, passed to frame renderer)
	private activeSessionGroup: SVGGElement | null = null;

	// Track last suppression state to detect changes
	private lastSuppressedPieceIds: ReadonlySet<number> = new Set();

	constructor(opts: SvgRendererOptions = {}) {
		this.config = {
			...DEFAULT_RENDER_CONFIG,
			...(opts.config ?? {}),
			coords: {
				...DEFAULT_RENDER_CONFIG.coords!,
				...(opts.config?.coords ?? {})
			}
		};
	}

	mount(container: HTMLElement): void {
		if (this.svgRoot) this.unmount();

		const svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('xmlns', SVG_NS);
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'none');

		// Containers and roots/slots
		const defsStatic = document.createElementNS(SVG_NS, 'defs');

		// Root layers
		const boardRoot = createSvgGroup(document, { 'data-layer-id': 'board' });

		const coordsRoot = createSvgGroup(document, { 'data-layer-id': 'coords' });

		const piecesRoot = createSvgGroup(document, { 'data-layer-id': 'pieces' });

		const animationRoot = createSvgGroup(document, { 'data-layer-id': 'animation' });

		const dragRoot = createSvgGroup(document, { 'data-layer-id': 'drag' });

		const defsDynamic = document.createElementNS(SVG_NS, 'defs');

		// Extension slots will be allocated dynamically, but we create the root groups here
		const extensionsUnderPiecesRoot = createSvgGroup(document, {
			'data-layer-id': 'extensions-underPieces'
		});

		const extensionsOverPiecesRoot = createSvgGroup(document, {
			'data-layer-id': 'extensions-overPieces'
		});

		const extensionsDragUnderRoot = createSvgGroup(document, {
			'data-layer-id': 'extensions-dragUnder'
		});

		const extensionsDragOverRoot = createSvgGroup(document, {
			'data-layer-id': 'extensions-dragOver'
		});

		// Append in the required order
		svg.appendChild(defsStatic);
		svg.appendChild(boardRoot);
		svg.appendChild(coordsRoot);
		svg.appendChild(extensionsUnderPiecesRoot);
		svg.appendChild(piecesRoot);
		svg.appendChild(extensionsOverPiecesRoot);
		svg.appendChild(animationRoot);
		svg.appendChild(extensionsDragUnderRoot);
		svg.appendChild(dragRoot);
		svg.appendChild(extensionsDragOverRoot);
		svg.appendChild(defsDynamic);

		// Assign fields
		this.svgRoot = svg;

		this.boardRoot = boardRoot;
		this.coordsRoot = coordsRoot;
		this.piecesRoot = piecesRoot;
		this.animationRoot = animationRoot;
		this.dragRoot = dragRoot;

		this.extensionsUnderPiecesRoot = extensionsUnderPiecesRoot;
		this.extensionsOverPiecesRoot = extensionsOverPiecesRoot;
		this.extensionsDragUnderRoot = extensionsDragUnderRoot;
		this.extensionsDragOverRoot = extensionsDragOverRoot;

		this.defsStatic = defsStatic;
		this.defsDynamic = defsDynamic;

		this.activeSessionGroup = null;

		container.appendChild(svg);
	}

	unmount(): void {
		if (this.svgRoot && this.svgRoot.parentNode) {
			this.svgRoot.parentNode.removeChild(this.svgRoot);
		}
		this.svgRoot = null!;
		this.pieceNodes.clear();
		this.activeSessionGroup = null;
		this.lastSuppressedPieceIds = new Set();
	}

	renderBoard(ctx: BoardRenderContext): void {
		if (!this.svgRoot) throw new Error('SvgRenderer: Cannot render before mount()');

		const { board, geometry, invalidation, suppressedPieceIds } = ctx;

		// Ensure size/viewBox matches geometry
		const size = String(geometry.boardSize);
		this.svgRoot.setAttribute('width', size);
		this.svgRoot.setAttribute('height', size);
		this.svgRoot.setAttribute('viewBox', `0 0 ${size} ${size}`);

		// Detect if suppression changed since last render
		const suppressionChanged = !setsEqual(suppressedPieceIds, this.lastSuppressedPieceIds);

		// Decide what to update on layers bitmask
		const layers = invalidation.layers;
		if (layers & DirtyLayer.Board) {
			this.drawBoard(this.config.light, this.config.dark, geometry);
			this.drawCoords(geometry.orientation, geometry);
		}
		// Update pieces if either:
		// - normal invalidation requests it
		// - OR suppression changed
		if (layers & DirtyLayer.Pieces || suppressionChanged) {
			this.drawPieces(board, geometry, suppressedPieceIds);
			// Snapshot current suppression for next comparison
			this.lastSuppressedPieceIds = new Set(suppressedPieceIds);
		}
	}

	renderAnimations(ctx: AnimationRenderContext): void {
		if (!this.svgRoot) throw new Error('SvgRenderer: Cannot render before mount()');

		const { session, board, geometry } = ctx;

		// If no session, clear animation root and return
		if (session === null) {
			this.clear(this.animationRoot);
			this.activeSessionGroup = null;
			return;
		}

		// Check if we need a new session group (new session or no existing group)
		const needsNewGroup =
			!this.activeSessionGroup ||
			this.activeSessionGroup.parentNode !== this.animationRoot ||
			this.activeSessionGroup.getAttribute('data-session-id') !== String(session.id);

		if (needsNewGroup) {
			this.clear(this.animationRoot);
			this.activeSessionGroup = document.createElementNS(SVG_NS, 'g');
			this.activeSessionGroup.setAttribute('data-session-id', String(session.id));
			this.animationRoot.appendChild(this.activeSessionGroup);
		}

		// Delegate frame rendering to helper (activeSessionGroup is guaranteed non-null here)
		renderAnimationFrame(this.activeSessionGroup!, session, board, geometry, performance.now());
	}

	renderDrag(ctx: DragRenderContext): void {
		if (!this.svgRoot) throw new Error('SvgRenderer: Cannot render before mount()');

		const { interaction, transientVisuals, board, geometry } = ctx;

		this.clear(this.dragRoot);

		// Only render if both drag session and drag pointer are available
		if (interaction.dragSession === null || transientVisuals.dragPointer === null) return;

		const sq = interaction.dragSession.fromSquare;
		const piece = decodePiece(board.pieces[sq]);
		if (!piece) return;

		const pieceUrl = cburnettPieceUrl(piece.color, piece.role);
		const squareSize = geometry.squareSize;
		const x = transientVisuals.dragPointer.x - squareSize / 2;
		const y = transientVisuals.dragPointer.y - squareSize / 2;

		const img = document.createElementNS(SVG_NS, 'image');
		img.setAttribute('x', x.toString());
		img.setAttribute('y', y.toString());
		img.setAttribute('width', squareSize.toString());
		img.setAttribute('height', squareSize.toString());
		img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pieceUrl);
		img.setAttribute('href', pieceUrl);

		this.dragRoot.appendChild(img);
	}

	private clear(node: Element) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	private drawBoard(light: string, dark: string, g: RenderGeometry) {
		const layer = this.boardRoot;
		this.clear(layer);

		for (let sq = 0 as Square; sq < 64; sq++) {
			const r = g.squareRect(sq);
			const rect = document.createElementNS(SVG_NS, 'rect');
			rect.setAttribute('x', r.x.toString());
			rect.setAttribute('y', r.y.toString());
			rect.setAttribute('width', r.size.toString());
			rect.setAttribute('height', r.size.toString());
			rect.setAttribute('fill', isLightSquare(sq) ? light : dark);
			rect.setAttribute('shape-rendering', 'crispEdges');
			layer.appendChild(rect);
		}
	}

	private labelColorForSquare(sq: Square): string {
		return isLightSquare(sq)
			? (this.config.coords?.dark ?? this.config.dark)
			: (this.config.coords?.light ?? this.config.light);
	}

	private drawCoords(orientation: Color, g: RenderGeometry) {
		const layer = this.coordsRoot;
		this.clear(layer);

		const fontSize = g.squareSize * 0.12;
		const offset = 3;

		// Rank labels on visual left edge
		const rankFile = orientation === 'white' ? 0 : 7;
		for (let visualRank = 0; visualRank < 8; visualRank++) {
			const logicalRank = orientation === 'white' ? 7 - visualRank : visualRank;
			const sq = squareOf(rankFile, logicalRank);
			const label = orientation === 'white' ? String(8 - visualRank) : String(1 + visualRank);

			const r = g.squareRect(sq);
			const color = this.labelColorForSquare(sq);

			const text = document.createElementNS(SVG_NS, 'text');
			text.setAttribute('x', (r.x + offset).toString());
			text.setAttribute('y', (r.y + offset).toString());
			text.setAttribute('font-size', fontSize.toString());
			text.setAttribute('font-family', 'sans-serif');
			text.setAttribute('font-weight', 'bold');
			text.setAttribute('fill', color);
			text.setAttribute('text-anchor', 'start');
			text.setAttribute('dominant-baseline', 'hanging');
			text.setAttribute('data-square', toAlgebraic(sq));
			text.textContent = label;
			layer.appendChild(text);
		}

		// File labels on visual bottom edge
		const fileRank = orientation === 'white' ? 0 : 7;
		for (let visualFile = 0; visualFile < 8; visualFile++) {
			const logicalFile = orientation === 'white' ? visualFile : 7 - visualFile;
			const sq = squareOf(logicalFile, fileRank);
			const label =
				orientation === 'white'
					? String.fromCharCode('a'.charCodeAt(0) + visualFile)
					: String.fromCharCode('h'.charCodeAt(0) - visualFile);

			const r = g.squareRect(sq);
			const color = this.labelColorForSquare(sq);

			const text = document.createElementNS(SVG_NS, 'text');
			text.setAttribute('x', (r.x + r.size - offset).toString());
			text.setAttribute('y', (r.y + r.size - offset).toString());
			text.setAttribute('font-size', fontSize.toString());
			text.setAttribute('font-family', 'sans-serif');
			text.setAttribute('font-weight', 'bold');
			text.setAttribute('fill', color);
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('dominant-baseline', 'auto');
			text.setAttribute('data-square', toAlgebraic(sq));
			text.textContent = label;
			layer.appendChild(text);
		}
	}

	private drawPieces(
		board: BoardStateSnapshot,
		g: RenderGeometry,
		suppressedPieceIds: ReadonlySet<number>
	) {
		const layer = this.piecesRoot;
		this.clear(layer);

		const seenIds = new Set<number>();

		for (let sq = 0 as Square; sq < 64; sq++) {
			const code = board.pieces[sq];
			const piece = decodePiece(code);
			if (!piece) continue;

			const id = board.ids[sq] ?? -1;
			if (id <= 0) continue;

			seenIds.add(id);

			const r = g.squareRect(sq);
			const pieceUrl = cburnettPieceUrl(piece.color, piece.role);

			let rec = this.pieceNodes.get(id);
			if (!rec) {
				const img = document.createElementNS(SVG_NS, 'image');
				rec = { root: img };
				this.pieceNodes.set(id, rec);
			}

			rec.root.setAttribute('x', r.x.toString());
			rec.root.setAttribute('y', r.y.toString());
			rec.root.setAttribute('width', r.size.toString());
			rec.root.setAttribute('height', r.size.toString());
			rec.root.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pieceUrl);
			rec.root.setAttribute('href', pieceUrl);

			const suppressed = suppressedPieceIds.has(id);

			if (!suppressed) {
				if (rec.root.parentNode !== layer) {
					layer.appendChild(rec.root);
				}
			}
		}

		// Sweep: remove nodes for ids that disappeared
		for (const [pid, rec] of this.pieceNodes.entries()) {
			if (!seenIds.has(pid)) {
				if (rec.root.parentNode) rec.root.parentNode.removeChild(rec.root);
				this.pieceNodes.delete(pid);
			}
		}
	}

	/**
	 * Map slot name to the corresponding existing slot root.
	 * Only recognizes known ExtensionSlotName values.
	 */
	private getSlotRoot(slot: string): SVGGElement {
		switch (slot) {
			case 'underPieces':
				return this.extensionsUnderPiecesRoot;
			case 'overPieces':
				return this.extensionsOverPiecesRoot;
			case 'dragUnder':
				return this.extensionsDragUnderRoot;
			case 'dragOver':
				return this.extensionsDragOverRoot;
			default:
				throw new Error(`Invalid extension slot name: ${slot}`);
		}
	}

	/**
	 * Allocate per-extension child <g> elements inside requested slot roots.
	 * Returns a map of slot name to the created child element handle.
	 * Phase 4.2a: Runtime integration with flexible slot allocation.
	 */
	allocateExtensionSlots<TSlots extends string>(
		extensionId: string,
		slots: readonly TSlots[]
	): Partial<Record<TSlots, SVGGElement>> {
		if (!this.svgRoot) {
			throw new Error('SvgRenderer: Cannot allocate extension slots before mount()');
		}

		// Detect duplicate slot names
		const seen = new Set<TSlots>();
		for (const slot of slots) {
			if (seen.has(slot)) {
				throw new Error(`Duplicate slot name in allocation: ${slot}`);
			}
			seen.add(slot);
		}

		const result = {} as Partial<Record<TSlots, SVGGElement>>;

		for (const slot of slots) {
			const slotRoot = this.getSlotRoot(slot);
			const child = document.createElementNS(SVG_NS, 'g');
			child.setAttribute('data-extension-id', extensionId);
			slotRoot.appendChild(child);
			result[slot] = child;
		}

		return result;
	}

	/**
	 * Remove all child <g> elements with the given extension ID from all slot roots.
	 * Phase 4.1: Renderer-side cleanup contract only, no runtime integration yet.
	 */
	removeExtensionSlots(extensionId: string): void {
		if (!this.svgRoot) {
			throw new Error('SvgRenderer: Cannot remove extension slots before mount()');
		}

		const slotRoots = [
			this.extensionsUnderPiecesRoot,
			this.extensionsOverPiecesRoot,
			this.extensionsDragUnderRoot,
			this.extensionsDragOverRoot
		];

		for (const root of slotRoots) {
			const children = Array.from(root.children);
			for (const child of children) {
				if (child.getAttribute('data-extension-id') === extensionId) {
					root.removeChild(child);
				}
			}
		}
	}
}
