import { decodePiece } from '../state/encode';
import { DirtyLayer, Square, type Color, type Role, type StateSnapshot } from '../state/types';
import { cburnettSpriteUrl } from './assets';
import { isLightSquare } from './geometry';
import type { BoardGeometry, Invalidation, Renderer } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

type SvgRendererOptions = {
	/** Optional override for the sprite URL. Defaults to cburnettSpriteUrl(). */
	spriteUrl?: string;
};

type PieceNodeRecord = {
	root: SVGGElement;
	clipPath: SVGClipPathElement;
	clipRect: SVGRectElement;
	image: SVGImageElement;
};

/**
 * Minimal SVG renderer with invalidation awareness.
 * Layers:
 *  - squares: board background
 *  - highlights: last move + selection
 *  - pieces: all pieces rendered from sprite
 *  - overlay: reserved for arrows/drag previews, etc.
 *
 * Strategy for pieces with sprite:
 *  - Each piece is a <g> with a clipPath (userSpaceOnUse) exactly covering its square.
 *  - Inside the group, we place a single <image href={spriteUrl}> scaled to (squareSize*6 x squareSize*2).
 *  - We offset the image by -col*squareSize, -row*squareSize to show the desired tile.
 */
export class SvgRenderer implements Renderer {
	private root: SVGSVGElement | null = null;
	private layerSquares!: SVGGElement;
	private layerHighlights!: SVGGElement;
	private layerPieces!: SVGGElement;
	private layerOverlay!: SVGGElement;
	private defsStatic!: SVGDefsElement; // persistent defs (markers, etc.)
	private defsDynamic!: SVGDefsElement; // holds per-render clipPaths for pieces
	private spriteUrl: string;
	private uidPrefix: string;

	// Incremental piece DOM cache keyed by stable piece id from state.ids
	private pieceNodes: Map<number, PieceNodeRecord> = new Map();

	constructor(opts: SvgRendererOptions = {}) {
		this.spriteUrl = opts.spriteUrl ?? cburnettSpriteUrl();
		this.uidPrefix = `cb-${Math.random().toString(36).slice(2)}-`;
	}

	mount(container: HTMLElement): void {
		if (this.root) this.unmount();

		const svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('xmlns', SVG_NS);
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'none');

		const defsStatic = document.createElementNS(SVG_NS, 'defs');
		svg.appendChild(defsStatic);

		const gSquares = document.createElementNS(SVG_NS, 'g');
		const gHighlights = document.createElementNS(SVG_NS, 'g');
		const gPieces = document.createElementNS(SVG_NS, 'g');
		const gOverlay = document.createElementNS(SVG_NS, 'g');
		const defsDynamic = document.createElementNS(SVG_NS, 'defs');

		svg.appendChild(gSquares);
		svg.appendChild(gHighlights);
		svg.appendChild(gPieces);
		svg.appendChild(gOverlay);
		svg.appendChild(defsDynamic);

		this.root = svg;
		this.layerSquares = gSquares;
		this.layerHighlights = gHighlights;
		this.layerPieces = gPieces;
		this.layerOverlay = gOverlay;
		this.defsDynamic = defsDynamic;
		this.defsStatic = defsStatic;

		container.appendChild(svg);
	}

	unmount(): void {
		if (this.root && this.root.parentNode) {
			this.root.parentNode.removeChild(this.root);
		}
		this.root = null!;
		// Do not clear caches here; a future mount will recreate DOM afresh
		this.pieceNodes.clear();
	}

	render(state: StateSnapshot, geometry: BoardGeometry, invalidation: Invalidation): void {
		if (!this.root) return;

		// Ensure size/viewBox matches geometry
		const size = String(geometry.boardSize);
		this.root.setAttribute('width', size);
		this.root.setAttribute('height', size);
		this.root.setAttribute('viewBox', `0 0 ${size} ${size}`);

		// Decide what to update based on layers bitmask
		const layers = invalidation.layers;
		const updateBoard = (layers & DirtyLayer.Board) !== 0 || (layers & DirtyLayer.Coords) !== 0;
		const updateHighlights =
			(layers & DirtyLayer.Highlights) !== 0 || (layers & DirtyLayer.LastMove) !== 0 || updateBoard;
		const updatePieces = (layers & DirtyLayer.Pieces) !== 0 || updateBoard;

		if (updateBoard) this.drawSquares(state.theme.light, state.theme.dark, geometry);
		if (updateHighlights) this.drawHighlights(state, geometry);
		if (updatePieces) this.drawPieces(state, geometry);
	}

	private clear(node: Element) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	private drawSquares(light: string, dark: string, g: BoardGeometry) {
		const layer = this.layerSquares;
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

	private drawHighlights(state: StateSnapshot, g: BoardGeometry) {
		const layer = this.layerHighlights;
		this.clear(layer);

		// last move
		if (state.lastMove) {
			this.drawHighlightRect(g, state.lastMove.from, state.theme.lastMove);
			this.drawHighlightRect(g, state.lastMove.to, state.theme.lastMove);
		}
		// selection
		if (state.selected != null) {
			this.drawHighlightRect(g, state.selected, state.theme.selection);
		}
	}

	private drawHighlightRect(g: BoardGeometry, sq: Square, color: string) {
		const r = g.squareRect(sq);
		const rect = document.createElementNS(SVG_NS, 'rect');
		rect.setAttribute('x', r.x.toString());
		rect.setAttribute('y', r.y.toString());
		rect.setAttribute('width', r.size.toString());
		rect.setAttribute('height', r.size.toString());
		rect.setAttribute('fill', color);
		this.layerHighlights.appendChild(rect);
	}

	/**
	 * Incremental piece rendering using stable piece ids (state.ids).
	 * - Updates existing nodes for moved/promoted pieces.
	 * - Creates nodes only for new piece ids.
	 * - Removes nodes whose piece ids disappeared.
	 * - Keeps sprite sheet approach.
	 */
	private drawPieces(state: StateSnapshot, g: BoardGeometry) {
		const tileSize = g.squareSize;
		const imgW = tileSize * 6;
		const imgH = tileSize * 2;

		const seenIds = new Set<number>();

		for (let sq = 0 as Square; sq < 64; sq++) {
			const code = state.pieces[sq];
			const piece = decodePiece(code);
			if (!piece) continue;

			const id = state.ids[sq] ?? -1;
			if (id <= 0) continue;

			const { col, row } = spriteTileFor(piece.color, piece.role);
			const r = g.squareRect(sq);
			const clipId = `${this.uidPrefix}clip-${id}`;

			let rec = this.pieceNodes.get(id);
			if (rec) {
				// Update clip rect to new square
				rec.clipRect.setAttribute('x', r.x.toString());
				rec.clipRect.setAttribute('y', r.y.toString());
				rec.clipRect.setAttribute('width', r.size.toString());
				rec.clipRect.setAttribute('height', r.size.toString());

				// Ensure sprite hrefs are up to date (in case of spriteUrl change)
				rec.image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.spriteUrl);
				rec.image.setAttribute('href', this.spriteUrl);

				// Update image placement within the clipped square
				rec.image.setAttribute('x', (r.x - col * tileSize).toString());
				rec.image.setAttribute('y', (r.y - row * tileSize).toString());
				rec.image.setAttribute('width', imgW.toString());
				rec.image.setAttribute('height', imgH.toString());
				rec.image.setAttribute('preserveAspectRatio', 'none');
			} else {
				// Create clipPath for this piece id
				const cp = document.createElementNS(SVG_NS, 'clipPath');
				cp.setAttribute('id', clipId);
				cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
				const cpRect = document.createElementNS(SVG_NS, 'rect');
				cpRect.setAttribute('x', r.x.toString());
				cpRect.setAttribute('y', r.y.toString());
				cpRect.setAttribute('width', r.size.toString());
				cpRect.setAttribute('height', r.size.toString());
				cp.appendChild(cpRect);
				this.defsDynamic.appendChild(cp);

				// Create the sprite image positioned for this piece
				const img = document.createElementNS(SVG_NS, 'image');
				img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.spriteUrl);
				img.setAttribute('href', this.spriteUrl);
				img.setAttribute('x', (r.x - col * tileSize).toString());
				img.setAttribute('y', (r.y - row * tileSize).toString());
				img.setAttribute('width', imgW.toString());
				img.setAttribute('height', imgH.toString());
				img.setAttribute('preserveAspectRatio', 'none');

				// Group with clipping applied
				const gPiece = document.createElementNS(SVG_NS, 'g');
				gPiece.setAttribute('clip-path', `url(#${clipId})`);
				gPiece.appendChild(img);
				this.layerPieces.appendChild(gPiece);

				rec = { root: gPiece, clipPath: cp, clipRect: cpRect, image: img };
				this.pieceNodes.set(id, rec);
			}

			seenIds.add(id);
		}

		// Sweep: remove nodes for ids that disappeared
		for (const [pid, rec] of this.pieceNodes.entries()) {
			if (!seenIds.has(pid)) {
				if (rec.root.parentNode) rec.root.parentNode.removeChild(rec.root);
				if (rec.clipPath.parentNode) rec.clipPath.parentNode.removeChild(rec.clipPath);
				this.pieceNodes.delete(pid);
			}
		}
	}
}

/**
 * Map piece (color, role) to tile coordinates (col, row) in the 6x2 sprite grid.
 * Sprite columns left→right: K Q B N R P
 * Rows top→bottom: white (0), black (1)
 */
function spriteTileFor(color: Color, role: Role): { col: number; row: number } {
	const row = color === 'white' ? 0 : 1;
	let col = 0;
	switch (role) {
		case 'king':
			col = 0;
			break;
		case 'queen':
			col = 1;
			break;
		case 'bishop':
			col = 2;
			break;
		case 'knight':
			col = 3;
			break;
		case 'rook':
			col = 4;
			break;
		case 'pawn':
			col = 5;
			break;
	}
	return { col, row };
}
