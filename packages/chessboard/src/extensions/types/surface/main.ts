import type { ExtensionInvalidationState } from '../../invalidation/types.js';
import type { ExtensionAnimationController } from '../basic/animation.js';
import type { ExtensionRuntimeSurfaceCommands } from './commands.js';
import type { ExtensionRuntimeSurfaceEvents } from './events.js';
import type { ExtensionRuntimeSurfaceTransientVisuals } from './transient-visuals.js';

export interface ExtensionRuntimeSurface {
	readonly commands: ExtensionRuntimeSurfaceCommands;
	readonly animation: ExtensionAnimationController;
	readonly events: ExtensionRuntimeSurfaceEvents;
	readonly transientVisuals: ExtensionRuntimeSurfaceTransientVisuals;
	readonly invalidation: ExtensionInvalidationState;
}
