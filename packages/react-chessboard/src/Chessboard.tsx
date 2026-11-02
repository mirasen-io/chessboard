import { createBoard, type Chessboard as CoreChessboard } from '@mirasen/chessboard';
import { forwardRef, useEffect, useRef } from 'react';
import type { ChessboardHandle, ChessboardProps } from './types.js';

export const Chessboard = forwardRef<ChessboardHandle, ChessboardProps>(function Chessboard(
	{
		position,
		externalMove,
		orientation,
		movability,
		onUIMove,
		autoPromoteToQueen,
		checkSquare,
		className,
		style
	}: ChessboardProps,
	ref
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const boardRef = useRef<CoreChessboard | null>(null);
	const onUIMoveRef = useRef(onUIMove);
	const lastPositionIdRef = useRef<string | number | null>(null);
	const lastExternalMoveIdRef = useRef<string | number | null>(null);

	// Keep latest callback in ref
	onUIMoveRef.current = onUIMove;

	// Board creation and destruction
	useEffect(() => {
		if (!containerRef.current) return;

		const board = createBoard({ element: containerRef.current });
		boardRef.current = board;

		board.extensions.events.setOnUIMove((move) => {
			onUIMoveRef.current?.(move);
		});

		return () => {
			board.extensions.events.setOnUIMove(null);
			board.destroy();
			boardRef.current = null;
		};
	}, []);

	// Forward external ref to the same board instance
	useEffect(() => {
		const board = boardRef.current;
		if (!board) return;

		if (typeof ref === 'function') {
			ref(board);
			return () => ref(null);
		}

		if (ref) {
			ref.current = board;
			return () => {
				ref.current = null;
			};
		}
	}, [ref]);

	// Position sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (lastPositionIdRef.current === position.id) return;
		boardRef.current.setPosition(position.position);
		lastPositionIdRef.current = position.id;
	}, [position.id, position.position]);

	// External move sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (!externalMove) return;
		if (lastExternalMoveIdRef.current === externalMove.id) return;
		boardRef.current.move(externalMove.move);
		lastExternalMoveIdRef.current = externalMove.id;
	}, [externalMove?.id, externalMove?.move]);

	// Orientation sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (orientation === undefined) return;
		boardRef.current.setOrientation(orientation);
	}, [orientation]);

	// Movability sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (movability === undefined) return;
		boardRef.current.setMovability(movability);
	}, [movability]);

	// autoPromoteToQueen sync
	useEffect(() => {
		if (!boardRef.current) return;
		boardRef.current.extensions.autoPromote.toQueen = autoPromoteToQueen ?? false;
	}, [autoPromoteToQueen]);

	// checkSquare sync
	useEffect(() => {
		if (!boardRef.current) return;
		boardRef.current.extensions.check.square = checkSquare ?? null;
	}, [checkSquare]);

	return <div ref={containerRef} className={className} style={style} />;
});
