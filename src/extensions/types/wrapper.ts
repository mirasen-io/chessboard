/**
 * Public built-in extension ids accepted by createBoard({ extensions })
 */

import { ActiveTargetDefinition } from '../first-party/active-target/types';
import { BoardEventsDefinition } from '../first-party/board-events/types';
import { LastMoveDefinition } from '../first-party/last-move/types';
import { LegalMovesDefinition } from '../first-party/legal-moves/types';
import { MainRendererDefinition } from '../first-party/main-renderer/types/extension';
import { SelectedSquareDefinition } from '../first-party/selected-square/types';

export const DefaultBuiltinChessboardExtensions = [
	'mainRenderer',
	'events',
	'selectedSquare',
	'activeTarget',
	'legalMoves',
	'lastMove'
] as const;

export type BuiltInExtensionId = (typeof DefaultBuiltinChessboardExtensions)[number];

/**
 * Default built-in extensions used when createBoard(...) receives no extensions option
 */
export type DefaultBuiltinChessboardExtensions = typeof DefaultBuiltinChessboardExtensions;

/**
 * Map built-in public ids -> concrete extension definition types
 */
export interface BuiltInExtensionDefinitionMap {
	mainRenderer: MainRendererDefinition;
	events: BoardEventsDefinition;
	selectedSquare: SelectedSquareDefinition;
	activeTarget: ActiveTargetDefinition;
	legalMoves: LegalMovesDefinition;
	lastMove: LastMoveDefinition;
}
