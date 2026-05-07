export interface SvgIdResolver {
	readonly prefix: string;
	makeId(scope: string, localId: string): string;
	makeHref(scope: string, localId: string): string;
}

let nextId = 0;

export function createSvgIdResolver(): SvgIdResolver {
	const prefix = `cb${nextId++}`;

	function makeId(scope: string, localId: string): string {
		return `${prefix}-${scope}-${localId}`;
	}

	function makeHref(scope: string, localId: string): string {
		return `#${makeId(scope, localId)}`;
	}

	return { prefix, makeId, makeHref };
}
