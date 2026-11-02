import { describe, expect, it, vi } from 'vitest';
import { createAutoPromote } from '../../../../src/extensions/first-party/auto-promote/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/auto-promote/types.js';
import { RoleCode } from '../../../../src/state/board/types/internal.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

function createFakeUIMoveRequestContext(opts: {
	sourceSquare?: number;
	destinationTo?: number;
	promotedTo?: number[];
}) {
	const resolve = vi.fn();
	return {
		context: {
			request: {
				sourceSquare: opts.sourceSquare ?? 12,
				destination: {
					to: opts.destinationTo ?? 28,
					promotedTo: opts.promotedTo ?? undefined
				},
				resolve
			} as never
		},
		resolve
	};
}

describe('createAutoPromote', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createAutoPromote();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('autoPromote');
	});

	it('createInstance returns an instance with onUIMoveRequest', () => {
		const def = createAutoPromote();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
		);
		expect(instance.id).toBe(EXTENSION_ID);
		expect(instance.onUIMoveRequest).toBeDefined();
	});

	it('exposes public API with toQueen defaulting to false', () => {
		const def = createAutoPromote();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
		);
		const pub = (instance as { getPublic: () => { toQueen: boolean } }).getPublic();
		expect(pub.toQueen).toBe(false);
	});

	it('public API toQueen can be set to true', () => {
		const def = createAutoPromote();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
		);
		const pub = (instance as { getPublic: () => { toQueen: boolean } }).getPublic();
		pub.toQueen = true;
		expect(pub.toQueen).toBe(true);
	});

	describe('onUIMoveRequest behavior', () => {
		it('does not resolve when disabled (toQueen = false)', () => {
			const def = createAutoPromote();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const { context, resolve } = createFakeUIMoveRequestContext({
				promotedTo: [RoleCode.Queen, RoleCode.Rook, RoleCode.Bishop, RoleCode.Knight]
			});

			instance.onUIMoveRequest!(context);

			expect(resolve).not.toHaveBeenCalled();
		});

		it('resolves to queen when enabled and queen is in promotedTo', () => {
			const def = createAutoPromote();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const pub = (instance as { getPublic: () => { toQueen: boolean } }).getPublic();
			pub.toQueen = true;

			const { context, resolve } = createFakeUIMoveRequestContext({
				sourceSquare: 52,
				destinationTo: 60,
				promotedTo: [RoleCode.Queen, RoleCode.Rook, RoleCode.Bishop, RoleCode.Knight]
			});

			instance.onUIMoveRequest!(context);

			expect(resolve).toHaveBeenCalledTimes(1);
			expect(resolve).toHaveBeenCalledWith({
				from: 52,
				to: 60,
				promotedTo: RoleCode.Queen
			});
		});

		it('does not resolve when enabled but queen is not in promotedTo', () => {
			const def = createAutoPromote();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const pub = (instance as { getPublic: () => { toQueen: boolean } }).getPublic();
			pub.toQueen = true;

			const { context, resolve } = createFakeUIMoveRequestContext({
				promotedTo: [RoleCode.Rook, RoleCode.Bishop, RoleCode.Knight]
			});

			instance.onUIMoveRequest!(context);

			expect(resolve).not.toHaveBeenCalled();
		});

		it('does not resolve when enabled but promotedTo is undefined', () => {
			const def = createAutoPromote();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const pub = (instance as { getPublic: () => { toQueen: boolean } }).getPublic();
			pub.toQueen = true;

			const { context, resolve } = createFakeUIMoveRequestContext({
				promotedTo: undefined
			});

			instance.onUIMoveRequest!(context);

			expect(resolve).not.toHaveBeenCalled();
		});
	});
});
