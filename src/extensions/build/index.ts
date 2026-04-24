export {
	clearElementChildren,
	createSvgElement,
	updateElementAttributes
} from '../../render/svg/helpers.js';
export type { RuntimeReadonlyMutationSession } from '../../runtime/mutation/types.js';
export { isNonEmptyPieceCode } from '../../state/board/check.js';
export { fileOf, rankOf, squareOf } from '../../state/board/coords.js';
export { denormalizeMove } from '../../state/board/denormalize.js';
export { normalizePiece } from '../../state/board/normalize.js';
export { fromPieceCode, toPieceCode } from '../../state/board/piece.js';
export type {
	ColorCode,
	EmptyPieceCode,
	NonEmptyPieceCode,
	PieceCode,
	RoleCode,
	RolePromotionCode,
	Square,
	SquareFile,
	SquareRank
} from '../../state/board/types/internal.js';
export type { MoveOutput } from '../../state/board/types/output.js';
export type { MovabilityModeCode } from '../../state/interaction/types/internal.js';
export {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionIsDestroyedBase,
	extensionIsMountedBase,
	extensionMountBase,
	extensionUnmountBase
} from '../first-party/common/helpers.js';
export type { ExtensionInternalBase, OpaqueColor } from '../first-party/common/types.js';
export type { PieceUrlsInput } from '../first-party/main-renderer/types/input.js';
export type { PieceUrls } from '../first-party/main-renderer/types/internal.js';
export type { PromotionPieceCode } from '../first-party/promotion/types/internal.js';
export type { ExtensionSlotName, ExtensionSlotSvgRoots } from '../types/basic/mount.js';
export { isFrameMounted, isFrameRenderable } from '../types/basic/update.js';
export type { UpdateFrameSnapshot } from '../types/basic/update.js';
export { isUpdateContextMounted, isUpdateContextRenderable } from '../types/context/update.js';
export type {
	ExtensionCreateInstanceOptions,
	ExtensionDefinition,
	ExtensionInstance
} from '../types/extension.js';
export type { ExtensionRuntimeSurface } from '../types/surface/main.js';
