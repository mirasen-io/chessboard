import { Square } from '../../../../state/board/types/internal.js';
import { ExtensionCleanAnimationContext } from '../../../types/context/animation.js';
import { ExtensionRenderContext } from '../../../types/context/render.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import type { PieceSymbolResolver } from '../piece-symbols.js';

type PieceNodeRecord = {
	root: SVGUseElement; // per-piece <use> referencing a symbol definition
};

export interface MainRendererPiecesInternal {
	readonly resolver: PieceSymbolResolver;
	readonly pieceNodes: Map<Square, PieceNodeRecord>;
	suppressedSquares: ReadonlySet<Square>;
}

export interface MainRendererPieces {
	onUpdate(context: ExtensionUpdateContext, animationSuppressedSquares: ReadonlySet<Square>): void;
	refreshSuppressedSquares(
		context: ExtensionCleanAnimationContext,
		animationSuppressedSquares: ReadonlySet<Square>
	): void;
	render(context: ExtensionRenderContext, slot: SVGGElement): void;
	unmount(): void;
}
