export type Pipe<Context, Cause extends string> = (
	ctx: Context,
	causes: ReadonlySet<Cause>,
	addMutation: (cause: Cause, changed: boolean) => void
) => void;

export interface Pipeline<Context, Cause extends string> {
	addMutation(cause: Cause, changed: boolean): void;
	run(ctx: Context): boolean;
}

export interface PipelineSession<Cause extends string> {
	addMutation(cause: Cause, changed: boolean): void;
	hasChanges(): boolean;
	getCauses(): ReadonlySet<Cause>;
	clear(): void;
}
