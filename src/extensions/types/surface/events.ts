import { SceneEventType } from '../basic/events';

export interface ExtensionRuntimeSurfaceEvents {
	subscribe(events: Iterable<SceneEventType>): void;
	unsubscribe(events?: Iterable<SceneEventType>): void;
}
