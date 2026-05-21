export interface InteractionConfigDragLiftedActivation {
	readonly thresholdPx: number;
}

export interface InteractionConfigDrag {
	readonly liftedActivation: InteractionConfigDragLiftedActivation;
}

export interface InteractionConfig {
	readonly drag: InteractionConfigDrag;
}
