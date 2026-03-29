export interface ReadonlyMutationSession<PayloadByCause extends Record<string, unknown>> {
	hasChanges(): boolean;

	hasMutation<Cause extends keyof PayloadByCause>(cause: Cause): boolean;

	getPayload<Cause extends keyof PayloadByCause>(cause: Cause): PayloadByCause[Cause] | undefined;
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

export interface MutationPipeline<Context, PayloadByCause extends Record<string, unknown>> {
	getSession(): MutationSession<PayloadByCause>;
	addMutation<Cause extends keyof PayloadByCause>(
		cause: Cause,
		changed: boolean,
		...payload: PayloadByCause[Cause] extends undefined ? [] : [payload: PayloadByCause[Cause]]
	): boolean;
	run(ctx: Context): boolean;
}
