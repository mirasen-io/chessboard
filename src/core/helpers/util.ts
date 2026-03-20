export function setsEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
	if (a.size !== b.size) return false;
	for (const value of a) {
		if (!b.has(value)) return false;
	}
	return true;
}
