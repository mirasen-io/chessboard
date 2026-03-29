import type { MutationSession } from './types';

export function createMutationSession<
	PayloadByCause extends Record<string, unknown>
>(): MutationSession<PayloadByCause> {
	type MutationCause = keyof PayloadByCause;
	type MutationPayloads = PayloadByCause[MutationCause];
	const payloads = new Map<MutationCause, MutationPayloads | undefined>();

	return {
		addMutation<Cause extends keyof PayloadByCause>(
			cause: Cause,
			changed: boolean,
			...payload: PayloadByCause[Cause] extends undefined ? [] : [payload: PayloadByCause[Cause]]
		): boolean {
			if (!changed) {
				return false;
			}

			// For now we throw an error for the same cause, this could be indicator that something is wrong in the caller's logic
			if (payloads.has(cause)) {
				throw new Error(`Mutation for cause "${String(cause)}" already exists in the session.`);
			}

			const inPayload = payload.length > 0 ? payload[0] : undefined;
			payloads.set(cause, inPayload);

			return true;
		},

		hasChanges(): boolean {
			return payloads.size > 0;
		},

		hasMutation<Cause extends keyof PayloadByCause>(cause: Cause): boolean {
			return payloads.has(cause);
		},

		getPayload<Cause extends keyof PayloadByCause>(
			cause: Cause
		): PayloadByCause[Cause] | undefined {
			return payloads.get(cause) as PayloadByCause[Cause] | undefined;
		},

		clear(): void {
			payloads.clear();
		}
	};
}
