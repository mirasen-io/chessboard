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

const TEST_EXT_ID = 'test-ext';

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
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
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
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(() => extensionMountBase<TestSlots>(base, createSlotRoots())).toThrow();
	});
});

describe('extensionUnmountBase', () => {
	it('sets slotRoots to null', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionUnmountBase<TestSlots>(base, TEST_EXT_ID);
		expect(base.slotRoots).toBeNull();
	});

	it('clears children of visual slot root elements', () => {
		const base = createBase();
		const roots = createSlotRoots();
		const child = document.createElementNS(SVG_NS, 'rect');
		roots.underPieces.appendChild(child);
		extensionMountBase<TestSlots>(base, roots);

		extensionUnmountBase<TestSlots>(base, TEST_EXT_ID);

		expect(roots.underPieces.childNodes.length).toBe(0);
	});

	it('throws if not mounted', () => {
		const base = createBase();
		expect(() => extensionUnmountBase<TestSlots>(base, TEST_EXT_ID)).toThrow();
	});
});

describe('extensionUnmountBase – defs cleanup', () => {
	type DefsSlots = readonly ['defs', 'underPieces'];
	const EXT_A = 'ext-a';
	const EXT_B = 'ext-b';

	function createDefsSlotRoots(): { defs: SVGDefsElement; underPieces: SVGGElement } {
		const svg = document.createElementNS(SVG_NS, 'svg');
		const defs = document.createElementNS(SVG_NS, 'defs');
		svg.appendChild(defs);
		const underPieces = document.createElementNS(SVG_NS, 'g');
		svg.appendChild(underPieces);
		return { defs, underPieces };
	}

	it('removes only definitions with matching data-chessboard-extension-id', () => {
		const base = extensionCreateInternalBase<DefsSlots>(createMockExtensionCreateInstanceOptions());
		const roots = createDefsSlotRoots();

		const defA = document.createElementNS(SVG_NS, 'pattern');
		defA.setAttribute('data-chessboard-extension-id', EXT_A);
		defA.setAttribute('data-chessboard-id', 'pattern-a');
		roots.defs.appendChild(defA);

		const defB = document.createElementNS(SVG_NS, 'pattern');
		defB.setAttribute('data-chessboard-extension-id', EXT_B);
		defB.setAttribute('data-chessboard-id', 'pattern-b');
		roots.defs.appendChild(defB);

		extensionMountBase<DefsSlots>(base, roots);
		extensionUnmountBase<DefsSlots>(base, EXT_A);

		expect(roots.defs.querySelector('[data-chessboard-extension-id="ext-a"]')).toBeNull();
		expect(roots.defs.querySelector('[data-chessboard-extension-id="ext-b"]')).not.toBeNull();
	});

	it('leaves defs intact when no definitions match the extension id', () => {
		const base = extensionCreateInternalBase<DefsSlots>(createMockExtensionCreateInstanceOptions());
		const roots = createDefsSlotRoots();

		const defOther = document.createElementNS(SVG_NS, 'linearGradient');
		defOther.setAttribute('data-chessboard-extension-id', 'other-ext');
		defOther.setAttribute('data-chessboard-id', 'grad-1');
		roots.defs.appendChild(defOther);

		extensionMountBase<DefsSlots>(base, roots);
		extensionUnmountBase<DefsSlots>(base, EXT_A);

		expect(roots.defs.children.length).toBe(1);
	});

	it('clears visual slots fully while only selectively cleaning defs', () => {
		const base = extensionCreateInternalBase<DefsSlots>(createMockExtensionCreateInstanceOptions());
		const roots = createDefsSlotRoots();

		const visualChild = document.createElementNS(SVG_NS, 'rect');
		roots.underPieces.appendChild(visualChild);

		const ownedDef = document.createElementNS(SVG_NS, 'marker');
		ownedDef.setAttribute('data-chessboard-extension-id', EXT_A);
		ownedDef.setAttribute('data-chessboard-id', 'marker-a');
		roots.defs.appendChild(ownedDef);

		const otherDef = document.createElementNS(SVG_NS, 'marker');
		otherDef.setAttribute('data-chessboard-extension-id', EXT_B);
		otherDef.setAttribute('data-chessboard-id', 'marker-b');
		roots.defs.appendChild(otherDef);

		extensionMountBase<DefsSlots>(base, roots);
		extensionUnmountBase<DefsSlots>(base, EXT_A);

		expect(roots.underPieces.children.length).toBe(0);
		expect(roots.defs.children.length).toBe(1);
		expect(roots.defs.children[0].getAttribute('data-chessboard-extension-id')).toBe(EXT_B);
	});
});

describe('extensionDestroyBase', () => {
	it('marks base as destroyed', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(base.destroyed).toBe(true);
	});

	it('auto-unmounts if currently mounted', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(extensionIsMountedBase(base)).toBe(false);
		expect(base.destroyed).toBe(true);
	});

	it('throws if already destroyed', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(() => extensionDestroyBase<TestSlots>(base, TEST_EXT_ID)).toThrow();
	});
});

describe('lifecycle interaction', () => {
	it('mount -> unmount -> destroy works', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionUnmountBase<TestSlots>(base, TEST_EXT_ID);
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(extensionIsMountedBase(base)).toBe(false);
		expect(extensionIsDestroyedBase(base)).toBe(true);
	});

	it('mount -> destroy auto-unmounts then destroys', () => {
		const base = createBase();
		extensionMountBase<TestSlots>(base, createSlotRoots());
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(extensionIsMountedBase(base)).toBe(false);
		expect(extensionIsDestroyedBase(base)).toBe(true);
	});

	it('cannot mount after destroy', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(() => extensionMountBase<TestSlots>(base, createSlotRoots())).toThrow();
	});

	it('cannot unmount after destroy without being mounted', () => {
		const base = createBase();
		extensionDestroyBase<TestSlots>(base, TEST_EXT_ID);
		expect(() => extensionUnmountBase<TestSlots>(base, TEST_EXT_ID)).toThrow();
	});
});
