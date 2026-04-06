import { ReadonlyDeep } from 'type-fest';
import type { MutationSession } from '../../mutation/types';
import { BoardPoint } from './types';

export type VisualsStateMutationPayloadByCause = {
	'visuals.state.setDragPointer': ReadonlyDeep<BoardPoint> | null;
};

export type VisualsStateMutationCause = keyof VisualsStateMutationPayloadByCause;

export type VisualsStateMutationSession = MutationSession<VisualsStateMutationPayloadByCause>;
