import { assertNever } from '../../utils/assert-never';
import { toValidSquare } from './coords';
import type {
	Color,
	MoveDestination,
	MoveDestinationInput,
	MoveInput,
	NormalizedMoveInput,
	Role
} from './types';

/**
 * Normalize color inputs to canonical long names.
 * Accepts: 'white' | 'black' | 'w' | 'b'
 * Returns: 'white' | 'black'
 */
export function normalizeColor(input: string): Color {
	switch (input) {
		case 'white':
		case 'black':
			return input;
		case 'w':
			return 'white';
		case 'b':
			return 'black';
		default:
			assertNever(RangeError, `Invalid color input`, input);
	}
}

/**
 * Normalize role inputs to canonical long names.
 * Accepts:
 *  - Long: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
 *  - Short (single-case policy aligned with PGN letters): 'p' | 'N' | 'B' | 'R' | 'Q' | 'K'
 * Returns: long canonical role
 */
export function normalizeRole(input: string): Role {
	if (isRole(input)) return input;

	switch (input) {
		case 'p':
			return 'pawn';
		case 'N':
			return 'knight';
		case 'B':
			return 'bishop';
		case 'R':
			return 'rook';
		case 'Q':
			return 'queen';
		case 'K':
			return 'king';
		default:
			assertNever(RangeError, `Invalid role input`, input);
	}
}

function isRole(r: unknown): r is Role {
	return (
		r === 'pawn' ||
		r === 'knight' ||
		r === 'bishop' ||
		r === 'rook' ||
		r === 'queen' ||
		r === 'king'
	);
}

export function normalizeMoveInput(move: MoveInput): NormalizedMoveInput {
	return {
		from: toValidSquare(move.from),
		...normalizeMoveDestinationInput(move)
	};
}

export function normalizeMoveDestinationInput(destination: MoveDestinationInput): MoveDestination {
	return {
		to: toValidSquare(destination.to),
		...(destination.capturedSquare && {
			capturedSquare: toValidSquare(destination.capturedSquare)
		}),
		...(destination.secondary && {
			secondary: {
				from: toValidSquare(destination.secondary.from),
				to: toValidSquare(destination.secondary.to)
			}
		})
	};
}
