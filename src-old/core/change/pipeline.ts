import { createPipelineSession } from './session';
import type { Pipe, Pipeline } from './types';

export function createPipeline<Context, Cause extends string>(
	pipes: readonly Pipe<Context, Cause>[]
): Pipeline<Context, Cause> {
	const registeredPipes: Pipe<Context, Cause>[] = [...pipes] as const;
	const session = createPipelineSession<Cause>();

	return {
		addMutation(cause: Cause, changed: boolean): void {
			session.addMutation(cause, changed);
		},

		run(ctx: Context): boolean {
			// no-op if no mutations recorded
			if (!session.hasChanges()) return false;
			try {
				const causes = session.getCauses();
				const addMutation = (cause: Cause, changed: boolean): void => {
					session.addMutation(cause, changed);
				};
				for (const pipe of registeredPipes) {
					pipe(ctx, causes, addMutation);
				}
			} finally {
				// Clear session even if a pipe throws
				session.clear();
			}
			return true;
		}
	};
}
