import { PieceString, RolePromotionShort, SquareString } from './input';
import { TMove, TMoveBase, TMoveCaptured } from './template';

export type MoveBaseOutput = TMoveBase<SquareString, PieceString>;
export type MoveCapturedOutput = TMoveCaptured<SquareString, PieceString>;
export type MoveOutput = TMove<SquareString, PieceString, RolePromotionShort>;
