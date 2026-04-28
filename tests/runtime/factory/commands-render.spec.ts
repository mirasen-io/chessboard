import { describe, expect, it } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';

function createTestRuntime() {
	return createRuntime({ doc: document });
}

describe('runtime requestRender command', () => {
	it('throws when requesting state render on unmounted runtime (not renderable)', () => {
		const runtime = createTestRuntime();
		expect(() => runtime.requestRender({ state: true })).toThrow();
	});

	it('does not throw when request has no state field', () => {
		const runtime = createTestRuntime();
		expect(() => runtime.requestRender({})).not.toThrow();
	});

	it('does not throw when request.state is false', () => {
		const runtime = createTestRuntime();
		expect(() => runtime.requestRender({ state: false })).not.toThrow();
	});
});
