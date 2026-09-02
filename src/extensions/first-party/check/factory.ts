import assert from '@ktarmyshov/assert';
import { toMerged } from 'es-toolkit';
import { createSvgElement, updateSvgElementAttributes } from '../../../render/svg/helpers.js';
import { isColorInput, isSquareString } from '../../../state/board/check.js';
import { denormalizeSquare } from '../../../state/board/denormalize.js';
import { normalizeColor, normalizeSquare } from '../../../state/board/normalize.js';
import type { ColorInput, SquareString } from '../../../state/board/types/input.js';
import { PieceCode, RoleCode, SQUARE_COUNT } from '../../../state/board/types/internal.js';
import { Square, toPieceCode } from '../../build/index.js';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import type { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import { markHighlightDirtyAndRequestRender } from './invalidation.js';
import {
	CheckConfig,
	CheckDefinition,
	CheckInitConfig,
	CheckInstance,
	CheckInstanceInternal,
	CheckPublic,
	DEFAULT_CONFIG,
	DirtyLayer,
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType,
	GRADIENT_STOPS
} from './types.js';

export function createCheck(config: CheckInitConfig = {}): CheckDefinition {
	const mergedConfig = toMerged(DEFAULT_CONFIG, config) as CheckConfig;
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance(options) {
			return createCheckInstance(options, mergedConfig);
		}
	};
}

function createCheckInternal(
	options: ExtensionCreateInstanceOptions,
	config: CheckConfig
): CheckInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(options),
		square: null,
		svgRect: null,
		svgGradient: null,
		runtimeSurface: options.runtimeSurface,
		config
	};
}

function extensionClean(state: CheckInstanceInternal): void {
	state.svgRect = null;
	state.svgGradient = null;
}

function createCheckInstancePublic(state: CheckInstanceInternal): CheckPublic {
	return {
		get square(): SquareString | ColorInput | null {
			return state.square === null ? null : denormalizeSquare(state.square);
		},
		set square(value: SquareString | ColorInput | null) {
			let next: Square | null = null;
			if (isSquareString(value)) {
				next = normalizeSquare(value);
			} else if (isColorInput(value)) {
				next = findKing(state, value);
			}
			if (next === state.square) {
				return; // no-op: same square (or both null)
			}
			state.square = next;
			markHighlightDirtyAndRequestRender(state);
		}
	};
}

function findKing(state: CheckInstanceInternal, color: ColorInput): Square {
	const snapshot = state.runtimeSurface.commands.getSnapshot();
	const pieces = snapshot.state.board.pieces;
	const colorCode = normalizeColor(color);
	const kingPieceCode = toPieceCode(RoleCode.King, colorCode);
	for (let sq = 0; sq < SQUARE_COUNT; sq++) {
		const piece = pieces[sq] as PieceCode;
		if (piece === kingPieceCode) {
			return sq as Square;
		}
	}
	throw new Error("King of color '" + color + "' not found");
}

function removeHighlight(state: CheckInstanceInternal): void {
	if (state.svgRect !== null) {
		state.svgRect.remove();
		state.svgRect = null;
		assert(state.svgGradient, 'svgGradient should be available if svgRect is available');
		state.svgGradient.remove();
		state.svgGradient = null;
	}
}

function gradientId(state: CheckInstanceInternal): string {
	return state.svgIds.makeId(EXTENSION_ID, 'highlight-gradient');
}

function createGradient(state: CheckInstanceInternal): SVGRadialGradientElement {
	assert(state.slotRoots, 'Slot roots should be available when render is called');
	const gradient = createSvgElement(state.slotRoots.defs, 'radialGradient', {
		'data-chessboard-id': 'check-highlight-gradient',
		id: gradientId(state),
		cx: '0.5',
		cy: '0.5',
		r: '0.707'
	});
	for (const stop of GRADIENT_STOPS) {
		createSvgElement(gradient, 'stop', {
			'data-chessboard-id': `check-highlight-gradient-stop-${stop.offset}`,
			offset: stop.offset,
			'stop-color': state.config.color,
			'stop-opacity': (Number(state.config.opacity) * stop.opacityRatio).toString()
		});
	}
	return gradient;
}

function createCheckInstance(
	options: ExtensionCreateInstanceOptions,
	config: CheckConfig
): CheckInstance {
	const internalState = createCheckInternal(options, config);
	const publicInterface = createCheckInstancePublic(internalState);
	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({ causes: ['layout.refreshGeometry'] }) &&
				isUpdateContextRenderable(context);
			if (!needsRender) {
				return; // no-op
			}
			context.invalidation.markDirty(DirtyLayer.Highlight);
		},
		render(context) {
			assert(
				context.invalidation.dirtyLayers !== 0,
				'Render should only be called when there are dirty layers'
			);

			if (internalState.square === null) {
				removeHighlight(internalState);
				return;
			}

			const geometry = context.currentFrame.layout.geometry;
			const rect = geometry.getSquareRect(internalState.square);
			const rectAttributes = {
				x: rect.x.toString(),
				y: rect.y.toString(),
				width: rect.width.toString(),
				height: rect.height.toString(),
				fill: `url(#${gradientId(internalState)})`
			};

			if (internalState.svgRect === null) {
				// The gradient is static (config-driven) and created exactly once,
				// alongside the rect. It is never updated on subsequent renders and is
				// removed together with the rect so <defs> keeps no orphans.
				internalState.svgGradient = createGradient(internalState);
				assert(internalState.slotRoots, 'Slot roots should be available when render is called');
				internalState.svgRect = createSvgElement(internalState.slotRoots.underPieces, 'rect', {
					'data-chessboard-id': 'check-square-highlight',
					...rectAttributes
				});
			} else {
				// Square changed or geometry refreshed: only the rect moves.
				updateSvgElementAttributes(internalState.svgRect, rectAttributes);
			}
		},
		unmount() {
			extensionUnmountBase<ExtensionSlotsType>(internalState);
			extensionClean(internalState);
		},
		destroy() {
			extensionDestroyBase<ExtensionSlotsType>(internalState);
			extensionClean(internalState);
		},
		getPublic() {
			return publicInterface;
		}
	};
}
