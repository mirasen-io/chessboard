import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import { resolveAnnotationColor } from '../../../../src/extensions/first-party/annotations/interaction.js';
import type { AnnotationsConfig } from '../../../../src/extensions/first-party/annotations/types/internal.js';

function createPointerDownEvent(
	button: number,
	modifiers?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }
): PointerEvent {
	return new PointerEvent('pointerdown', {
		button,
		ctrlKey: modifiers?.ctrlKey ?? false,
		shiftKey: modifiers?.shiftKey ?? false,
		altKey: modifiers?.altKey ?? false,
		metaKey: modifiers?.metaKey ?? false
	});
}

describe('resolveAnnotationColor', () => {
	const config: AnnotationsConfig = { ...DEFAULT_CONFIG };

	it('returns none color when no modifiers', () => {
		const event = createPointerDownEvent(2);
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.none);
	});

	it('returns ctrl color', () => {
		const event = createPointerDownEvent(2, { ctrlKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.ctrl);
	});

	it('returns shift color', () => {
		const event = createPointerDownEvent(2, { shiftKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.shift);
	});

	it('returns alt color', () => {
		const event = createPointerDownEvent(2, { altKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.alt);
	});

	it('returns meta color', () => {
		const event = createPointerDownEvent(2, { metaKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.meta);
	});

	it('ctrl takes priority over shift when both pressed', () => {
		const event = createPointerDownEvent(2, { ctrlKey: true, shiftKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.ctrl);
	});

	it('shift takes priority over alt when both pressed', () => {
		const event = createPointerDownEvent(2, { shiftKey: true, altKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.shift);
	});
});

describe('resolveAnnotationColor — drawModifier', () => {
	it('null drawModifier preserves event-modifier resolution (no modifiers)', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: null };
		const event = createPointerDownEvent(2);
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.none);
	});

	it('null drawModifier preserves event-modifier resolution (ctrlKey)', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: null };
		const event = createPointerDownEvent(2, { ctrlKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.ctrl);
	});

	it('drawModifier = "shift" resolves shift color without physical shift key', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: 'shift' };
		const event = createPointerDownEvent(2);
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.shift);
	});

	it('drawModifier = "ctrl" resolves ctrl color without physical ctrl key', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: 'ctrl' };
		const event = createPointerDownEvent(2);
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.ctrl);
	});

	it('drawModifier = "alt" resolves alt color', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: 'alt' };
		const event = createPointerDownEvent(2);
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.alt);
	});

	it('drawModifier = "meta" resolves meta color', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: 'meta' };
		const event = createPointerDownEvent(2);
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.meta);
	});

	it('drawModifier wins over actual event modifier keys', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: 'shift' };
		const event = createPointerDownEvent(2, { ctrlKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.shift);
	});

	it('drawModifier = "ctrl" wins over altKey and metaKey on event', () => {
		const config: AnnotationsConfig = { ...DEFAULT_CONFIG, drawModifier: 'ctrl' };
		const event = createPointerDownEvent(2, { altKey: true, metaKey: true });
		expect(resolveAnnotationColor(config, event)).toBe(config.colors.ctrl);
	});
});
