import { ColorShort, RolePromotionShort } from '../../../../state/board/types/input.js';
import { OpaqueColor } from '../../common/types.js';
import { PieceUrlsInput } from '../../main-renderer/types/input.js';

export type PromotionPieceString = `${ColorShort}${RolePromotionShort}`;
export type PromotionPieceUrlsInput = Pick<PieceUrlsInput, PromotionPieceString>;

export interface PromotionInitConfig {
	squareColor?: OpaqueColor;
	hoverColor?: OpaqueColor;
	pieceUrls?: PromotionPieceUrlsInput;
}
