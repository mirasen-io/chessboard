import { createActiveTarget } from '../extensions/first-party/active-target/factory';
import { createBoardEvents } from '../extensions/first-party/board-events/factory';
import { createLastMove } from '../extensions/first-party/last-move/factory';
import { createLegalMoves } from '../extensions/first-party/legal-moves/factory';
import { createMainRenderer } from '../extensions/first-party/main-renderer/factory';
import { createSelectedSquare } from '../extensions/first-party/selected-square/factory';
import { AnyExtensionDefinition } from '../extensions/types/extension';
import {
	BuiltInExtensionId,
	DefaultBuiltinChessboardExtensions
} from '../extensions/types/wrapper';
import { createRuntime } from '../runtime/factory/main';
import { Chessboard, ChessboardExtensionInput, ChessboardInitOptions } from './types';

function createBuiltInExtensionDefinition(id: BuiltInExtensionId): AnyExtensionDefinition {
	switch (id) {
		case 'mainRenderer':
			return createMainRenderer();
		case 'events':
			return createBoardEvents();
		case 'selectedSquare':
			return createSelectedSquare();
		case 'activeTarget':
			return createActiveTarget();
		case 'legalMoves':
			return createLegalMoves();
		case 'lastMove':
			return createLastMove();
		default:
			throw new Error(`Unknown built-in extension id: ${id}`);
	}
}

export function createBoard<
	TExtensions extends readonly ChessboardExtensionInput[] = DefaultBuiltinChessboardExtensions
>(options: ChessboardInitOptions<TExtensions>): Chessboard<TExtensions> {
	// prepare init options for runtime
	const extensionsInput = options.extensions ?? DefaultBuiltinChessboardExtensions;
	const extensions = extensionsInput.map((ext) => {
		if (typeof ext === 'string') {
			// built-in extension, convert to definition
			return createBuiltInExtensionDefinition(ext);
		}
		// assume it's already a definition
		return ext;
	});
	const doc =
		'document' in options && options.document ? options.document : options.element.ownerDocument;
	const runtime = createRuntime({
		doc,
		state: options.state,
		extensions
	});
	if ('element' in options && options.element) {
		runtime.mount(options.element);
	}
	return {
		mount: runtime.mount,
		unmount: runtime.unmount,
		destroy: runtime.destroy,
		setPosition: runtime.setPosition,
		setPiecePosition: runtime.setPiecePosition,
		setTurn: runtime.setTurn,
		move: runtime.move,
		setOrientation: runtime.setOrientation,
		setMovability: runtime.setMovability,
		select: runtime.select,
		getSnapshot: runtime.getSnapshot,
		extensions: runtime.getExtensionsPublicRecord() as Chessboard<TExtensions>['extensions']
	};
}
