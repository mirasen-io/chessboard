import { describe, expect, it } from 'vitest';
import {
	DefaultChessboardDesktopConfig,
	DefaultChessboardMobileConfig,
	DefaultInteractionDesktopConfig,
	DefaultInteractionMobileConfig
} from '../src/index.js';
import {
	DefaultMainRendererDesktopConfig,
	DefaultMainRendererMobileConfig
} from '../src/extensions/index.js';

describe('root public API – composite chessboard config presets', () => {
	it('exports DefaultChessboardDesktopConfig and DefaultChessboardMobileConfig', () => {
		expect(DefaultChessboardDesktopConfig).toBeDefined();
		expect(DefaultChessboardMobileConfig).toBeDefined();
	});

	it('desktop composite has expected interaction and renderer drag values', () => {
		expect(DefaultChessboardDesktopConfig.interaction.drag.liftedActivation.thresholdPx).toBe(0);
		expect(DefaultChessboardDesktopConfig.renderer.drag.pieceScale).toBe(1);
		expect(DefaultChessboardDesktopConfig.renderer.drag.pieceAnchor).toBe('center');
		expect(DefaultChessboardDesktopConfig.renderer.drag.pieceAnchorOffsetY).toBe(0);
	});

	it('mobile composite has expected interaction and renderer drag values', () => {
		expect(DefaultChessboardMobileConfig.interaction.drag.liftedActivation.thresholdPx).toBe(5);
		expect(DefaultChessboardMobileConfig.renderer.drag.pieceScale).toBe(2);
		expect(DefaultChessboardMobileConfig.renderer.drag.pieceAnchor).toBe('bottom');
		expect(DefaultChessboardMobileConfig.renderer.drag.pieceAnchorOffsetY).toBe(0.14);
	});

	it('composites reuse the lower-level defaults by identity', () => {
		expect(DefaultChessboardDesktopConfig.interaction).toBe(DefaultInteractionDesktopConfig);
		expect(DefaultChessboardMobileConfig.interaction).toBe(DefaultInteractionMobileConfig);
		expect(DefaultChessboardDesktopConfig.renderer).toBe(DefaultMainRendererDesktopConfig);
		expect(DefaultChessboardMobileConfig.renderer).toBe(DefaultMainRendererMobileConfig);
	});
});

describe('extensions public API – renderer default exports', () => {
	it('exports DefaultMainRendererDesktopConfig and DefaultMainRendererMobileConfig', () => {
		expect(DefaultMainRendererDesktopConfig).toBeDefined();
		expect(DefaultMainRendererMobileConfig).toBeDefined();
	});
});
