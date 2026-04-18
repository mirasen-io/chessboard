import type { ReadonlyDeep } from 'type-fest';
import { ColorCode } from '../../board/types/internal';

export interface ViewStateInternal {
	orientation: ColorCode;
}

export type ViewStateSnapshot = ReadonlyDeep<ViewStateInternal>;
