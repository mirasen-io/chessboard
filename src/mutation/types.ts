export type MutationCause<PayloadByCause extends Record<string, unknown>> = Extract<
	keyof PayloadByCause,
	string
>;

export type MutationPayload<PayloadByCause extends Record<string, unknown>> =
	PayloadByCause[MutationCause<PayloadByCause>];

type Prefixes<S extends string> = S extends `${infer Head}.${infer Tail}`
	? Head | `${Head}.${Prefixes<Tail>}`
	: never;

type DotSuffix<T extends string> = `${T}.`;

type DottedPrefixes<S extends string> = DotSuffix<Prefixes<S>>;

export type MutationCausePrefixes<PayloadByCause extends Record<string, unknown>> = DottedPrefixes<
	MutationCause<PayloadByCause>
>;

export interface MutationCauseMatchFilter<PayloadByCause extends Record<string, unknown>> {
	causes?: Iterable<MutationCause<PayloadByCause>>;
	prefixes?: Iterable<MutationCausePrefixes<PayloadByCause>>;
}

export interface ReadonlyMutationSession<PayloadByCause extends Record<string, unknown>> {
	hasMutation(match?: MutationCauseMatchFilter<PayloadByCause>): boolean;

	getPayloads<Cause extends MutationCause<PayloadByCause>>(
		cause: Cause
	): PayloadByCause[Cause][] | undefined;

	getAll<TargetPayloadByCause extends PayloadByCause>(): ReadonlyMap<
		MutationCause<TargetPayloadByCause>,
		TargetPayloadByCause[MutationCause<TargetPayloadByCause>][] | undefined
	>;
}

export interface MutationSession<
	PayloadByCause extends Record<string, unknown>
> extends ReadonlyMutationSession<PayloadByCause> {
	addMutation<Cause extends MutationCause<PayloadByCause>>(
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
	addMutation<Cause extends MutationCause<PayloadByCause>>(
		cause: Cause,
		changed: boolean,
		...payload: PayloadByCause[Cause] extends undefined ? [] : [payload: PayloadByCause[Cause]]
	): boolean;
	run(ctx: Context): boolean;
}
