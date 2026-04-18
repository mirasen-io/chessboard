import {
	ExtensionAnimationSessionInternalSurface,
	ExtensionAnimationSessionStatus
} from '../types/basic/animation';

export interface ExtensionAnimationSessionInternal {
	readonly id: number;
	readonly startTime: DOMHighResTimeStamp;
	readonly duration: number;
	status: ExtensionAnimationSessionStatus;
	pendingCleanup: boolean;
}

export interface ExtensionAnimationControllerInternal {
	readonly sessions: Map<number, ExtensionAnimationSessionInternalSurface>;
}
