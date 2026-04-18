import assert from '@ktarmyshov/assert';
import { clearElementChildren } from '../../../render/svg/helpers';
import { ExtensionSlotName } from '../../types/basic/mount';
import { ExtensionInternal } from './types';

export function extensionCreateInternalBase<
	TSlots extends readonly ExtensionSlotName[]
>(): ExtensionInternal<TSlots> {
	return {
		slotRoots: null,
		destroyed: false
	};
}

export function extensionIsMounted<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternal<TSlots>
): boolean {
	return state.slotRoots !== null;
}

export function extensionIsDestroyed<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternal<TSlots>
): boolean {
	return state.destroyed;
}

export function extensionMount<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternal<TSlots>,
	slotRoots: NonNullable<ExtensionInternal<TSlots>['slotRoots']>
): void {
	assert(!extensionIsMounted(state), 'Extension is already mounted');
	assert(!extensionIsDestroyed(state), 'Extension is destroyed');
	state.slotRoots = slotRoots;
}

export function extensionUnmount<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternal<TSlots>
): void {
	assert(extensionIsMounted(state), 'Extension is not mounted');
	for (const slotRoot of Object.values<SVGGElement>(state.slotRoots ?? {})) {
		clearElementChildren(slotRoot);
	}
	state.slotRoots = null;
}

export function extensionDestroy<TSlots extends readonly ExtensionSlotName[]>(
	state: ExtensionInternal<TSlots>
): void {
	assert(!extensionIsDestroyed(state), 'Extension is already destroyed');
	if (extensionIsMounted(state)) {
		extensionUnmount(state);
	}
	state.destroyed = true;
}
