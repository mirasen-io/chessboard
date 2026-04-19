import { SceneEventType } from '../basic/events.js';

export interface ExtensionRuntimeSurfaceEvents {
	subscribe(events: Iterable<SceneEventType>): void;
	unsubscribe(events?: Iterable<SceneEventType>): void;
}
