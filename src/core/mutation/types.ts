export interface ReadonlyMutationSession<PayloadByCause extends Record<string, unknown>> {
	hasChanges(): boolean;

	hasMutation<Cause extends keyof PayloadByCause>(
		causesOrPrefix: Iterable<Cause> | string
	): boolean;

	getPayloads<Cause extends keyof PayloadByCause>(
		cause: Cause
	): PayloadByCause[Cause][] | undefined;

	getAll(): ReadonlyMap<keyof PayloadByCause, PayloadByCause[keyof PayloadByCause][] | undefined>;
}

export interface MutationSession<
	PayloadByCause extends Record<string, unknown>
> extends ReadonlyMutationSession<PayloadByCause> {
	addMutation<Cause extends keyof PayloadByCause>(
		cause: Cause,
		changed: boolean,
		...payload: PayloadByCause[Cause] extends undefined ? [] : [payload: PayloadByCause[Cause]]
	): boolean;

	clear(): void;
}

export type MutationPipe<PayloadByCause extends Record<string, unknown>, Context> = (
	ctx: Context,
	mutationSession: MutationSession<PayloadByCause>
) => void;

export interface MutationPipeline<PayloadByCause extends Record<string, unknown>, Context> {
	getSession(): MutationSession<PayloadByCause>;
	addMutation<Cause extends keyof PayloadByCause>(
		cause: Cause,
		changed: boolean,
		...payload: PayloadByCause[Cause] extends undefined ? [] : [payload: PayloadByCause[Cause]]
	): boolean;
	run(ctx: Context): boolean;
}
