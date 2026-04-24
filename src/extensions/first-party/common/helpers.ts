import assert from '@ktarmyshov/assert';
import { clearElementChildren } from '../../../render/svg/helpers.js';
import { ExtensionSlotName } from '../../types/basic/mount.js';
import { ExtensionInternalBase } from './types.js';

export function extensionCreateInternalBase<
	TSlots extends readonly ExtensionSlotName[]
>(): ExtensionInternalBase<TSlots> {
	return {
		slotRoots: null,
		destroyed: false
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
	for (const slotRoot of Object.values<SVGGElement>(state.slotRoots ?? {})) {
		clearElementChildren(slotRoot);
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
