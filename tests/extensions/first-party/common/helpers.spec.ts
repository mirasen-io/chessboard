import { describe, expect, it } from 'vitest';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionIsDestroyedBase,
	extensionIsMountedBase,
	extensionMountBase,
	extensionUnmountBase
} from '../../../../src/extensions/first-party/common/helpers.js';
import type { ExtensionInternalBase } from '../../../../src/extensions/first-party/common/types.js';

type TestSlots = readonly ['underPieces'];

function createBase(): ExtensionInternalBase<TestSlots> {
	return extensionCreateInternalBase<TestSlots>();
}

function createSlotRoots(): { underPieces: SVGGElement } {
	return { underPieces: document.createElementNS('http://www.w3.org/2000/svg', 'g') };
}

describe('extensionCreateInternalBase', () => {
	it('creates a base with slotRoots null and destroyed false', () => {
		const base = createBase();
		expect(base.slotRoots).toBeNull();
		expect(base.destroyed).toBe(false);
	});
});

describe('extensionIsMountedBase', () => {
	it('returns false for fresh base', () => {
		expect(extensionIsMountedBase(createBase())).toBe(false);
	});

	it('returns true after mount', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		expect(extensionIsMountedBase(base)).toBe(true);
	});
});

describe('extensionIsDestroyedBase', () => {
	it('returns false for fresh base', () => {
		expect(extensionIsDestroyedBase(createBase())).toBe(false);
	});

	it('returns true after destroy', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base);
		expect(extensionIsDestroyedBase(base)).toBe(true);
	});
});

describe('extensionMountBase', () => {
	it('sets slotRoots on the base', () => {
		const base = createBase();
		const roots = createSlotRoots();
		extensionMountBase<TestSlots>(base, roots);
		expect(base.slotRoots).toBe(roots);
	});

	it('throws if already mounted', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		expect(() => extensionMountBase<TestSlots>(base, createSlotRoots())).toThrow();
	});

	it('throws if destroyed', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base);
		expect(() => extensionMountBase<TestSlots>(base, createSlotRoots())).toThrow();
	});
});

describe('extensionUnmountBase', () => {
	it('sets slotRoots to null', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionUnmountBase<TestSlots>(base);
		expect(base.slotRoots).toBeNull();
	});

	it('clears children of slot root elements', () => {
		const base = createBase();
		const roots = createSlotRoots();
		const child = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		roots.underPieces.appendChild(child);
		extensionMountBase<TestSlots>(base, roots);

		extensionUnmountBase<TestSlots>(base);

		expect(roots.underPieces.childNodes.length).toBe(0);
	});

	it('throws if not mounted', () => {
		const base = createBase();
		expect(() => extensionUnmountBase<TestSlots>(base)).toThrow();
	});
});

describe('extensionDestroyBase', () => {
	it('marks base as destroyed', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base);
		expect(base.destroyed).toBe(true);
	});

	it('auto-unmounts if currently mounted', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionDestroyBase<TestSlots>(base);
		expect(extensionIsMountedBase(base)).toBe(false);
		expect(base.destroyed).toBe(true);
	});

	it('throws if already destroyed', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base);
		expect(() => extensionDestroyBase<TestSlots>(base)).toThrow();
	});
});

describe('lifecycle interaction', () => {
	it('mount -> unmount -> destroy works', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionUnmountBase<TestSlots>(base);
		extensionDestroyBase<TestSlots>(base);
		expect(extensionIsMountedBase(base)).toBe(false);
		expect(extensionIsDestroyedBase(base)).toBe(true);
	});

	it('mount -> destroy auto-unmounts then destroys', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionDestroyBase<TestSlots>(base);
		expect(extensionIsMountedBase(base)).toBe(false);
		expect(extensionIsDestroyedBase(base)).toBe(true);
	});

	it('cannot mount after destroy', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base);
		expect(() => extensionMountBase<TestSlots>(base, createSlotRoots())).toThrow();
	});

	it('cannot unmount after destroy without being mounted', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base);
		expect(() => extensionUnmountBase<TestSlots>(base)).toThrow();
	});
});
