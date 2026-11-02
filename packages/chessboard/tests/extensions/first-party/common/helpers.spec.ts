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
import { SVG_NS } from '../../../../src/render/svg/helpers.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

type TestSlots = readonly ['underPieces'];

function createBase(): ExtensionInternalBase<TestSlots> {
	return extensionCreateInternalBase<TestSlots>(createMockExtensionCreateInstanceOptions());
}

function createSlotRoots(): { underPieces: SVGGElement } {
	return { underPieces: document.createElementNS(SVG_NS, 'g') };
}

describe('extensionCreateInternalBase', () => {
	it('creates a base with slotRoots null and destroyed false', () => {
		const base = createBase();
		expect(base.slotRoots).toBeNull();
		expect(base.destroyed).toBe(false);
	});

	it('stores the exact svgIds resolver from options', () => {
		const options = createMockExtensionCreateInstanceOptions();
		const base = extensionCreateInternalBase<TestSlots>(options);
		expect(base.svgIds).toBe(options.svgIds);
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

	it('clears children of visual slot root elements', () => {
		const base = createBase();
		const roots = createSlotRoots();
		const child = document.createElementNS(SVG_NS, 'rect');
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

describe('extensionUnmountBase – per-extension defs ownership', () => {
	type DefsSlots = readonly ['defs', 'underPieces'];

	function createDefsSlotRoots(): { defs: SVGDefsElement; underPieces: SVGGElement } {
		const svg = document.createElementNS(SVG_NS, 'svg');
		const defs = document.createElementNS(SVG_NS, 'defs');
		svg.appendChild(defs);
		const underPieces = document.createElementNS(SVG_NS, 'g');
		svg.appendChild(underPieces);
		return { defs, underPieces };
	}

	it('clears all children from the per-extension defs root', () => {
		const base = extensionCreateInternalBase<DefsSlots>(createMockExtensionCreateInstanceOptions());
		const roots = createDefsSlotRoots();

		const def1 = document.createElementNS(SVG_NS, 'pattern');
		def1.setAttribute('data-chessboard-id', 'pattern-a');
		roots.defs.appendChild(def1);

		const def2 = document.createElementNS(SVG_NS, 'linearGradient');
		def2.setAttribute('data-chessboard-id', 'grad-b');
		roots.defs.appendChild(def2);

		extensionMountBase<DefsSlots>(base, roots);
		extensionUnmountBase<DefsSlots>(base);

		expect(roots.defs.children.length).toBe(0);
	});

	it('clears both defs and visual slots fully on unmount', () => {
		const base = extensionCreateInternalBase<DefsSlots>(createMockExtensionCreateInstanceOptions());
		const roots = createDefsSlotRoots();

		roots.defs.appendChild(document.createElementNS(SVG_NS, 'marker'));
		roots.underPieces.appendChild(document.createElementNS(SVG_NS, 'rect'));

		extensionMountBase<DefsSlots>(base, roots);
		extensionUnmountBase<DefsSlots>(base);

		expect(roots.defs.children.length).toBe(0);
		expect(roots.underPieces.children.length).toBe(0);
	});

	it('does not affect another extension defs root outside state.slotRoots', () => {
		const base = extensionCreateInternalBase<DefsSlots>(createMockExtensionCreateInstanceOptions());
		const svg = document.createElementNS(SVG_NS, 'svg');

		const ownDefs = document.createElementNS(SVG_NS, 'defs');
		svg.appendChild(ownDefs);
		ownDefs.appendChild(document.createElementNS(SVG_NS, 'pattern'));

		const otherDefs = document.createElementNS(SVG_NS, 'defs');
		svg.appendChild(otherDefs);
		otherDefs.appendChild(document.createElementNS(SVG_NS, 'linearGradient'));

		const underPieces = document.createElementNS(SVG_NS, 'g');
		svg.appendChild(underPieces);

		extensionMountBase<DefsSlots>(base, { defs: ownDefs, underPieces });
		extensionUnmountBase<DefsSlots>(base);

		expect(ownDefs.children.length).toBe(0);
		expect(otherDefs.children.length).toBe(1);
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
