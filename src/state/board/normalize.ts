import { isPieceString, isRolePromotionCode, isValidSquare } from './check';
import {
	ColorInput,
	ColorShort,
	MoveRequestInput,
	PieceInput,
	RoleInput,
	RolePromotionInput,
	RoleShort,
	SquareString
} from './types/input';
import {
	ColorCode,
	FILE_START,
	MoveRequest,
	PieceCode,
	RANK_START,
	RoleCode,
	RolePromotionCode,
	Square
} from './types/internal';

export function normalizeColor(input: ColorInput): ColorCode {
	switch (input) {
		case 'white':
		case 'w':
			return ColorCode.White;
		case 'black':
		case 'b':
			return ColorCode.Black;
		default:
			throw new RangeError(`Invalid color input: ${input}`);
	}
}

export function normalizeRole(input: RoleInput): RoleCode {
	switch (input) {
		case 'P':
		case 'pawn':
			return RoleCode.Pawn;
		case 'N':
		case 'knight':
			return RoleCode.Knight;
		case 'B':
		case 'bishop':
			return RoleCode.Bishop;
		case 'R':
		case 'rook':
			return RoleCode.Rook;
		case 'Q':
		case 'queen':
			return RoleCode.Queen;
		case 'K':
		case 'king':
			return RoleCode.King;
		default:
			throw new RangeError(`Invalid role input: ${input}`);
	}
}

export function normalizePiece(input: PieceInput): PieceCode {
	const [color, role] = isPieceString(input)
		? [input[0] as ColorShort, input[1] as RoleShort]
		: [input.color, input.role];
	const colorCode = normalizeColor(color);
	const roleCode = normalizeRole(role);
	return colorCode + roleCode;
}

export function normalizeRolePromotion(input: RolePromotionInput): RolePromotionCode {
	const role = normalizeRole(input);
	if (!isRolePromotionCode(role)) {
		throw new RangeError(`Invalid role promotion input (cannot promote to ${role}): ${input}`);
	}
	return role;
}

export function normalizeSquare(s: SquareString): Square {
	const file = Math.trunc(s.charCodeAt(0) - FILE_START);
	const rank = Math.trunc(s.charCodeAt(1) - RANK_START);
	const sq = Math.trunc(rank * 8 + file);
	if (!isValidSquare(sq)) {
		throw new TypeError(`Invalid algebraic square: ${s}`);
	}
	return sq;
}

export function normalizeMoveRequest(move: MoveRequestInput): MoveRequest {
	return {
		from: normalizeSquare(move.from),
		to: normalizeSquare(move.to),
		...(move.capturedSquare && { capturedSquare: normalizeSquare(move.capturedSquare) }),
		...(move.promotedTo && { promotedTo: normalizeRolePromotion(move.promotedTo) }),
		...(move.secondary && {
			secondary: {
				from: normalizeSquare(move.secondary.from),
				to: normalizeSquare(move.secondary.to)
			}
		})
	};
}
