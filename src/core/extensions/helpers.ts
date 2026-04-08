import type {
	ExtensionOnUpdateStateContextBase,
	ExtensionOnUpdateStateContextBaseMounted,
	ExtensionOnUpdateStateContextCommon,
	ExtensionOnUpdateStateContextCommonMounted
} from './types';

export function isCurrentUpdateContextCommonMounted<T extends ExtensionOnUpdateStateContextCommon>(
	context: T
): context is T & ExtensionOnUpdateStateContextCommonMounted {
	return context.current.isMounted;
}

export function isCurrentUpdateContextBaseMounted<T extends ExtensionOnUpdateStateContextBase>(
	context: T
): context is T & ExtensionOnUpdateStateContextBaseMounted {
	return context.current.isMounted;
}
