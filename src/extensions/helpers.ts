import type {
	ExtensionOnUpdateStateContext,
	ExtensionOnUpdateStateContextCommon,
	ExtensionOnUpdateStateContextCommonMounted,
	ExtensionOnUpdateStateContextMounted
} from './types';

export function isCurrentUpdateContextCommonMounted<T extends ExtensionOnUpdateStateContextCommon>(
	context: T
): context is T & ExtensionOnUpdateStateContextCommonMounted {
	return context.current.isMounted;
}

export function isCurrentUpdateContextMounted<T extends ExtensionOnUpdateStateContext>(
	context: T
): context is T & ExtensionOnUpdateStateContextMounted {
	return context.current.isMounted;
}
