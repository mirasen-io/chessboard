import { describe, expect, it } from 'vitest';
import type { ExtensionSlotName } from '../../../src/core/extensions/types';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';

describe('SvgRenderer extension slot allocation', () => {
	it('allocateExtensionSlots creates child <g> in correct slot roots', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const handles = renderer.allocateExtensionSlots('ext1', ['underPieces', 'overPieces']);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsUnderPiecesRoot = (renderer as any).extensionsUnderPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsOverPiecesRoot = (renderer as any).extensionsOverPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsDragUnderRoot = (renderer as any).extensionsDragUnderRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsDragOverRoot = (renderer as any).extensionsDragOverRoot as SVGGElement;

		// Verify correct roots have children
		expect(extensionsUnderPiecesRoot.children.length).toBe(1);
		expect(extensionsOverPiecesRoot.children.length).toBe(1);
		expect(extensionsDragUnderRoot.children.length).toBe(0);
		expect(extensionsDragOverRoot.children.length).toBe(0);

		// Verify data attributes
		expect(extensionsUnderPiecesRoot.children[0].getAttribute('data-extension-id')).toBe('ext1');
		expect(extensionsOverPiecesRoot.children[0].getAttribute('data-extension-id')).toBe('ext1');

		// Verify handles match created children
		expect(handles.underPieces).toBe(extensionsUnderPiecesRoot.children[0]);
		expect(handles.overPieces).toBe(extensionsOverPiecesRoot.children[0]);

		renderer.unmount();
	});

	it('allocateExtensionSlots returns correct handle map', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const handles = renderer.allocateExtensionSlots('ext1', ['underPieces', 'dragOver']);

		// Verify returned map has correct keys
		expect('underPieces' in handles).toBe(true);
		expect('dragOver' in handles).toBe(true);
		expect('overPieces' in handles).toBe(false);
		expect('dragUnder' in handles).toBe(false);

		// Verify handles are SVGGElement instances
		expect(handles.underPieces).toBeInstanceOf(SVGGElement);
		expect(handles.dragOver).toBeInstanceOf(SVGGElement);

		renderer.unmount();
	});

	it('removeExtensionSlots removes all extension children across all slots', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// Allocate slots for extension
		renderer.allocateExtensionSlots('ext1', ['underPieces', 'overPieces', 'dragUnder', 'dragOver']);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsUnderPiecesRoot = (renderer as any).extensionsUnderPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsOverPiecesRoot = (renderer as any).extensionsOverPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsDragUnderRoot = (renderer as any).extensionsDragUnderRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsDragOverRoot = (renderer as any).extensionsDragOverRoot as SVGGElement;

		// Verify children exist
		expect(extensionsUnderPiecesRoot.children.length).toBe(1);
		expect(extensionsOverPiecesRoot.children.length).toBe(1);
		expect(extensionsDragUnderRoot.children.length).toBe(1);
		expect(extensionsDragOverRoot.children.length).toBe(1);

		// Remove extension slots
		renderer.removeExtensionSlots('ext1');

		// Verify all slot roots are empty
		expect(extensionsUnderPiecesRoot.children.length).toBe(0);
		expect(extensionsOverPiecesRoot.children.length).toBe(0);
		expect(extensionsDragUnderRoot.children.length).toBe(0);
		expect(extensionsDragOverRoot.children.length).toBe(0);

		renderer.unmount();
	});

	it('multiple extensions can coexist in same slot', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// Allocate same slot for two different extensions
		renderer.allocateExtensionSlots('ext1', ['underPieces']);
		renderer.allocateExtensionSlots('ext2', ['underPieces']);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsUnderPiecesRoot = (renderer as any).extensionsUnderPiecesRoot as SVGGElement;

		// Verify both children exist
		expect(extensionsUnderPiecesRoot.children.length).toBe(2);
		expect(extensionsUnderPiecesRoot.children[0].getAttribute('data-extension-id')).toBe('ext1');
		expect(extensionsUnderPiecesRoot.children[1].getAttribute('data-extension-id')).toBe('ext2');

		// Remove first extension
		renderer.removeExtensionSlots('ext1');

		// Verify only second extension remains
		expect(extensionsUnderPiecesRoot.children.length).toBe(1);
		expect(extensionsUnderPiecesRoot.children[0].getAttribute('data-extension-id')).toBe('ext2');

		renderer.unmount();
	});

	it('throws on duplicate slot names in same allocation', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		expect(() => renderer.allocateExtensionSlots('ext1', ['underPieces', 'underPieces'])).toThrow(
			/duplicate/i
		);

		renderer.unmount();
	});

	it('allocation before mount throws', () => {
		const renderer = new SvgRenderer();

		expect(() => renderer.allocateExtensionSlots('ext1', ['underPieces'])).toThrow(/before mount/i);
	});

	it('removal before mount throws', () => {
		const renderer = new SvgRenderer();

		expect(() => renderer.removeExtensionSlots('ext1')).toThrow(/before mount/i);
	});

	it('extension children maintain correct z-order relative to core content', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();

		// Allocate extension slots
		renderer.allocateExtensionSlots('ext1', ['underPieces', 'overPieces']);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsUnderPiecesRoot = (renderer as any).extensionsUnderPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsOverPiecesRoot = (renderer as any).extensionsOverPiecesRoot as SVGGElement;

		// Find indices in SVG children
		const children = Array.from(svg!.children);
		const underIndex = children.indexOf(extensionsUnderPiecesRoot);
		const piecesIndex = children.indexOf(piecesRoot);
		const overIndex = children.indexOf(extensionsOverPiecesRoot);

		// Verify z-order: underPieces < piecesRoot < overPieces
		expect(underIndex).toBeLessThan(piecesIndex);
		expect(piecesIndex).toBeLessThan(overIndex);

		// Verify extension children exist in their roots
		expect(extensionsUnderPiecesRoot.children.length).toBe(1);
		expect(extensionsOverPiecesRoot.children.length).toBe(1);

		renderer.unmount();
	});

	it('allocating all four slots works correctly', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const allSlots: ExtensionSlotName[] = ['underPieces', 'overPieces', 'dragUnder', 'dragOver'];
		const handles = renderer.allocateExtensionSlots('ext1', allSlots);

		// Verify all handles are present
		expect(handles.underPieces).toBeInstanceOf(SVGGElement);
		expect(handles.overPieces).toBeInstanceOf(SVGGElement);
		expect(handles.dragUnder).toBeInstanceOf(SVGGElement);
		expect(handles.dragOver).toBeInstanceOf(SVGGElement);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsUnderPiecesRoot = (renderer as any).extensionsUnderPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsOverPiecesRoot = (renderer as any).extensionsOverPiecesRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsDragUnderRoot = (renderer as any).extensionsDragUnderRoot as SVGGElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensionsDragOverRoot = (renderer as any).extensionsDragOverRoot as SVGGElement;

		// Verify all roots have children
		expect(extensionsUnderPiecesRoot.children.length).toBe(1);
		expect(extensionsOverPiecesRoot.children.length).toBe(1);
		expect(extensionsDragUnderRoot.children.length).toBe(1);
		expect(extensionsDragOverRoot.children.length).toBe(1);

		renderer.unmount();
	});
});
