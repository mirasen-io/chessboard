import { ColorShort, RolePromotionShort } from '../../../../state/board/types/input.js';
import { OpaqueColor } from '../../common/types.js';
import { PieceUrlsPublic } from '../../main-renderer/types/public.js';

export type PromotionPieceString = `${ColorShort}${RolePromotionShort}`;
export type PromotionPieceUrlsInput = Pick<PieceUrlsPublic, PromotionPieceString>;

export interface PromotionInitConfig {
	squareColor?: OpaqueColor;
	hoverColor?: OpaqueColor;
	pieceUrls?: PromotionPieceUrlsInput;
}
