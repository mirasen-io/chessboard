import type { ReadonlyDeep } from 'type-fest';
import { TMove, TMoveBase, TMoveCaptured, TMoveRequest, TMoveRequestBase } from './template';

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
export const SQUARE_COUNT = 64;

export type SquareFile = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SquareRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const enum RoleCode {
	Pawn = 1,
	Knight = 2,
	Bishop = 3,
	Rook = 4,
	Queen = 5,
	King = 6
}

export type RolePromotionCode = Exclude<RoleCode, RoleCode.King | RoleCode.Pawn>;

export const enum ColorCode {
	White = 0,
	Black = 8
}

export const enum PieceCode {
	Empty = 0,
	WhitePawn = RoleCode.Pawn,
	WhiteKnight = RoleCode.Knight,
	WhiteBishop = RoleCode.Bishop,
	WhiteRook = RoleCode.Rook,
	WhiteQueen = RoleCode.Queen,
	WhiteKing = RoleCode.King,
	BlackPawn = RoleCode.Pawn + ColorCode.Black,
	BlackKnight = RoleCode.Knight + ColorCode.Black,
	BlackBishop = RoleCode.Bishop + ColorCode.Black,
	BlackRook = RoleCode.Rook + ColorCode.Black,
	BlackQueen = RoleCode.Queen + ColorCode.Black,
	BlackKing = RoleCode.King + ColorCode.Black
}

export type EmptyPieceCode = Extract<PieceCode, PieceCode.Empty>;
export type NonEmptyPieceCode = Exclude<PieceCode, PieceCode.Empty>;

export const ALL_NON_EMPTY_PIECE_CODES: NonEmptyPieceCode[] = [
	PieceCode.WhitePawn,
	PieceCode.WhiteKnight,
	PieceCode.WhiteBishop,
	PieceCode.WhiteRook,
	PieceCode.WhiteQueen,
	PieceCode.WhiteKing,
	PieceCode.BlackPawn,
	PieceCode.BlackKnight,
	PieceCode.BlackBishop,
	PieceCode.BlackRook,
	PieceCode.BlackQueen,
	PieceCode.BlackKing
];

export interface PieceCoded {
	role: RoleCode;
	color: ColorCode;
}

export type MoveRequestBase = TMoveRequestBase<Square>;
export type MoveRequest = TMoveRequest<Square, RolePromotionCode>;
export type MoveBase = TMoveBase<Square, NonEmptyPieceCode>;
export type Move = TMove<Square, NonEmptyPieceCode, RolePromotionCode>;
export type MoveCaptured = TMoveCaptured<Square, NonEmptyPieceCode>;

export type MoveBaseSnapshot = ReadonlyDeep<MoveBase>;
export type MoveSnapshot = ReadonlyDeep<Move>;

export const FILE_START = 'a'.charCodeAt(0);
export const RANK_START = '1'.charCodeAt(0);

export type ParsedPosition = {
	pieces: Uint8Array;
	turn: ColorCode;
};
