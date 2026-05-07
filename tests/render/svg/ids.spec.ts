import { describe, expect, it } from 'vitest';
import { createSvgIdResolver } from '../../../src/render/svg/ids.js';

describe('createSvgIdResolver', () => {
	it('returns a resolver with a prefix starting with "cb"', () => {
		const resolver = createSvgIdResolver();
		expect(resolver.prefix).toMatch(/^cb\d+$/);
	});

	it('creates unique prefixes across resolver instances', () => {
		const resolver1 = createSvgIdResolver();
		const resolver2 = createSvgIdResolver();
		expect(resolver1.prefix).not.toBe(resolver2.prefix);
	});

	it('makeId returns prefix-scope-localId', () => {
		const resolver = createSvgIdResolver();
		const id = resolver.makeId('arrows', 'marker-end');
		expect(id).toBe(`${resolver.prefix}-arrows-marker-end`);
	});

	it('makeId is deterministic for same scope/localId within one resolver', () => {
		const resolver = createSvgIdResolver();
		const id1 = resolver.makeId('pieces', 'wK');
		const id2 = resolver.makeId('pieces', 'wK');
		expect(id1).toBe(id2);
	});

	it('makeHref returns "#" + makeId result', () => {
		const resolver = createSvgIdResolver();
		const href = resolver.makeHref('arrows', 'marker-end');
		const id = resolver.makeId('arrows', 'marker-end');
		expect(href).toBe(`#${id}`);
	});

	it('different scopes produce distinct ids', () => {
		const resolver = createSvgIdResolver();
		const id1 = resolver.makeId('scope-a', 'item');
		const id2 = resolver.makeId('scope-b', 'item');
		expect(id1).not.toBe(id2);
	});

	it('different localIds produce distinct ids', () => {
		const resolver = createSvgIdResolver();
		const id1 = resolver.makeId('scope', 'local-a');
		const id2 = resolver.makeId('scope', 'local-b');
		expect(id1).not.toBe(id2);
	});

	it('different resolvers produce distinct ids for same scope/localId', () => {
		const resolver1 = createSvgIdResolver();
		const resolver2 = createSvgIdResolver();
		const id1 = resolver1.makeId('scope', 'item');
		const id2 = resolver2.makeId('scope', 'item');
		expect(id1).not.toBe(id2);
	});
});
