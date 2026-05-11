import { describe, expect, it, vi } from 'vitest';
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
