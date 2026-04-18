import { ColorCode, NonEmptyPieceCode, PieceCode, PieceCoded, RoleCode } from './types/internal';

export function toPieceCode(role: RoleCode, color: ColorCode): PieceCode {
	return color + role;
}

export function fromPieceCode(code: NonEmptyPieceCode): PieceCoded {
	if (code <= PieceCode.Empty) {
		throw new RangeError(`Invalid piece code: ${code}`);
	}
	const color = code >= ColorCode.Black ? ColorCode.Black : ColorCode.White;
	const role = color === ColorCode.Black ? code - ColorCode.Black : code;
	return { role: role as RoleCode, color };
}
