import assert from '@ktarmyshov/assert';
import { clearSvgElementChildren } from '../../../render/svg/helpers.js';
import { ExtensionSlotName } from '../../types/basic/mount.js';
import type { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import { ExtensionInternalBase } from './types.js';

export function extensionCreateInternalBase<TSlots extends readonly ExtensionSlotName[]>(
	options: ExtensionCreateInstanceOptions
): ExtensionInternalBase<TSlots> {
	return {
		slotRoots: null,
		destroyed: false,
		svgIds: options.svgIds
	};
}

export function extensionIsMountedBase<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternalBase<TSlots>
): boolean {
	return state.slotRoots !== null;
}

export function extensionIsDestroyedBase<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternalBase<TSlots>
): boolean {
	return state.destroyed;
}

export function extensionMountBase<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternalBase<TSlots>,
	slotRoots: NonNullable<ExtensionInternalBase<TSlots>['slotRoots']>
): void {
	assert(!extensionIsMountedBase(state), 'Extension is already mounted');
	assert(!extensionIsDestroyedBase(state), 'Extension is destroyed');
	state.slotRoots = slotRoots;
}

export function extensionUnmountBase<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternalBase<TSlots>
): void {
	assert(extensionIsMountedBase(state), 'Extension is not mounted');
	for (const [, slotRoot] of Object.entries(state.slotRoots ?? {})) {
		clearSvgElementChildren(slotRoot as SVGElement);
	}
	state.slotRoots = null;
}

export function extensionDestroyBase<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternalBase<TSlots>
): void {
	assert(!extensionIsDestroyedBase(state), 'Extension is already destroyed');
	if (extensionIsMountedBase(state)) {
		extensionUnmountBase(state);
	}
	state.destroyed = true;
}
