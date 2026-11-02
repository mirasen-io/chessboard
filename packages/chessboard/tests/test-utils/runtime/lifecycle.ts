import { type Mock, vi } from 'vitest';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance,
	ExtensionCreateInstanceOptions
} from '../../../src/extensions/types/extension.js';

export interface SpyExtensionSpies {
	createInstance: Mock;
	mount: Mock;
	unmount: Mock;
	destroy: Mock;
	onUpdate: Mock;
}

export interface SpyExtensionResult {
	definition: AnyExtensionDefinition;
	spies: SpyExtensionSpies;
}

/**
 * Creates a minimal extension definition with vi.fn() spies for lifecycle hooks.
 */
export function createSpyExtensionDefinition(
	id: string,
	opts?: { slots?: AnyExtensionDefinition['slots']; getPublic?: () => unknown }
): SpyExtensionResult {
	const mountSpy = vi.fn();
	const unmountSpy = vi.fn();
	const destroySpy = vi.fn();
	const onUpdateSpy = vi.fn();
	const createInstanceSpy = vi.fn();

	const spies: SpyExtensionSpies = {
		createInstance: createInstanceSpy,
		mount: mountSpy,
		unmount: unmountSpy,
		destroy: destroySpy,
		onUpdate: onUpdateSpy
	};

	const definition: AnyExtensionDefinition = {
		id,
		slots: opts?.slots ?? [],
		createInstance(options: ExtensionCreateInstanceOptions): AnyExtensionInstance {
			createInstanceSpy(options);
			const instance = {
				id,
				mount: mountSpy,
				unmount: unmountSpy,
				destroy: destroySpy,
				onUpdate: onUpdateSpy
			} as unknown as AnyExtensionInstance;
			if (opts?.getPublic) {
				(instance as unknown as { getPublic: () => unknown }).getPublic = opts.getPublic;
			}
			return instance;
		}
	};

	return { definition, spies };
}
