import { createMutationSession } from './session';
import type { MutationPipe, MutationPipeline } from './types';

export function createMutationPipeline<PayloadByCause extends Record<string, unknown>, Context>(
	pipes: readonly MutationPipe<PayloadByCause, Context>[]
): MutationPipeline<PayloadByCause, Context> {
	const registeredPipes: MutationPipe<PayloadByCause, Context>[] = [...pipes] as const;
	const session = createMutationSession<PayloadByCause>();
	let isRunning = false;

	return {
		getSession() {
			return session;
		},

		addMutation(cause, changed, ...payload) {
			return session.addMutation(cause, changed, ...payload);
		},

		run(ctx) {
			if (isRunning) {
				throw new Error('Cannot run mutation pipeline recursively');
			}
			isRunning = true;
			// no-op if no mutations recorded
			if (!session.hasMutation()) {
				isRunning = false;
				return false;
			}
			try {
				for (const pipe of registeredPipes) {
					pipe(ctx, session);
				}
			} finally {
				// Clear session even if a pipe throws
				session.clear();
				isRunning = false;
			}
			return true;
		}
	};
}
