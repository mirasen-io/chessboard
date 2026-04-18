import { TMoveRequest } from './template';

export type Color = 'white' | 'black';
export type ColorShort = 'w' | 'b';
export type ColorInput = Color | ColorShort;

export type Role = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type RoleShort = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type RoleInput = Role | RoleShort;
export type RolePromotion = Exclude<Role, 'king' | 'pawn'>;
export type RolePromotionShort = Exclude<RoleShort, 'P' | 'K'>;
export type RolePromotionInput = RolePromotion | RolePromotionShort;

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
export type PieceString = `${ColorShort}${RoleShort}`;
export type PieceInput = Piece | PieceShort | PieceString;

export type PiecePositionRecord = Partial<Record<SquareString, Piece>>;
export type PiecePositionRecordShort = Partial<Record<SquareString, PieceShort>>;
export type PiecePositionRecordString = Partial<Record<SquareString, PieceString>>;
export type PiecePositionInputRecord =
	| PiecePositionRecord
	| PiecePositionRecordShort
	| PiecePositionRecordString;
export type PiecePositionInput = 'start' | PiecePositionInputRecord;

export type PositionInputObject = {
	pieces?: PiecePositionInput;
	turn?: ColorInput;
};
export type FenString = string;
export type PositionInput = 'start' | PositionInputObject | FenString;

export type MoveRequestInput = TMoveRequest<SquareString, RolePromotionInput>;
