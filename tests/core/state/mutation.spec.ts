import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/core/state/mutation/session';

describe('core/state/mutation', () => {
	describe('MutationSession', () => {
		it('addMutation with changed=false does not record anything, returns false', () => {
			type TestPayloadByCause = {
				'test-cause': { value: number };
			};
			const session = createMutationSession<TestPayloadByCause>();

			const result = session.addMutation('test-cause', false, { value: 42 });

			expect(result).toBe(false);
			expect(session.hasMutation('test-cause')).toBe(false);
			expect(session.hasChanges()).toBe(false);
		});

		it('addMutation with changed=true records mutation, returns true', () => {
			type TestPayloadByCause = {
				'test-cause': { value: number };
			};
			const session = createMutationSession<TestPayloadByCause>();

			const result = session.addMutation('test-cause', true, { value: 42 });

			expect(result).toBe(true);
			expect(session.hasMutation('test-cause')).toBe(true);
			expect(session.hasChanges()).toBe(true);
		});

		it('hasMutation correctly reports presence of cause', () => {
			type TestPayloadByCause = {
				'cause-a': undefined;
				'cause-b': undefined;
			};
			const session = createMutationSession<TestPayloadByCause>();

			session.addMutation('cause-a', true);

			expect(session.hasMutation('cause-a')).toBe(true);
			expect(session.hasMutation('cause-b')).toBe(false);
		});

		it('getPayload retrieves recorded payload by cause', () => {
			type TestPayloadByCause = {
				'test-cause': { value: number };
			};
			const session = createMutationSession<TestPayloadByCause>();

			session.addMutation('test-cause', true, { value: 42 });

			const payload = session.getPayload('test-cause');
			expect(payload).toEqual({ value: 42 });
		});

		it('getPayload returns undefined for non-existent cause', () => {
			type TestPayloadByCause = {
				'test-cause': { value: number };
			};
			const session = createMutationSession<TestPayloadByCause>();

			const payload = session.getPayload('test-cause');
			expect(payload).toBeUndefined();
		});

		it('hasChanges correctly reports whether any mutations were recorded', () => {
			type TestPayloadByCause = {
				'test-cause': undefined;
			};
			const session = createMutationSession<TestPayloadByCause>();

			expect(session.hasChanges()).toBe(false);

			session.addMutation('test-cause', true);

			expect(session.hasChanges()).toBe(true);
		});

		it('addMutation with duplicate cause throws error', () => {
			type TestPayloadByCause = {
				'test-cause': undefined;
			};
			const session = createMutationSession<TestPayloadByCause>();

			session.addMutation('test-cause', true);

			expect(() => {
				session.addMutation('test-cause', true);
			}).toThrow('Mutation for cause "test-cause" already exists in the session');
		});

		it('clear removes all recorded mutations', () => {
			type TestPayloadByCause = {
				'cause-a': undefined;
				'cause-b': undefined;
			};
			const session = createMutationSession<TestPayloadByCause>();

			session.addMutation('cause-a', true);
			session.addMutation('cause-b', true);

			expect(session.hasChanges()).toBe(true);

			session.clear();

			expect(session.hasChanges()).toBe(false);
			expect(session.hasMutation('cause-a')).toBe(false);
			expect(session.hasMutation('cause-b')).toBe(false);
		});

		it('multiple mutations with different causes coexist in one session', () => {
			type TestPayloadByCause = {
				'cause-a': { valueA: number };
				'cause-b': { valueB: string };
				'cause-c': undefined;
			};
			const session = createMutationSession<TestPayloadByCause>();

			session.addMutation('cause-a', true, { valueA: 1 });
			session.addMutation('cause-b', true, { valueB: 'test' });
			session.addMutation('cause-c', true);

			expect(session.hasMutation('cause-a')).toBe(true);
			expect(session.hasMutation('cause-b')).toBe(true);
			expect(session.hasMutation('cause-c')).toBe(true);

			expect(session.getPayload('cause-a')).toEqual({ valueA: 1 });
			expect(session.getPayload('cause-b')).toEqual({ valueB: 'test' });
			expect(session.getPayload('cause-c')).toBeUndefined();
		});

		it('payload structure is preserved as provided', () => {
			type TestPayloadByCause = {
				'test-cause': { nested: { value: number }; arr: number[] };
			};
			const session = createMutationSession<TestPayloadByCause>();

			const payload = { nested: { value: 42 }, arr: [1, 2, 3] };
			session.addMutation('test-cause', true, payload);

			const retrieved = session.getPayload('test-cause');
			expect(retrieved).toEqual(payload);
			expect(retrieved?.nested.value).toBe(42);
			expect(retrieved?.arr).toEqual([1, 2, 3]);
		});
	});
});
