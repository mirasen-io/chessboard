import { describe, expect, it } from 'vitest';
import { submodule1, submodule2, submodule3 } from '../src';

describe('Submodules', () => {
	describe('Submodule 1', () => {
		it('should be able to run a test', () => {
			expect(submodule1()).toBeUndefined();
		});
	});
	describe('Submodule 2', () => {
		it('should be able to run a test', () => {
			expect(submodule2()).toBeUndefined();
		});
	});
	describe('Submodule 3', () => {
		it('should be able to run a test', () => {
			expect(submodule3()).toBeUndefined();
		});
	});
});
