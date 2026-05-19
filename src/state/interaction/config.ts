import assert from '@ktarmyshov/assert';
import { toMerged } from 'es-toolkit/object';
import { isEqual } from 'es-toolkit/predicate';
import type { InteractionConfig } from './types/config.js';
import type { InteractionConfigInput } from './types/input.js';

export const DefaultInteractionDesktopConfig: InteractionConfig = {
	drag: {
		liftedActivation: {
			thresholdPx: 0
		}
	}
};

export const DefaultInteractionMobileConfig: InteractionConfig = {
	drag: {
		liftedActivation: {
			thresholdPx: 3
		}
	}
};

function validateInteractionConfig(config: InteractionConfig): void {
	const { thresholdPx } = config.drag.liftedActivation;
	assert(Number.isFinite(thresholdPx), 'drag.liftedActivation.thresholdPx must be a finite number');
	assert(thresholdPx >= 0, 'drag.liftedActivation.thresholdPx must be >= 0');
}

export function normalizeInteractionConfig(
	input: InteractionConfigInput | undefined,
	base: InteractionConfig
): InteractionConfig {
	const merged = toMerged(base, input ?? {}) as InteractionConfig;
	validateInteractionConfig(merged);
	return merged;
}

export function areInteractionConfigsEqual(a: InteractionConfig, b: InteractionConfig): boolean {
	return isEqual(a, b);
}
