import { SvgRendererBoard } from '../board/types';
import { SvgRendererSlotRoots } from './extension';

export interface SvgRendererInstanceInternal {
	board: SvgRendererBoard;
	slotRoots: SvgRendererSlotRoots | null;
}
