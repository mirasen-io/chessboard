/**
 * Core public types for the chessboard state layer.
 * - Public-facing types use readable names (Color/Role long names).
 * - Inputs may accept short aliases; normalization happens in helpers (implemented elsewhere).
 * - Internals use numeric squares (0..63) and compact encodings; those details are hidden from consumers.
 */

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

export type SquareInput = Square | SquareString;

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

/**
 * Internal mutable board state used by reducers/runtime.
 * Not intended as a renderer- or consumer-facing contract.
 */
export interface BoardStateInternal {
	pieces: Uint8Array;
	ids: Int16Array;
	turn: Color;

	nextId: number;
	positionEpoch: number;
}

/**
 * State snapshot shape exposed to consumers. Contains only board-owned fields; view state is separate.
 */
export interface BoardStateSnapshot {
	readonly pieces: Readonly<Uint8Array>;
	readonly ids: Readonly<Int16Array>;
	readonly turn: Color;
	readonly positionEpoch: number;
}

// Position map acceptance forms (public inputs)
// Long/canonical
export type PositionMap = Partial<Record<SquareString, Piece>>;
// Short/alias
export type PositionMapShort = Partial<Record<SquareString, PieceShort>>;
export type FEN = string; // Standard FEN string; validation/parsing happens in helpers (implemented elsewhere).
export type PositionInput = 'start' | FEN | PositionMap | PositionMapShort;
