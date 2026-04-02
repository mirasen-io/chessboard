import type { MutationSession } from './types';

export function createMutationSession<
	PayloadByCause extends Record<string, unknown>
>(): MutationSession<PayloadByCause> {
	type MutationCause = keyof PayloadByCause;
	type MutationPayloads = PayloadByCause[MutationCause];
	const payloads = new Map<MutationCause, MutationPayloads[] | undefined>();

	return {
		addMutation(cause, changed, ...payload): boolean {
			if (!changed) {
				return false;
			}

			const hasPayload = payload.length > 0;
			if (payloads.has(cause)) {
				// We already have this cause recorded, just append payload if provided
				if (!hasPayload) return true;
				// We already have some payloads for this cause
				const existingPayloads = payloads.get(cause);
				if (existingPayloads) {
					existingPayloads.push(payload[0] as MutationPayloads);
					return true;
				}
				payloads.set(cause, [payload[0] as MutationPayloads]);
				return true;
			}

			// No existing entry for this cause, add new one
			payloads.set(cause, hasPayload ? [payload[0] as MutationPayloads] : undefined);
			return true;
		},

		hasChanges() {
			return payloads.size > 0;
		},

		hasMutation(cause) {
			return payloads.has(cause);
		},

		getPayloads(cause) {
			return payloads.get(cause) as PayloadByCause[typeof cause][] | undefined;
		},

		clear() {
			payloads.clear();
		},

		getSnapshot() {
			return {
				hasChanges: this.hasChanges,
				hasMutation: this.hasMutation,
				getPayloads: this.getPayloads
			};
		}
	};
}
