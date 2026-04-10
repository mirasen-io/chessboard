import type { MutationSession, ReadonlyMutationSession } from './types';

export function createReadonlyMutationSession<PayloadByCause extends Record<string, unknown>>(
	payloads: ReadonlyMap<keyof PayloadByCause, PayloadByCause[keyof PayloadByCause][] | undefined>
): ReadonlyMutationSession<PayloadByCause> {
	return {
		hasChanges() {
			return payloads.size > 0;
		},
		hasMutation(causesOrPrefix) {
			if (typeof causesOrPrefix !== 'string') {
				for (const cause of causesOrPrefix) {
					if (payloads.has(cause)) {
						return true;
					}
				}
			} else {
				for (const key of payloads.keys()) {
					if (key.toString().startsWith(causesOrPrefix)) {
						return true;
					}
				}
			}

			return false;
		},
		getPayloads(cause) {
			return payloads.get(cause) as PayloadByCause[typeof cause][] | undefined;
		},
		getAll() {
			return new Map(payloads);
		}
	};
}

export function mergeReadonlySessions<PayloadByCause extends Record<string, unknown>>(
	sessions: ReadonlyMutationSession<PayloadByCause>[],
	causesOrPrefix?: Iterable<keyof PayloadByCause> | string
): ReadonlyMutationSession<PayloadByCause> {
	type MutationCause = keyof PayloadByCause;
	type MutationPayloads = PayloadByCause[MutationCause];

	const mergedPayloads = new Map<MutationCause, MutationPayloads[] | undefined>();
	const causeSet = typeof causesOrPrefix === 'string' ? null : new Set(causesOrPrefix);
	const causePrefix = typeof causesOrPrefix === 'string' ? causesOrPrefix : null;

	for (const session of sessions) {
		for (const [cause, payloads] of session.getAll()) {
			const shouldInclude =
				(!causeSet || causeSet.has(cause)) &&
				(!causePrefix || cause.toString().startsWith(causePrefix));
			if (!shouldInclude) {
				continue; // skip this cause as it's not in the filter set or doesn't match the prefix
			}
			if (payloads) {
				const existingPayloads = mergedPayloads.get(cause);
				if (existingPayloads) {
					existingPayloads.push(...payloads);
				} else {
					mergedPayloads.set(cause, [...payloads]);
				}
			} else {
				// If any session has a cause with undefined payloads, we treat it as a change with no payload
				if (!mergedPayloads.has(cause)) {
					mergedPayloads.set(cause, undefined);
				}
			}
		}
	}

	return createReadonlyMutationSession(mergedPayloads);
}

export function createMutationSession<
	PayloadByCause extends Record<string, unknown>
>(): MutationSession<PayloadByCause> {
	type MutationCause = keyof PayloadByCause;
	type MutationPayloads = PayloadByCause[MutationCause];

	const payloads = new Map<MutationCause, MutationPayloads[] | undefined>();
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

		clear() {
			payloads.clear();
		}
	};
}
