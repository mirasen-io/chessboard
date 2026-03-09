/**
 * Core public types for the chessboard state layer.
 * - Public-facing types use readable names (Color/Role long names).
 * - Inputs may accept short aliases; normalization happens in helpers (implemented elsewhere).
 * - Internals use numeric squares (0..63) and compact encodings; those details are hidden from consumers.
 */

import { ReadonlyDeep } from 'type-fest';

export type Color = 'white' | 'black';
export type ColorShort = 'w' | 'b';
export type ColorInput = Color | ColorShort;

export type Role = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type RoleShort = 'p' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type RoleInput = Role | RoleShort;
export type RolePromotion = Exclude<Role, 'king' | 'pawn'>;
export type RolePromotionShort = Exclude<RoleShort, 'p' | 'K'>;
export type RolePromotionInput = RolePromotion | RolePromotionShort;

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

export interface Piece {
	color: Color;
	role: Role;
}
export interface PieceShort {
	color: ColorShort;
	role: RoleShort;
}

export type CastleSide = 'kingside' | 'queenside';
interface MoveInputBase {
	castleSide?: CastleSide;
}

export interface MoveInputSquare extends MoveInputBase {
	from: Square;
	to: Square;
}
export interface MoveInputString extends MoveInputBase {
	from: SquareString;
	to: SquareString;
}
export type MoveInput = MoveInputSquare | MoveInputString;

// Minimal theming shape for state-level awareness. Renderer can accept richer theme later.
export interface Theme {
	// Board colors
	light: string; // e.g., '#f0d9b5'
	dark: string; // e.g., '#b58863'
	// Highlights and overlays
	selection: string; // e.g., 'rgba(255, 215, 0, 0.6)'
	lastMove: string; // e.g., 'rgba(246, 246, 105, 0.6)'
	highlight: string; // generic highlight color (legal moves, etc.)
	// Optional: coordinate text color (renderer may use)
	coords?: string; // e.g., '#333'
}

export type CastleSquare = {
	rookFrom: Square;
	rookTo: Square;
};

export interface Move extends MoveInputSquare {
	moved: Piece;
	promotion?: RolePromotion;
	captured?: Piece;
	capturedSquare?: Square; // Optional: where the captured piece was (for en passant)
	castle?: CastleSquare;
}
// Read-only snapshot shape exposed to consumers.
export interface StateSnapshot {
	readonly pieces: ReadonlyDeep<Uint8Array>;
	readonly ids: ReadonlyDeep<Int16Array>;
	readonly orientation: Color;
	readonly turn: Color;
	readonly selected: Square | null;
	readonly lastMove: ReadonlyDeep<Move> | null;
	readonly theme: ReadonlyDeep<Theme>;
}

// Dirty layer flags for precise invalidation.
// Use bitmask to allow combining layers; renderer/scheduler will interpret these.
export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Coords = 2, // 1 << 1,
	LastMove = 4, // 1 << 2,
	Highlights = 8, // 1 << 3,
	Arrows = 16, // 1 << 4,
	Pieces = 32, // 1 << 5,
	Drag = 64, // 1 << 6,
	Overlay = 128, // 1 << 7
	All = Board | Coords | LastMove | Highlights | Arrows | Pieces | Drag | Overlay
}

// Position map acceptance forms (public inputs)
// Long/canonical
export type PositionMap = Partial<Record<SquareString, Piece>>;
// Short/alias
export type PositionMapShort = Partial<Record<SquareString, PieceShort>>;
export type FEN = string; // Standard FEN string; validation/parsing happens in helpers (implemented elsewhere).
export type PositionInput = 'start' | FEN | PositionMap | PositionMapShort;
