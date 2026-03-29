import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/core/state/board/types';
import { createMutationSession } from '../../../src/core/state/mutation/session';
import { createViewState } from '../../../src/core/state/view/factory';
import type { ViewStateMutationPayloadByCause } from '../../../src/core/state/view/mutation';

describe('core/state/view', () => {
	describe('ViewState', () => {
		describe('setOrientation', () => {
			it('getOrientation returns current orientation', () => {
				const state = createViewState({ orientation: 'white' });

				expect(state.getOrientation()).toBe('white');
			});

			it('normalizes input and updates state', () => {
				const state = createViewState({ orientation: 'white' });
				const session = createMutationSession<ViewStateMutationPayloadByCause>();

				state.setOrientation('b', session);

				expect(state.getOrientation()).toBe('black');
			});

			it('changed vs no-op detection', () => {
				const state = createViewState({ orientation: 'white' });
				const session1 = createMutationSession<ViewStateMutationPayloadByCause>();
				const session2 = createMutationSession<ViewStateMutationPayloadByCause>();

				const result1 = state.setOrientation('black', session1);
				const result2 = state.setOrientation('black', session2);

				expect(result1).toBe(true);
				expect(result2).toBe(false);
			});

			it('records mutation cause view.state.setOrientation when changed', () => {
				const state = createViewState({ orientation: 'white' });
				const session = createMutationSession<ViewStateMutationPayloadByCause>();

				state.setOrientation('black', session);

				expect(session.hasMutation('view.state.setOrientation')).toBe(true);
			});
		});

		describe('getMovability', () => {
			it('returns safe owned copy of movability', () => {
				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: { [12 as Square]: [20, 28] as Square[] }
					}
				});

				const movability = state.getMovability();

				expect(movability.mode).toBe('strict');
				if (movability.mode === 'strict') {
					expect(typeof movability.destinations).not.toBe('function');
					const destinations = movability.destinations as Record<Square, readonly Square[]>;
					expect(destinations[12 as Square]).toEqual([20, 28]);
				}
			});

			it('mutating getMovability return does not affect internal state', () => {
				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: { [12 as Square]: [20, 28] as Square[] }
					}
				});

				const movability = state.getMovability();
				if (movability.mode === 'strict') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(movability as any).destinations[12] = [99];
				}

				const newMovability = state.getMovability();
				if (newMovability.mode === 'strict') {
					const destinations = newMovability.destinations as Record<Square, readonly Square[]>;
					expect(destinations[12 as Square]).toEqual([20, 28]);
				}
			});
		});

		describe('setMovability - record-based', () => {
			it('init path stores safe owned copy', () => {
				const originalDestinations = { [12 as Square]: [20, 28] as Square[] };
				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: originalDestinations
					}
				});

				// Mutate original
				originalDestinations[12] = [99] as unknown as Square[];

				const movability = state.getMovability();
				if (movability.mode === 'strict') {
					const destinations = movability.destinations as Record<Square, readonly Square[]>;
					expect(destinations[12 as Square]).toEqual([20, 28]);
				}
			});

			it('setMovability stores safe owned copy', () => {
				const state = createViewState();
				const session = createMutationSession<ViewStateMutationPayloadByCause>();

				const inputDestinations = { [12 as Square]: [20, 28] as Square[] };
				state.setMovability(
					{
						mode: 'strict',
						destinations: inputDestinations
					},
					session
				);

				// Mutate input
				inputDestinations[12] = [99] as unknown as Square[];

				const movability = state.getMovability();
				if (movability.mode === 'strict') {
					const destinations = movability.destinations as Record<Square, readonly Square[]>;
					expect(destinations[12 as Square]).toEqual([20, 28]);
				}
			});

			it('changed vs no-op detection for record-based movability', () => {
				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: { [12 as Square]: [20, 28] as Square[] }
					}
				});
				const session1 = createMutationSession<ViewStateMutationPayloadByCause>();
				const session2 = createMutationSession<ViewStateMutationPayloadByCause>();

				const result1 = state.setMovability(
					{
						mode: 'strict',
						destinations: { [12 as Square]: [20, 28] as Square[] }
					},
					session1
				);

				const result2 = state.setMovability(
					{
						mode: 'strict',
						destinations: { [12 as Square]: [20, 30] as Square[] }
					},
					session2
				);

				expect(result1).toBe(false); // no-op: same structure
				expect(result2).toBe(true); // changed: different destinations
			});
		});

		describe('setMovability - resolver-based', () => {
			it('resolver function reference preserved and callable', () => {
				const resolver = (source: Square) => {
					if (source === 12) return [20, 28] as Square[];
					return undefined;
				};

				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: resolver
					}
				});

				const movability = state.getMovability();
				if (movability.mode === 'strict' && typeof movability.destinations === 'function') {
					const result = movability.destinations(12 as Square);
					expect(result).toEqual([20, 28]);
				} else {
					throw new Error('Expected resolver-based movability');
				}
			});

			it('reports no change for the same resolver reference', () => {
				const resolver = (source: Square) => {
					if (source === 12) return [20, 28] as Square[];
					return undefined;
				};

				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: resolver
					}
				});

				const session = createMutationSession<ViewStateMutationPayloadByCause>();
				const result = state.setMovability(
					{
						mode: 'strict',
						destinations: resolver
					},
					session
				);

				expect(result).toBe(false);
			});

			it('different resolver reference reports changed and records mutation', () => {
				const resolver1 = (source: Square) => {
					if (source === 12) return [20, 28] as Square[];
					return undefined;
				};

				const resolver2 = (source: Square) => {
					if (source === 12) return [20, 28] as Square[];
					return undefined;
				};

				const state = createViewState({
					movability: {
						mode: 'strict',
						destinations: resolver1
					}
				});

				const session = createMutationSession<ViewStateMutationPayloadByCause>();
				const result = state.setMovability(
					{
						mode: 'strict',
						destinations: resolver2
					},
					session
				);

				expect(result).toBe(true);
				expect(session.hasMutation('view.state.setMovability')).toBe(true);
			});
		});

		describe('setMovability', () => {
			it('records mutation cause view.state.setMovability when changed', () => {
				const state = createViewState();
				const session = createMutationSession<ViewStateMutationPayloadByCause>();

				state.setMovability({ mode: 'free' }, session);

				expect(session.hasMutation('view.state.setMovability')).toBe(true);
			});
		});

		describe('getSnapshot', () => {
			it('returns safe owned copies', () => {
				const state = createViewState({
					orientation: 'black',
					movability: {
						mode: 'strict',
						destinations: { [12 as Square]: [20, 28] as Square[] }
					}
				});

				const snapshot = state.getSnapshot();

				expect(snapshot.orientation).toBe('black');
				expect(snapshot.movability.mode).toBe('strict');
			});

			it('mutating snapshot does not affect internal state', () => {
				const state = createViewState({
					orientation: 'white',
					movability: {
						mode: 'strict',
						destinations: { [12 as Square]: [20, 28] as Square[] }
					}
				});

				const snapshot = state.getSnapshot();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(snapshot as any).orientation = 'black';
				if (snapshot.movability.mode === 'strict') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(snapshot.movability as any).destinations[12] = [99];
				}

				const newSnapshot = state.getSnapshot();
				expect(newSnapshot.orientation).toBe('white');
				if (newSnapshot.movability.mode === 'strict') {
					const destinations = newSnapshot.movability.destinations as Record<
						Square,
						readonly Square[]
					>;
					expect(destinations[12 as Square]).toEqual([20, 28]);
				}
			});
		});
	});
});
