export interface InteractionConfigDragLiftedActivation {
	thresholdPx: number;
}

export interface InteractionConfigDrag {
	liftedActivation: InteractionConfigDragLiftedActivation;
}

export interface InteractionConfig {
	drag: InteractionConfigDrag;
}
