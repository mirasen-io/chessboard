import { createMutationSession } from './session';
import type { MutationPipe, MutationPipeline } from './types';

export function createMutationPipeline<PayloadByCause extends Record<string, unknown>, Context>(
	pipes: readonly MutationPipe<PayloadByCause, Context>[]
): MutationPipeline<PayloadByCause, Context> {
	const registeredPipes: MutationPipe<PayloadByCause, Context>[] = [...pipes] as const;
	const session = createMutationSession<PayloadByCause>();

	return {
		getSession() {
			return session;
		},

		addMutation<Cause extends keyof PayloadByCause>(
			cause: Cause,
			changed: boolean,
			...payload: PayloadByCause[Cause] extends undefined ? [] : [payload: PayloadByCause[Cause]]
		): boolean {
			return session.addMutation(cause, changed, ...payload);
		},

		run(ctx: Context): boolean {
			// no-op if no mutations recorded
			if (!session.hasChanges()) return false;
			try {
				for (const pipe of registeredPipes) {
					pipe(ctx, session);
				}
			} finally {
				// Clear session even if a pipe throws
				session.clear();
			}
			return true;
		}
	};
}
