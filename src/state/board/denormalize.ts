import { isValidSquare } from './check';
import { fileOf, rankOf } from './coords';
import { fromPieceCode } from './piece';
import {
	ColorShort,
	FileChar,
	PieceString,
	RankChar,
	RolePromotionShort,
	RoleShort,
	SquareString
} from './types/input';
import {
	ColorCode,
	FILE_START,
	Move,
	MoveBase,
	MoveCaptured,
	NonEmptyPieceCode,
	RANK_START,
	RoleCode,
	RolePromotionCode,
	Square
} from './types/internal';
import { MoveBaseOutput, MoveCapturedOutput, MoveOutput } from './types/output';

export function denormalizeSquare(sq: Square): SquareString {
	if (!isValidSquare(sq)) {
		throw new RangeError(`Invalid square index: ${sq}`);
	}
	const file = fileOf(sq) as number;
	const rank = rankOf(sq) as number;
	const f = String.fromCharCode(FILE_START + file) as FileChar;
	const r = String.fromCharCode(RANK_START + rank) as RankChar;
	return `${f}${r}`;
}

export function denormalizeColorShort(color: ColorCode): ColorShort {
	switch (color) {
		case ColorCode.White:
			return 'w';
		case ColorCode.Black:
			return 'b';
		default:
			throw new RangeError(`Invalid color code: ${color}`);
	}
}

export function denormalizeRoleShort(role: RoleCode): RoleShort {
	switch (role) {
		case RoleCode.Pawn:
			return 'P';
		case RoleCode.King:
			return 'K';
		case RoleCode.Knight:
			return 'N';
		case RoleCode.Bishop:
			return 'B';
		case RoleCode.Rook:
			return 'R';
		case RoleCode.Queen:
			return 'Q';
		default:
			throw new RangeError(`Invalid role code: ${role}`);
	}
}

export function denormalizeRolePromotionShort(role: RolePromotionCode): RolePromotionShort {
	const roleShort = denormalizeRoleShort(role);
	if (roleShort === 'K' || roleShort === 'P') {
		throw new RangeError(`Invalid role for promotion: ${role}`);
	}
	return roleShort as RolePromotionShort;
}

export function denormalizePieceString(code: NonEmptyPieceCode): PieceString {
	const piece = fromPieceCode(code);
	const colorPrefix = denormalizeColorShort(piece.color);
	const roleStr = denormalizeRoleShort(piece.role);
	return `${colorPrefix}${roleStr}`;
}

export function denormalizeMoveBase(move: MoveBase): MoveBaseOutput {
	return {
		from: denormalizeSquare(move.from),
		to: denormalizeSquare(move.to),
		piece: denormalizePieceString(move.piece)
	};
}

export function denormalizeMoveCaptured(captured: MoveCaptured): MoveCapturedOutput {
	return {
		square: denormalizeSquare(captured.square),
		piece: denormalizePieceString(captured.piece)
	};
}

export function denormalizeMove(move: Move): MoveOutput {
	const baseMove = denormalizeMoveBase(move);
	return {
		...baseMove,
		...(move.promotedTo ? { promotedTo: denormalizeRolePromotionShort(move.promotedTo) } : {}),
		...(move.captured ? { captured: denormalizeMoveCaptured(move.captured) } : {}),
		...(move.secondary ? { secondary: denormalizeMoveBase(move.secondary) } : {})
	};
}
