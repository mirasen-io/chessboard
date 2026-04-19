import { SceneEvent } from '../basic/events.js';

export interface ExtensionOnEventContext {
	rawEvent: Event;
	sceneEvent: SceneEvent | null; // null if event has no scene meaning (e.g. keyboard event)
}
