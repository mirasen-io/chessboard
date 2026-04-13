export function assertNever(errorConstructor: ErrorConstructor, msg: string, x: unknown): never {
	throw new errorConstructor(`${msg}: ${String(x)}`);
}
