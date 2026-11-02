export interface ExtensionRuntimeSurfaceEvents {
	subscribeEvent<K extends keyof HTMLElementEventMap>(type: K): void;
	unsubscribeEvent<K extends keyof HTMLElementEventMap>(type: K): void;
}
