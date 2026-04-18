import { ColorCode } from '../board/types/internal';
import type { ViewStateInternal } from './types/internal';

export function viewSetOrientation(state: ViewStateInternal, orientation: ColorCode): boolean {
	if (state.orientation === orientation) return false; // no-op
	state.orientation = orientation;
	return true;
}
