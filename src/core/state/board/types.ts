/**
 * Core public types for the chessboard state layer.
 * - Public-facing types use readable names (Color/Role long names).
 * - Inputs may accept short aliases; normalization happens in helpers (implemented elsewhere).
 * - Internals use numeric squares (0..63) and compact encodings; those details are hidden from consumers.
 */

import type { ReadonlyDeep } from 'type-fest';
import type { BoardMutationSession } from './mutation';

export type Color = 'white' | 'black';
export type ColorShort = 'w' | 'b';
export type ColorInput = Color | ColorShort;

export type Role = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type RoleShort = 'p' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type RoleInput = Role | RoleShort;
export type RolePromotion = Exclude<Role, 'king' | 'pawn'>;
export type RolePromotionShort = Exclude<RoleShort, 'p' | 'K'>;

// Numeric square index (0..63); a1 = 0, b1 = 1, ..., h8 = 63.
// Note: We keep it as number but document the domain. Converters live in coords.ts.
export type Square =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31
	| 32
	| 33
	| 34
	| 35
	| 36
	| 37
	| 38
	| 39
	| 40
	| 41
	| 42
	| 43
	| 44
	| 45
	| 46
	| 47
	| 48
	| 49
	| 50
	| 51
	| 52
	| 53
	| 54
	| 55
	| 56
	| 57
	| 58
	| 59
	| 60
	| 61
	| 62
	| 63;
// Algebraic squares like 'e4'. Use template literal types to avoid listing all 64.
export type FileChar = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type RankChar = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type SquareString = `${FileChar}${RankChar}`;

export type SquareInput = Square | SquareString;

export interface Piece {
	color: Color;
	role: Role;
}
export interface PieceShort {
	color: ColorShort;
	role: RoleShort;
}

export type RolePromotionInput = RolePromotion | RolePromotionShort;

export interface MoveInputBaseSquare {
	from: Square;
	to: Square;
}

export interface MoveInputSquare extends MoveInputBaseSquare {
	capturedSquare?: Square; // Optional: the square of the captured piece, useful for en passant
	secondary?: MoveInputBaseSquare; // Optional: for multi-part moves like castling (rook move)
	promotion?: RolePromotionInput; // Optional: for promotion moves
}

export interface MoveInputBaseString {
	from: SquareString;
	to: SquareString;
}

export interface MoveInputString extends MoveInputBaseString {
	capturedSquare?: SquareString; // Optional: the square of the captured piece, useful for en passant
	secondary?: MoveInputBaseString; // Optional: for multi-part moves like castling (rook move)
	promotion?: RolePromotionInput; // Optional: for promotion moves
}

export type MoveInput = MoveInputSquare | MoveInputString;

export interface MoveBase {
	from: Square;
	to: Square;
	moved: Piece;
}
export type MoveBaseSnapshot = ReadonlyDeep<MoveBase>;

export interface Move extends MoveBase {
	promotion?: RolePromotion;
	captured?: Piece;
	capturedSquare?: Square; // Optional: where the captured piece was (for en passant)
	secondary?: MoveBase; // Optional: for multi-part moves like castling (rook move)
}
export type MoveSnapshot = ReadonlyDeep<Move>;

/**
 * Internal mutable board state used by reducers/runtime.
 * Not intended as a renderer- or consumer-facing contract.
 */
export interface BoardStateInternal {
	// Encoded pieces on the board
	pieces: Uint8Array;
	// current turn
	turn: Color;
	// Incremented on position changes
	positionEpoch: number;
}

/**
 * State snapshot shape exposed to consumers. Contains only board-owned fields; view state is separate.
 */
export type BoardStateSnapshot = ReadonlyDeep<BoardStateInternal>;

// Position map acceptance forms (public inputs)
// Long/canonical
export type PositionMap = Partial<Record<SquareString, Piece>>;
// Short/alias
export type PositionMapShort = Partial<Record<SquareString, PieceShort>>;
export type FEN = string; // Standard FEN string; validation/parsing happens in helpers (implemented elsewhere).
export type PositionInput = 'start' | FEN | PositionMap | PositionMapShort;

export interface BoardStateInitOptions {
	position?: PositionInput; // 'start' | FEN | PositionMap | PositionMapShort
	turn?: ColorInput; // optional override of active color
}

export interface BoardState {
	setPosition(input: PositionInput, mutationSession: BoardMutationSession): boolean;
	setTurn(turn: ColorInput, mutationSession: BoardMutationSession): boolean;
	move(move: MoveInput, mutationSession: BoardMutationSession): Move;
	getPieceCodeAt(square: Square): number;
	getSnapshot(): BoardStateSnapshot;
}
