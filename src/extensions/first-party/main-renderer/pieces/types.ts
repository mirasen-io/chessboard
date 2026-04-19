import { Square } from '../../../../state/board/types/internal.js';
import { ExtensionCleanAnimationContext } from '../../../types/context/animation.js';
import { ExtensionRenderContext } from '../../../types/context/render.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { PieceUrls } from '../types/internal.js';

type PieceNodeRecord = {
	root: SVGImageElement; // per-piece <image> — locally bounded piece node
};

export interface MainRendererPiecesInternal {
	readonly config: PieceUrls;
	readonly pieceNodes: Map<Square, PieceNodeRecord>;
	suppressedSquares: ReadonlySet<Square>;
}

export interface MainRendererPieces {
	onUpdate(context: ExtensionUpdateContext, animationSuppressedSquares: ReadonlySet<Square>): void;
	refreshSuppressedSquares(
		context: ExtensionCleanAnimationContext,
		animationSuppressedSquares: ReadonlySet<Square>
	): void;
	render(context: ExtensionRenderContext, layer: SVGElement): void;
	unmount(): void;
}
