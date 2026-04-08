import { ExtensionAnimationSessionInternalSurface, ExtensionAnimationStatus } from '../types';

export interface ExtensionAnimationSessionInternal {
	readonly id: string;
	readonly startTime: DOMHighResTimeStamp;
	readonly duration: DOMHighResTimeStamp;
	data: unknown;
	status: ExtensionAnimationStatus;
}

export interface ExtensionAnimationControllerInternal {
	readonly sessions: Map<string, ExtensionAnimationSessionInternalSurface>;
}
