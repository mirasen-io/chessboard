import { describe, expect, it } from 'vitest';
import { normalizePromotionConfig } from '../../../../src/extensions/first-party/promotion/normalize.js';
import { DEFAULT_CONFIG } from '../../../../src/extensions/first-party/promotion/types/internal.js';

describe('normalizePromotionConfig', () => {
	it('returns default config when no overrides provided', () => {
		const config = normalizePromotionConfig({});
		expect(config.squareColor).toEqual(DEFAULT_CONFIG.squareColor);
		expect(config.hoverColor).toEqual(DEFAULT_CONFIG.hoverColor);
		expect(config.pieceUrls).toEqual(DEFAULT_CONFIG.pieceUrls);
	});

	it('overrides squareColor when provided', () => {
		const custom = { color: 'red', opacity: 0.8 };
		const config = normalizePromotionConfig({ squareColor: custom });
		expect(config.squareColor).toEqual(custom);
		expect(config.hoverColor).toEqual(DEFAULT_CONFIG.hoverColor);
	});

	it('overrides hoverColor when provided', () => {
		const custom = { color: 'blue', opacity: 0.5 };
		const config = normalizePromotionConfig({ hoverColor: custom });
		expect(config.hoverColor).toEqual(custom);
		expect(config.squareColor).toEqual(DEFAULT_CONFIG.squareColor);
	});

	it('normalizes pieceUrls from string keys to numeric piece code keys', () => {
		const pieceUrls = {
			wQ: '/wQ.svg',
			wR: '/wR.svg',
			wB: '/wB.svg',
			wN: '/wN.svg',
			bQ: '/bQ.svg',
			bR: '/bR.svg',
			bB: '/bB.svg',
			bN: '/bN.svg'
		};
		const config = normalizePromotionConfig({ pieceUrls });
		const urls = Object.values(config.pieceUrls);
		expect(urls).toHaveLength(8);
		expect(urls).toContain('/wQ.svg');
		expect(urls).toContain('/bN.svg');
	});

	it('throws when pieceUrls is provided but incomplete', () => {
		const incompletePieceUrls = {
			wQ: '/wQ.svg',
			wR: '/wR.svg'
		};
		expect(() => normalizePromotionConfig({ pieceUrls: incompletePieceUrls as never })).toThrow();
	});
});
