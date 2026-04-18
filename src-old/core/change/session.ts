import type { PipelineSession } from './types';

export function createPipelineSession<Cause extends string>(): PipelineSession<Cause> {
	const causes = new Set<Cause>();

	return {
		addMutation(cause: Cause, changed: boolean): boolean {
			if (changed) {
				causes.add(cause);
			}
			return changed;
		},
		hasChanges(): boolean {
			return causes.size > 0;
		},
		getCauses(): ReadonlySet<Cause> {
			return causes;
		},
		clear(): void {
			causes.clear();
		}
	};
}
