import { PieceString, RolePromotionShort, SquareString } from './input.js';
import { TMove, TMoveBase, TMoveCaptured } from './template.js';

export type MoveBaseOutput = TMoveBase<SquareString, PieceString>;
export type MoveCapturedOutput = TMoveCaptured<SquareString, PieceString>;
export type MoveOutput = TMove<SquareString, PieceString, RolePromotionShort>;
