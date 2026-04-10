import { normalizeColor } from '../board/normalize';
import type { ColorInput } from '../board/types';
import type { ViewStateInternal } from './types';

export function viewSetOrientation(state: ViewStateInternal, c: ColorInput): boolean {
	const newOrient = normalizeColor(c);
	if (state.orientation === newOrient) return false; // no-op
	state.orientation = newOrient;
	return true;
}
