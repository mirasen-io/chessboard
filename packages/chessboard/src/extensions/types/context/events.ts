import type { RuntimeInteractionAction, SceneEvent } from '../basic/events.js';

export interface ExtensionOnEventContext {
	rawEvent: Event;
	sceneEvent: SceneEvent | null; // null if the event has no scene meaning.
	runtimeInteractionActionPreview: RuntimeInteractionAction | null; // null if no runtime interaction action is previewed.
}
