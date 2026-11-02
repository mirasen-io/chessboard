export type RenderCallback = () => void;

export interface SchedulerOptions {
	render: RenderCallback;
}

export interface Scheduler {
	/** Request a render; multiple calls before the next frame coalesce into one. */
	schedule(): void;
	/** Flush immediately (synchronous), useful for deterministic tests or SSR. */
	flushNow(): void;
	/** Cancel any pending frame. */
	cancel(): void;
}
