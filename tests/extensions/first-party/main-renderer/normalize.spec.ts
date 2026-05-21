import { describe, expect, it } from 'vitest';
import { normalizeMainRendererConfig } from '../../../../src/extensions/first-party/main-renderer/normalize.js';
import {
	DefaultMainRendererDesktopConfig,
	DefaultMainRendererMobileConfig,
	type MainRendererConfig
} from '../../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { PieceUrlsPublic } from '../../../../src/extensions/first-party/main-renderer/types/public.js';
import { PieceCode } from '../../../../src/state/board/types/internal.js';

const FULL_PUBLIC_PIECE_URLS: PieceUrlsPublic = {
	wK: '/wK.svg',
	wQ: '/wQ.svg',
	wR: '/wR.svg',
	wB: '/wB.svg',
	wN: '/wN.svg',
	wP: '/wP.svg',
	bK: '/bK.svg',
	bQ: '/bQ.svg',
	bR: '/bR.svg',
	bB: '/bB.svg',
	bN: '/bN.svg',
	bP: '/bP.svg'
};

describe('normalizeMainRendererConfig', () => {
	describe('defaults', () => {
		it('desktop default has drag { pieceScale: 1, pieceAnchor: "center", pieceAnchorOffsetY: 0 }', () => {
			expect(DefaultMainRendererDesktopConfig.drag).toEqual({
				pieceScale: 1,
				pieceAnchor: 'center',
				pieceAnchorOffsetY: 0
			});
		});

		it('mobile default has drag { pieceScale: 2, pieceAnchor: "bottom", pieceAnchorOffsetY: 0.14 }', () => {
			expect(DefaultMainRendererMobileConfig.drag).toEqual({
				pieceScale: 2,
				pieceAnchor: 'bottom',
				pieceAnchorOffsetY: 0.14
			});
		});

		it('desktop and mobile defaults both expose animation.durationMs === 180', () => {
			expect(DefaultMainRendererDesktopConfig.animation).toEqual({ durationMs: 180 });
			expect(DefaultMainRendererMobileConfig.animation).toEqual({ durationMs: 180 });
		});
	});

	describe('input + base wiring', () => {
		it('returns base unchanged for undefined input', () => {
			const config = normalizeMainRendererConfig(undefined, DefaultMainRendererDesktopConfig);
			expect(config).toEqual(DefaultMainRendererDesktopConfig);
			expect(config.drag).toEqual(DefaultMainRendererDesktopConfig.drag);
		});

		it('returns base unchanged for empty input', () => {
			const config = normalizeMainRendererConfig({}, DefaultMainRendererDesktopConfig);
			expect(config).toEqual(DefaultMainRendererDesktopConfig);
			expect(config.drag).toEqual(DefaultMainRendererDesktopConfig.drag);
		});

		it('honors a custom base when input is undefined', () => {
			const config = normalizeMainRendererConfig(undefined, DefaultMainRendererMobileConfig);
			expect(config).toEqual(DefaultMainRendererMobileConfig);
			expect(config.drag).toEqual({
				pieceScale: 2,
				pieceAnchor: 'bottom',
				pieceAnchorOffsetY: 0.14
			});
		});
	});

	describe('colors', () => {
		it('overrides colors when provided and preserves base elsewhere', () => {
			const customColors = {
				board: { light: '#fff', dark: '#000' },
				coordinates: { light: '#aaa', dark: '#333' }
			};
			const config = normalizeMainRendererConfig(
				{ colors: customColors },
				DefaultMainRendererDesktopConfig
			);
			expect(config.colors).toEqual(customColors);
			expect(config.pieceUrls).toEqual(DefaultMainRendererDesktopConfig.pieceUrls);
			expect(config.drag).toEqual(DefaultMainRendererDesktopConfig.drag);
		});

		it('partial-merges nested color fields over base', () => {
			const config = normalizeMainRendererConfig(
				{ colors: { board: { light: '#fff' } } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.colors.board.light).toBe('#fff');
			expect(config.colors.board.dark).toBe(DefaultMainRendererDesktopConfig.colors.board.dark);
			expect(config.colors.coordinates).toEqual(
				DefaultMainRendererDesktopConfig.colors.coordinates
			);
		});
	});

	describe('drag', () => {
		it('partial-merges drag over base', () => {
			const config = normalizeMainRendererConfig(
				{ drag: { pieceScale: 3 } },
				DefaultMainRendererMobileConfig
			);
			expect(config.drag).toEqual({
				pieceScale: 3,
				pieceAnchor: 'bottom',
				pieceAnchorOffsetY: 0.14
			});
		});

		it('overrides only pieceAnchor when only that is provided', () => {
			const config = normalizeMainRendererConfig(
				{ drag: { pieceAnchor: 'bottom' } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.drag).toEqual({
				pieceScale: 1,
				pieceAnchor: 'bottom',
				pieceAnchorOffsetY: 0
			});
		});

		it('overrides only pieceAnchorOffsetY when only that is provided', () => {
			const config = normalizeMainRendererConfig(
				{ drag: { pieceAnchorOffsetY: 0.25 } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.drag).toEqual({
				pieceScale: 1,
				pieceAnchor: 'center',
				pieceAnchorOffsetY: 0.25
			});
		});

		it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
			'throws for invalid pieceScale: %s',
			(value) => {
				expect(() =>
					normalizeMainRendererConfig(
						{ drag: { pieceScale: value } },
						DefaultMainRendererDesktopConfig
					)
				).toThrow();
			}
		);

		it('throws for invalid pieceAnchor', () => {
			expect(() =>
				normalizeMainRendererConfig(
					{ drag: { pieceAnchor: 'invalid' as never } },
					DefaultMainRendererDesktopConfig
				)
			).toThrow();
		});

		it.each([-0.5, 0, 0.14, 0.5, 1])('accepts finite pieceAnchorOffsetY: %s', (value) => {
			const config = normalizeMainRendererConfig(
				{ drag: { pieceAnchorOffsetY: value } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.drag.pieceAnchorOffsetY).toBe(value);
		});

		it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
			'throws for non-finite pieceAnchorOffsetY: %s',
			(value) => {
				expect(() =>
					normalizeMainRendererConfig(
						{ drag: { pieceAnchorOffsetY: value } },
						DefaultMainRendererDesktopConfig
					)
				).toThrow();
			}
		);
	});

	describe('animation', () => {
		it('uses default animation when input is undefined', () => {
			const config = normalizeMainRendererConfig(undefined, DefaultMainRendererDesktopConfig);
			expect(config.animation).toEqual(DefaultMainRendererDesktopConfig.animation);
			expect(config.animation.durationMs).toBe(180);
		});

		it('omitting the animation section preserves the default deeply', () => {
			const config = normalizeMainRendererConfig({}, DefaultMainRendererDesktopConfig);
			expect(config.animation).toEqual(DefaultMainRendererDesktopConfig.animation);
		});

		it('empty animation object falls back to default durationMs', () => {
			const config = normalizeMainRendererConfig(
				{ animation: {} },
				DefaultMainRendererDesktopConfig
			);
			expect(config.animation.durationMs).toBe(180);
		});

		it('honors a custom positive durationMs', () => {
			const config = normalizeMainRendererConfig(
				{ animation: { durationMs: 250 } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.animation.durationMs).toBe(250);
		});

		it('honors durationMs: 0', () => {
			const config = normalizeMainRendererConfig(
				{ animation: { durationMs: 0 } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.animation.durationMs).toBe(0);
		});

		it.each([
			-1,
			Number.NaN,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
			'180' as unknown as number
		])('throws for invalid durationMs: %s', (value) => {
			expect(() =>
				normalizeMainRendererConfig(
					{ animation: { durationMs: value } },
					DefaultMainRendererDesktopConfig
				)
			).toThrow();
		});
	});

	describe('pieceUrls', () => {
		it('preserves base.pieceUrls when input.pieceUrls is absent', () => {
			const config = normalizeMainRendererConfig(
				{ colors: { board: { light: '#fff' } } },
				DefaultMainRendererDesktopConfig
			);
			expect(config.pieceUrls).toEqual(DefaultMainRendererDesktopConfig.pieceUrls);
		});

		it('normalizes full public pieceUrls to numeric PieceCode keys', () => {
			const config = normalizeMainRendererConfig(
				{ pieceUrls: FULL_PUBLIC_PIECE_URLS },
				DefaultMainRendererDesktopConfig
			);
			expect(config.pieceUrls[PieceCode.WhiteKing]).toBe('/wK.svg');
			expect(config.pieceUrls[PieceCode.WhiteQueen]).toBe('/wQ.svg');
			expect(config.pieceUrls[PieceCode.WhiteRook]).toBe('/wR.svg');
			expect(config.pieceUrls[PieceCode.WhiteBishop]).toBe('/wB.svg');
			expect(config.pieceUrls[PieceCode.WhiteKnight]).toBe('/wN.svg');
			expect(config.pieceUrls[PieceCode.WhitePawn]).toBe('/wP.svg');
			expect(config.pieceUrls[PieceCode.BlackKing]).toBe('/bK.svg');
			expect(config.pieceUrls[PieceCode.BlackQueen]).toBe('/bQ.svg');
			expect(config.pieceUrls[PieceCode.BlackRook]).toBe('/bR.svg');
			expect(config.pieceUrls[PieceCode.BlackBishop]).toBe('/bB.svg');
			expect(config.pieceUrls[PieceCode.BlackKnight]).toBe('/bN.svg');
			expect(config.pieceUrls[PieceCode.BlackPawn]).toBe('/bP.svg');
			expect(Object.keys(config.pieceUrls)).toHaveLength(12);
		});

		it('throws when pieceUrls is provided but incomplete', () => {
			const incomplete = { wK: '/wK.svg', wQ: '/wQ.svg' } as unknown as PieceUrlsPublic;
			expect(() =>
				normalizeMainRendererConfig({ pieceUrls: incomplete }, DefaultMainRendererDesktopConfig)
			).toThrow();
		});

		it('replaces base.pieceUrls entirely rather than partial-merging keys', () => {
			const customBase: MainRendererConfig = {
				...DefaultMainRendererDesktopConfig,
				pieceUrls: {
					...DefaultMainRendererDesktopConfig.pieceUrls,
					[PieceCode.WhiteKing]: '/base-wK.svg'
				}
			};
			const overrideUrls: PieceUrlsPublic = {
				...FULL_PUBLIC_PIECE_URLS,
				wK: '/override-wK.svg'
			};
			const config = normalizeMainRendererConfig({ pieceUrls: overrideUrls }, customBase);
			// Override wins for the supplied key
			expect(config.pieceUrls[PieceCode.WhiteKing]).toBe('/override-wK.svg');
			// All other keys come from the supplied input (full record), NOT from base
			expect(config.pieceUrls[PieceCode.WhitePawn]).toBe('/wP.svg');
			expect(config.pieceUrls[PieceCode.BlackKing]).toBe('/bK.svg');
			// And explicitly: we did not retain base values
			expect(config.pieceUrls[PieceCode.WhitePawn]).not.toBe(
				customBase.pieceUrls[PieceCode.WhitePawn]
			);
			expect(Object.keys(config.pieceUrls)).toHaveLength(12);
		});
	});
});
