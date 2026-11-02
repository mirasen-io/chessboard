export interface ExtensionInvalidationStateInternal {
	dirtyLayers: number; // bitfield of Layer values
}

export interface ExtensionReadonlyInvalidationState {
	readonly dirtyLayers: number; // bitfield of Layer values
}

export interface ExtensionInvalidationState extends ExtensionReadonlyInvalidationState {
	markDirty(layers: number): void;
	clearDirty(layers: number): void;
	clear(): void;
}
