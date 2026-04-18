import type {
	MutationCause,
	MutationPayload,
	MutationSession,
	ReadonlyMutationSession
} from './types';

export function createReadonlyMutationSession<PayloadByCause extends Record<string, unknown>>(
	payloads: ReadonlyMap<
		MutationCause<PayloadByCause>,
		PayloadByCause[MutationCause<PayloadByCause>][] | undefined
	>,
	clone: boolean = false
): ReadonlyMutationSession<PayloadByCause> {
	const internalPayloads = clone ? new Map(payloads) : payloads;
	return {
		hasMutation(match) {
			if (!match) {
				return internalPayloads.size > 0;
			}

			const { causes, prefixes } = match;

			if (causes) {
				for (const cause of causes) {
					if (internalPayloads.has(cause)) {
						return true;
					}
				}
			}

			if (prefixes) {
				for (const prefix of prefixes) {
					for (const cause of internalPayloads.keys()) {
						if (cause.toString().startsWith(prefix.toString())) {
							return true;
						}
					}
				}
			}

			return false;
		},

		getPayloads(cause) {
			return internalPayloads.get(cause) as PayloadByCause[typeof cause][] | undefined;
		},

		getAll<TargetPayloadByCause extends PayloadByCause>() {
			return new Map(internalPayloads) as ReadonlyMap<
				MutationCause<TargetPayloadByCause>,
				TargetPayloadByCause[MutationCause<TargetPayloadByCause>][] | undefined
			>;
		}
	};
}

export function createMutationSession<
	PayloadByCause extends Record<string, unknown>
>(): MutationSession<PayloadByCause> {
	type _MutationCause = MutationCause<PayloadByCause>;
	type _MutationPayload = MutationPayload<PayloadByCause>;

	const payloads = new Map<_MutationCause, _MutationPayload[] | undefined>();
	const readonlySnapshot = createReadonlyMutationSession(payloads);

	return {
		...readonlySnapshot,
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
					existingPayloads.push(payload[0] as _MutationPayload);
					return true;
				}
				payloads.set(cause, [payload[0] as _MutationPayload]);
				return true;
			}

			// No existing entry for this cause, add new one
			payloads.set(cause, hasPayload ? [payload[0] as _MutationPayload] : undefined);
			return true;
		},

		clear() {
			payloads.clear();
		}
	};
}
