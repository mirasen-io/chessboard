import { PartialDeep } from 'type-fest';
import { DirtyLayer } from '../..';
import type { BoardStateSnapshot, Color, Square } from '../state/boardTypes';
import { squareOf, toAlgebraic } from '../state/coords';
import { decodePiece } from '../state/encode';
import { cburnettPieceUrl } from './assets';
import { isLightSquare } from './geometry';
import type { RenderConfig, Renderer, RenderGeometry, RenderingContext } from './types';
import { DEFAULT_RENDER_CONFIG } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

type SvgRendererOptions = {
	/** Optional renderer visual configuration. */
	config?: PartialDeep<RenderConfig>;
};

type PieceNodeRecord = {
	root: SVGImageElement; // per-piece <image> — locally bounded piece node
};

type AnimationActor = {
	pieceId: number;
	fromSq: Square;
	toSq: Square;
	startTime: number;
	duration: number;
	node: SVGImageElement;
};

/**
 * Minimal SVG renderer with invalidation awareness.
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
 *
 * Notes:
 * - Legacy highlight/overlay groups were removed.
 * - Pieces render into piecesRoot as per-piece <image> elements (one per stable piece id).
 * - defsDynamic is reserved for future extension use; piece rendering does not use it.
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

	// Committed move animation bookkeeping (renderer-local)
	private previousCommittedIds: Int16Array | null = null;
	private previousPositionEpoch: number | null = null;
	private suppressedPieceIds: Set<number> = new Set();
	private activeAnimations: Map<number, AnimationActor> = new Map();
	private rafHandle: number | null = null;

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

		const boardRoot = document.createElementNS(SVG_NS, 'g');
		const coordsRoot = document.createElementNS(SVG_NS, 'g');

		const extensionsUnderPiecesRoot = document.createElementNS(SVG_NS, 'g');
		const piecesRoot = document.createElementNS(SVG_NS, 'g');
		const extensionsOverPiecesRoot = document.createElementNS(SVG_NS, 'g');

		const animationRoot = document.createElementNS(SVG_NS, 'g'); // new committed animation layer

		const extensionsDragUnderRoot = document.createElementNS(SVG_NS, 'g');
		const dragRoot = document.createElementNS(SVG_NS, 'g');
		const extensionsDragOverRoot = document.createElementNS(SVG_NS, 'g');

		const defsDynamic = document.createElementNS(SVG_NS, 'defs');

		// Append in the required order
		svg.appendChild(defsStatic);
		svg.appendChild(boardRoot);
		svg.appendChild(coordsRoot);
		svg.appendChild(extensionsUnderPiecesRoot);
		svg.appendChild(piecesRoot);
		svg.appendChild(extensionsOverPiecesRoot);
		svg.appendChild(animationRoot); // inserted between overPieces and drag-under
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

		// Initialize renderer-local animation state
		this.previousCommittedIds = null;
		this.previousPositionEpoch = null;
		this.suppressedPieceIds.clear();
		this.activeAnimations.clear();
		this.rafHandle = null;

		container.appendChild(svg);
	}

	unmount(): void {
		if (this.svgRoot && this.svgRoot.parentNode) {
			this.svgRoot.parentNode.removeChild(this.svgRoot);
		}
		this.svgRoot = null!;
		// Clear caches and animation state; future mount will recreate DOM afresh
		this.pieceNodes.clear();
		this.suppressedPieceIds.clear();
		this.activeAnimations.clear();
		if (this.rafHandle !== null) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = null;
		}
		this.previousCommittedIds = null;
		this.previousPositionEpoch = null;
	}

	render(ctx: RenderingContext): void {
		if (!this.svgRoot) throw new Error('SvgRenderer: Cannot render before mount()');

		const { board, invalidation, geometry, interaction, transientVisuals } = ctx;
		// Ensure size/viewBox matches geometry
		const size = String(geometry.boardSize);
		this.svgRoot.setAttribute('width', size);
		this.svgRoot.setAttribute('height', size);
		this.svgRoot.setAttribute('viewBox', `0 0 ${size} ${size}`);

		// Decide what to update on layers bitmask
		const layers = invalidation.layers;
		if (layers & DirtyLayer.Board) {
			this.drawBoard(this.config.light, this.config.dark, geometry);
			this.drawCoords(geometry.orientation, geometry);
		}
		if (layers & DirtyLayer.Pieces) {
			// Committed move animation detection runs when committed piece state is being redrawn.
			// In the current architecture, this is the DirtyLayer.Pieces path.
			this.handleCommittedAnimationCycle(board, geometry);

			// Build combined suppression set for this render cycle
			const suppressedIds = new Set(this.suppressedPieceIds); // start with animation IDs

			// Add drag source piece ID if drag is active
			if (interaction.dragSession) {
				const dragId = board.ids[interaction.dragSession.fromSquare];
				if (dragId > 0) {
					suppressedIds.add(dragId);
				}
			}

			this.drawPieces(board, geometry, suppressedIds);
		}
		if (layers & DirtyLayer.Drag) {
			this.drawDrag(interaction, transientVisuals, board, geometry);
		}
	}

	private handleCommittedAnimationCycle(board: BoardStateSnapshot, g: RenderGeometry) {
		// 1) Cancel/clear any in-flight animation actors
		if (this.rafHandle !== null) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = null;
		}
		this.clear(this.animationRoot);
		this.activeAnimations.clear();
		this.suppressedPieceIds.clear();

		// 2) First-time render: seed snapshot, do not animate
		const nextIds = board.ids;
		const nextEpoch = board.positionEpoch;
		if (this.previousCommittedIds === null) {
			this.previousCommittedIds = nextIds.slice() as Int16Array;
			this.previousPositionEpoch = nextEpoch;
			return;
		}

		// 3) Position epoch mismatch: reseed snapshot, do not animate
		if (nextEpoch !== this.previousPositionEpoch) {
			this.previousCommittedIds = nextIds.slice() as Int16Array;
			this.previousPositionEpoch = nextEpoch;
			return;
		}

		// 4) Build id->square maps for valid ids only (id > 0)
		const prevMap = new Map<number, number>();
		const nextMap = new Map<number, number>();
		for (let i = 0; i < 64; i++) {
			const pid = this.previousCommittedIds[i];
			if (pid > 0) prevMap.set(pid, i);
			const nid = nextIds[i];
			if (nid > 0) nextMap.set(nid, i);
		}

		// 5) Collect movers: id present in both maps with changed square
		const movers: Array<{ id: number; fromSq: Square; toSq: Square }> = [];
		for (const [id, fromIndex] of prevMap) {
			const toIndex = nextMap.get(id);
			if (toIndex !== undefined && toIndex !== fromIndex) {
				movers.push({ id, fromSq: fromIndex as Square, toSq: toIndex as Square });
			}
		}

		if (movers.length === 0) {
			// No movers: update snapshot and exit
			this.previousCommittedIds = nextIds.slice() as Int16Array;
			this.previousPositionEpoch = nextEpoch;
			return;
		}

		// 6) Create transient actors and suppression; prepare assets using current board state (destination)
		for (const m of movers) {
			// Compute rects
			const fromRect = g.squareRect(m.fromSq);

			// Asset: use the committed piece at destination square
			const piece = decodePiece(board.pieces[m.toSq]);
			if (!piece) continue;
			const pieceUrl = cburnettPieceUrl(piece.color, piece.role);

			// Create transient node
			const img = document.createElementNS(SVG_NS, 'image');
			img.setAttribute('x', String(fromRect.x));
			img.setAttribute('y', String(fromRect.y));
			img.setAttribute('width', String(fromRect.size));
			img.setAttribute('height', String(fromRect.size));
			img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pieceUrl);
			img.setAttribute('href', pieceUrl);
			this.animationRoot.appendChild(img);

			// Suppress static rendering by pieceId while animating
			this.suppressedPieceIds.add(m.id);

			// Register actor with a short duration and immediate start
			this.activeAnimations.set(m.id, {
				pieceId: m.id,
				fromSq: m.fromSq,
				toSq: m.toSq,
				startTime: performance.now(),
				duration: 180, // ms
				node: img
			});
		}

		// 7) After transient setup/suppression, update previous snapshot
		this.previousCommittedIds = nextIds.slice() as Int16Array;
		this.previousPositionEpoch = nextEpoch;

		// 8) Start RAF loop if we have actors
		if (this.activeAnimations.size > 0) {
			const step = (now: number) => {
				// Advance each actor
				for (const actor of this.activeAnimations.values()) {
					const fromRect = g.squareRect(actor.fromSq);
					const toRect = g.squareRect(actor.toSq);
					const elapsed = now - actor.startTime;
					const t = Math.min(1, Math.max(0, elapsed / actor.duration));
					// simple ease in-out
					const te = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

					const x = fromRect.x + (toRect.x - fromRect.x) * te;
					const y = fromRect.y + (toRect.y - fromRect.y) * te;
					const w = fromRect.size + (toRect.size - fromRect.size) * te;
					const h = w;

					actor.node.setAttribute('x', String(x));
					actor.node.setAttribute('y', String(y));
					actor.node.setAttribute('width', String(w));
					actor.node.setAttribute('height', String(h));

					if (t === 1) {
						// Complete: remove transient, clear suppression, and explicitly append prepared static node
						if (actor.node.parentNode) {
							actor.node.parentNode.removeChild(actor.node);
						}
						this.activeAnimations.delete(actor.pieceId);
						this.suppressedPieceIds.delete(actor.pieceId);

						// Append the already-prepared static node back into piecesRoot immediately
						const rec = this.pieceNodes.get(actor.pieceId);
						if (rec && rec.root.parentNode !== this.piecesRoot) {
							this.piecesRoot.appendChild(rec.root);
						}
					}
				}

				// Continue or stop
				if (this.activeAnimations.size > 0) {
					this.rafHandle = requestAnimationFrame(step);
				} else {
					this.rafHandle = null;
				}
			};
			// Kick the loop
			this.rafHandle = requestAnimationFrame(step);
		}
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
		// Dark label on the light square and light label on the dark square
		return isLightSquare(sq)
			? (this.config.coords?.dark ?? this.config.dark)
			: (this.config.coords?.light ?? this.config.light);
	}

	/**
	 * Render board coordinates (rank/file labels) inside edge squares.
	 * - Rank labels on visual left edge (top-left corner of squares)
	 * - File labels on visual bottom edge (bottom-right corner of squares)
	 * - Uses square-contrast coloring by default, or explicit config.coords if provided
	 */
	private drawCoords(orientation: Color, g: RenderGeometry) {
		const layer = this.coordsRoot;
		this.clear(layer);

		const fontSize = g.squareSize * 0.12;
		const offset = 3; // px offset from square edges

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

	/**
	 * Incremental piece rendering using stable piece ids (state.ids).
	 * - Updates existing nodes for moved/promoted pieces.
	 * - Creates nodes only for new piece ids.
	 * - Removes nodes whose piece ids disappeared.
	 * - Each piece is a single <image> element sized to the square, referencing its own SVG asset.
	 * - defsDynamic is not used; no per-piece clipPaths are created.
	 *
	 * @param suppressedPieceIds - Set of piece IDs that should not be appended to piecesRoot
	 *   (used during drag and committed animation to hide pieces while they render elsewhere).
	 *   Cached nodes are still tracked in seenIds so the sweep does not delete them.
	 */
	private drawPieces(
		board: BoardStateSnapshot,
		g: RenderGeometry,
		suppressedPieceIds: ReadonlySet<number>
	) {
		const layer = this.piecesRoot;
		this.clear(layer);
		// defsDynamic is not used for piece rendering; do not clear or write it here.

		const seenIds = new Set<number>();

		for (let sq = 0 as Square; sq < 64; sq++) {
			const code = board.pieces[sq];
			const piece = decodePiece(code);
			if (!piece) continue;

			const id = board.ids[sq] ?? -1;
			if (id <= 0) continue;

			// Always track the id as seen — even for suppressed cases — so the
			// sweep below not delete the cached node.
			seenIds.add(id);

			const r = g.squareRect(sq);
			const pieceUrl = cburnettPieceUrl(piece.color, piece.role);

			let rec = this.pieceNodes.get(id);
			if (!rec) {
				// Create a locally-bounded per-piece <image> element and cache it
				const img = document.createElementNS(SVG_NS, 'image');
				rec = { root: img };
				this.pieceNodes.set(id, rec);
			}

			// Update position size, and asset URL (handles moves and promotions)
			rec.root.setAttribute('x', r.x.toString());
			rec.root.setAttribute('y', r.y.toString());
			rec.root.setAttribute('width', r.size.toString());
			rec.root.setAttribute('height', r.size.toString());
			rec.root.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pieceUrl);
			rec.root.setAttribute('href', pieceUrl);

			// Decide suppression: check if this piece ID is in the suppression set
			const suppressed = suppressedPieceIds.has(id);

			// Only append to the static layer if not suppressed
			if (!suppressed) {
				// Ensure it's present in the current layer
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
	 * Render the active drag piece preview into dragRoot.
	 * - Clears dragRoot on every.
	 * - If no active drag session or no drag pointer, leaves dragRoot empty.
	 * - Otherwise derives the piece from board.pieces[dragSession.fromSquare] and renders
	 *   exactly one <image> centered at the drag pointer position.
	 * - No node caching: dragRoot is always rebuilt from scratch (drag is transient).
	 */
	private drawDrag(
		interaction: { dragSession: { fromSquare: Square } | null },
		transientVisuals: { dragPointer: { x: number; y: number } | null },
		board: BoardStateSnapshot,
		g: RenderGeometry
	) {
		this.clear(this.dragRoot);
		// Only render if both drag session and drag pointer are available
		if (interaction.dragSession === null || transientVisuals.dragPointer === null) return;

		const sq = interaction.dragSession.fromSquare;
		const piece = decodePiece(board.pieces[sq]);
		if (!piece) return; // no piece at source square — defensive, should not occur in normal flow

		const pieceUrl = cburnettPieceUrl(piece.color, piece.role);
		const squareSize = g.squareSize;
		// Center the piece under the pointer
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
}
