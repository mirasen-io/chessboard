import { ExtensionSlotName } from '../../extensions/types';
import { createSvgGroup } from './helpers';
import { SvgRendererInternals } from './types';

export function rendererAllocateExtensionSlots(
	state: SvgRendererInternals,
	extensionId: string,
	slots: readonly ExtensionSlotName[]
): Partial<Record<ExtensionSlotName, SVGGElement>> {
	if (state.extensions.allocatedSlots.has(extensionId)) {
		throw new Error(`Extension slots already allocated for extension: ${extensionId}`);
	}
	// Detect duplicate slot names
	const seen = new Set<ExtensionSlotName>();
	for (const slot of slots) {
		if (seen.has(slot)) {
			throw new Error(`Duplicate slot name in allocation: ${slot}`);
		}
		seen.add(slot);
	}

	const result = {} as Partial<Record<ExtensionSlotName, SVGGElement>>;

	for (const slot of slots) {
		const slotRoot = getExtensionSlotRoot(state, slot);
		const child = createSvgGroup(slotRoot, {
			'data-chessboard-id': `extension-${extensionId}-${slot}`,
			'data-extension-id': extensionId
		});
		result[slot] = child;
	}

	state.extensions.allocatedSlots.set(extensionId, result);

	return result;
}

function getExtensionSlotRoot(state: SvgRendererInternals, slot: ExtensionSlotName): SVGGElement {
	switch (slot) {
		case 'underPieces':
			return state.extensions.underPieces;
		case 'overPieces':
			return state.extensions.overPieces;
		case 'dragUnder':
			return state.extensions.dragUnder;
		case 'dragOver':
			return state.extensions.dragOver;
		case 'defs':
			return state.extensions.defs;
		default:
			throw new Error(`Invalid extension slot name: ${slot}`);
	}
}

export function rendererRemoveExtensionSlots(
	state: SvgRendererInternals,
	extensionId: string
): void {
	const allocatedSlots = state.extensions.allocatedSlots.get(extensionId);
	if (!allocatedSlots) {
		throw new Error(`No allocated slots found for extension: ${extensionId}`);
	}
	Object.values(allocatedSlots).forEach((slot) => {
		if (slot) {
			slot.parentElement?.removeChild(slot);
		}
	});

	state.extensions.allocatedSlots.delete(extensionId);
}
