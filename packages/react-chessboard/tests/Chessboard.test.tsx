import type { MoveOutput } from '@mirasen/chessboard';
import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chessboard } from '../src/Chessboard.js';
import type { ChessboardHandle } from '../src/types.js';

type OnUIMoveHandler = (move: MoveOutput) => void;

const mockBoard = vi.hoisted(() => ({
	setPosition: vi.fn(() => true),
	move: vi.fn(),
	setOrientation: vi.fn(() => true),
	setMovability: vi.fn(() => true),
	destroy: vi.fn(),
	extensions: {
		events: {
			setOnUIMove: vi.fn()
		},
		autoPromote: {
			toQueen: false
		},
		check: {
			square: null as string | null
		}
	}
}));

vi.mock('@mirasen/chessboard', () => ({
	createBoard: vi.fn(() => mockBoard)
}));

const { createBoard } = await import('@mirasen/chessboard');

describe('Chessboard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBoard.extensions.autoPromote.toQueen = false;
		mockBoard.extensions.check.square = null;
	});

	afterEach(() => {
		cleanup();
	});

	it('mount creates core board once', () => {
		render(<Chessboard position={{ id: 1, position: 'start' }} />);

		expect(createBoard).toHaveBeenCalledTimes(1);
		expect(createBoard).toHaveBeenCalledWith({ element: expect.any(HTMLDivElement) });
	});

	it('unmount destroys core board', () => {
		const { unmount } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		unmount();

		expect(mockBoard.destroy).toHaveBeenCalledTimes(1);
	});

	it('same position id does not reapply setPosition', () => {
		const { rerender } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		mockBoard.setPosition.mockClear();

		// Same id, different payload — id wins over changed payload
		rerender(
			<Chessboard position={{ id: 1, position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR' }} />
		);

		expect(mockBoard.setPosition).not.toHaveBeenCalled();
	});

	it('new position id applies setPosition once', () => {
		const { rerender } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		mockBoard.setPosition.mockClear();

		rerender(
			<Chessboard position={{ id: 2, position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR' }} />
		);

		expect(mockBoard.setPosition).toHaveBeenCalledTimes(1);
		expect(mockBoard.setPosition).toHaveBeenCalledWith(
			'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'
		);
	});

	it('same externalMove id does not reapply move', () => {
		const { rerender } = render(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				externalMove={{ id: 1, move: { from: 'e2', to: 'e4' } }}
			/>
		);

		mockBoard.move.mockClear();

		// Same id, different payload — id wins over changed payload
		rerender(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				externalMove={{ id: 1, move: { from: 'd7', to: 'd5' } }}
			/>
		);

		expect(mockBoard.move).not.toHaveBeenCalled();
	});

	it('new externalMove id applies move once', () => {
		const { rerender } = render(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				externalMove={{ id: 1, move: { from: 'e2', to: 'e4' } }}
			/>
		);

		mockBoard.move.mockClear();

		const newMove = { from: 'd7' as const, to: 'd5' as const };
		rerender(
			<Chessboard position={{ id: 1, position: 'start' }} externalMove={{ id: 2, move: newMove }} />
		);

		expect(mockBoard.move).toHaveBeenCalledTimes(1);
		expect(mockBoard.move).toHaveBeenCalledWith(newMove);
	});

	it('orientation prop updates board orientation', () => {
		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} orientation="white" />
		);

		mockBoard.setOrientation.mockClear();

		rerender(<Chessboard position={{ id: 1, position: 'start' }} orientation="black" />);

		expect(mockBoard.setOrientation).toHaveBeenCalledWith('black');
	});

	it('movability prop updates board movability', () => {
		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} movability={{ mode: 'free' }} />
		);

		mockBoard.setMovability.mockClear();

		rerender(
			<Chessboard position={{ id: 1, position: 'start' }} movability={{ mode: 'disabled' }} />
		);

		expect(mockBoard.setMovability).toHaveBeenCalledWith({ mode: 'disabled' });
	});

	it('onUIMove uses the latest callback, not a stale callback', () => {
		const callback1 = vi.fn();
		const callback2 = vi.fn();

		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} onUIMove={callback1} />
		);

		// Get the registered handler from the first setOnUIMove call
		const registeredHandler = mockBoard.extensions.events.setOnUIMove.mock
			.calls[0][0] as OnUIMoveHandler;

		rerender(<Chessboard position={{ id: 1, position: 'start' }} onUIMove={callback2} />);

		// Simulate a UI move event through the registered handler
		const fakeMove = { from: 'e2', to: 'e4', piece: 'wP' } as unknown as MoveOutput;
		registeredHandler(fakeMove);

		expect(callback1).not.toHaveBeenCalled();
		expect(callback2).toHaveBeenCalledWith(fakeMove);
	});

	it('autoPromoteToQueen defaults to false and updates as prop changes', () => {
		const { rerender } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		expect(mockBoard.extensions.autoPromote.toQueen).toBe(false);

		rerender(<Chessboard position={{ id: 1, position: 'start' }} autoPromoteToQueen={true} />);

		expect(mockBoard.extensions.autoPromote.toQueen).toBe(true);

		rerender(<Chessboard position={{ id: 1, position: 'start' }} autoPromoteToQueen={false} />);

		expect(mockBoard.extensions.autoPromote.toQueen).toBe(false);
	});

	it('className and style are forwarded to the outer div', () => {
		const { container } = render(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				className="my-board"
				style={{ width: '400px', height: '400px' }}
			/>
		);

		const div = container.firstElementChild as HTMLDivElement;
		expect(div.className).toBe('my-board');
		expect(div.style.width).toBe('400px');
		expect(div.style.height).toBe('400px');
	});

	it('checkSquare prop sets extensions.check.square', () => {
		render(<Chessboard position={{ id: 1, position: 'start' }} checkSquare="e1" />);

		expect(mockBoard.extensions.check.square).toBe('e1');
	});

	it('checkSquare={null} clears extensions.check.square', () => {
		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} checkSquare="e1" />
		);

		rerender(<Chessboard position={{ id: 1, position: 'start' }} checkSquare={null} />);

		expect(mockBoard.extensions.check.square).toBeNull();
	});

	it('checkSquare same value on re-render does not re-assign', () => {
		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} checkSquare="e1" />
		);

		const assignCount = { n: 0 };
		const original = mockBoard.extensions.check.square;
		Object.defineProperty(mockBoard.extensions.check, 'square', {
			get: () => original,
			set: () => {
				assignCount.n++;
			},
			configurable: true
		});

		rerender(<Chessboard position={{ id: 1, position: 'start' }} checkSquare="e1" />);

		expect(assignCount.n).toBe(0);

		Object.defineProperty(mockBoard.extensions.check, 'square', {
			value: null,
			writable: true,
			configurable: true
		});
	});

	it('ref is null before mount', () => {
		const ref = createRef<ChessboardHandle>();
		expect(ref.current).toBeNull();
	});

	it('ref.current equals the mock board instance after mount', () => {
		const ref = createRef<ChessboardHandle>();
		render(<Chessboard ref={ref} position={{ id: 1, position: 'start' }} />);

		expect(ref.current).toBe(mockBoard);
	});

	it('ref.current is null after unmount', () => {
		const ref = createRef<ChessboardHandle>();
		const { unmount } = render(<Chessboard ref={ref} position={{ id: 1, position: 'start' }} />);

		unmount();

		expect(ref.current).toBeNull();
	});

	it('replacing object ref: old ref is cleared, new ref receives the same board instance', () => {
		const refA = createRef<ChessboardHandle>();
		const refB = createRef<ChessboardHandle>();

		const { rerender } = render(<Chessboard ref={refA} position={{ id: 1, position: 'start' }} />);

		const boardInstance = refA.current;
		expect(boardInstance).toBe(mockBoard);

		rerender(<Chessboard ref={refB} position={{ id: 1, position: 'start' }} />);

		expect(refA.current).toBeNull();
		expect(refB.current).toBe(boardInstance);
		expect(mockBoard.destroy).not.toHaveBeenCalled();
	});

	it('replacing object ref: new ref is null after unmount', () => {
		const refA = createRef<ChessboardHandle>();
		const refB = createRef<ChessboardHandle>();

		const { rerender, unmount } = render(
			<Chessboard ref={refA} position={{ id: 1, position: 'start' }} />
		);
		rerender(<Chessboard ref={refB} position={{ id: 1, position: 'start' }} />);

		unmount();

		expect(refB.current).toBeNull();
	});

	it('replacing callback ref: old callback receives null, new callback receives the same board', () => {
		const callbackA = vi.fn();
		const callbackB = vi.fn();

		const { rerender } = render(
			<Chessboard ref={callbackA} position={{ id: 1, position: 'start' }} />
		);

		expect(callbackA).toHaveBeenCalledTimes(1);
		expect(callbackA).toHaveBeenCalledWith(mockBoard);

		rerender(<Chessboard ref={callbackB} position={{ id: 1, position: 'start' }} />);

		expect(callbackA).toHaveBeenCalledWith(null);
		expect(callbackB).toHaveBeenCalledWith(mockBoard);
		expect(mockBoard.destroy).not.toHaveBeenCalled();
	});

	it('replacing callback ref: new callback receives null after unmount', () => {
		const callbackA = vi.fn();
		const callbackB = vi.fn();

		const { rerender, unmount } = render(
			<Chessboard ref={callbackA} position={{ id: 1, position: 'start' }} />
		);
		rerender(<Chessboard ref={callbackB} position={{ id: 1, position: 'start' }} />);

		unmount();

		expect(callbackB).toHaveBeenLastCalledWith(null);
	});
});
