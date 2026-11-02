import {
	Chessboard,
	MovabilityInput,
	type BoardOrientation,
	type ChessboardHandle,
	type ColorInput,
	type MoveOutput,
	type MoveRequestInput
} from '@mirasen/react-chessboard';
import {
	toBoardMove,
	toBoardMoveDestinations,
	toGameMove
} from '@mirasen/react-chessboard/adapters/chessjs';
import { Chess } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const COMPUTER_DELAY = 800;

export function App() {
	const gameRef = useRef(new Chess());
	const boardRef = useRef<ChessboardHandle>(null);
	const gameVersionRef = useRef(0);
	const computerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [fen, setFen] = useState(gameRef.current.fen());
	const [positionId, setPositionId] = useState(1);
	const [externalMoveId, setExternalMoveId] = useState(0);
	const [externalMove, setExternalMove] = useState<MoveRequestInput | null>(null);
	const [orientation, setOrientation] = useState<BoardOrientation>('white');
	const [autoPromote, setAutoPromote] = useState(true);
	const [status, setStatus] = useState('Your move');
	const [lastMove, setLastMove] = useState<string | null>(null);

	const checkSquare: ColorInput | null = gameRef.current.isCheck()
		? (gameRef.current.turn() as ColorInput)
		: null;

	useEffect(() => {
		boardRef.current?.extensions.annotations.circle('e2', { color: 'green' });
	}, []);

	const playerColor = 'w';

	function getStatus(): string {
		const chess = gameRef.current;
		if (chess.isCheckmate()) return 'Checkmate!';
		if (chess.isDraw()) return 'Draw';
		if (chess.isGameOver()) return 'Game over';
		if (chess.isCheck())
			return chess.turn() === playerColor ? 'Check! Your move' : 'Check! Computer thinking…';
		return chess.turn() === playerColor ? 'Your move' : 'Computer thinking…';
	}

	function makeComputerMove(version: number) {
		const chess = gameRef.current;
		if (gameVersionRef.current !== version) return;
		if (chess.isGameOver()) return;

		const moves = chess.moves({ verbose: true });
		if (moves.length === 0) return;

		const randomMove = moves[Math.floor(Math.random() * moves.length)]!;
		const appliedMove = chess.move(randomMove);
		const boardMove = toBoardMove(appliedMove);

		setExternalMove(boardMove);
		setExternalMoveId((id) => id + 1);
		setFen(chess.fen());
		setStatus(getStatus());
		setLastMove(`Computer: ${appliedMove.from}→${appliedMove.to}`);
	}

	function scheduleComputerMove() {
		const version = gameVersionRef.current;
		computerTimeoutRef.current = setTimeout(() => {
			computerTimeoutRef.current = null;
			makeComputerMove(version);
		}, COMPUTER_DELAY);
	}

	const movability = useMemo(() => {
		const chess = gameRef.current;
		return {
			mode: 'strict',
			destinations: (source) => {
				if (chess.turn() !== playerColor) return undefined;
				const moves = chess.moves({ square: source, verbose: true });
				if (moves.length === 0) return undefined;
				return toBoardMoveDestinations(moves);
			}
		} as MovabilityInput;
	}, [fen]);

	const onUIMove = useCallback((move: MoveOutput) => {
		const chess = gameRef.current;

		try {
			const gameMove = toGameMove(move);
			chess.move(gameMove);
			setFen(chess.fen());
			setPositionId((id) => id + 1);
			setLastMove(`You: ${move.from}→${move.to}${move.promotedTo ? `=${move.promotedTo}` : ''}`);
			setStatus(getStatus());

			if (!chess.isGameOver()) {
				scheduleComputerMove();
			}
		} catch (e) {
			setPositionId((id) => id + 1);
			setStatus(`Error: ${e instanceof Error ? e.message : 'unknown'}`);
		}
	}, []);

	const handleReset = () => {
		gameVersionRef.current++;
		if (computerTimeoutRef.current !== null) {
			clearTimeout(computerTimeoutRef.current);
			computerTimeoutRef.current = null;
		}
		gameRef.current = new Chess();
		setFen(gameRef.current.fen());
		setPositionId((id) => id + 1);
		setExternalMove(null);
		setLastMove(null);
		setStatus('Your move');
	};

	const handleFlip = () => {
		setOrientation((o: BoardOrientation) => (o === 'white' ? 'black' : 'white'));
	};

	return (
		<div className="app">
			<h1>@mirasen/react-chessboard smoke test</h1>
			<p className="subtitle">Play against a random-move computer</p>

			<div className="board-container">
				<Chessboard
					ref={boardRef}
					position={{ id: positionId, position: fen }}
					externalMove={
						externalMove && externalMoveId > 0
							? { id: externalMoveId, move: externalMove }
							: undefined
					}
					orientation={orientation}
					movability={movability}
					autoPromoteToQueen={autoPromote}
					checkSquare={checkSquare}
					onUIMove={onUIMove}
					style={{ width: '100%', height: '100%' }}
				/>
			</div>

			<div className="controls">
				<button onClick={handleReset}>Reset</button>
				<button onClick={handleFlip}>Flip board</button>
				<label>
					<input
						type="checkbox"
						checked={autoPromote}
						onChange={(e) => setAutoPromote(e.target.checked)}
					/>
					Auto-promote to queen
				</label>
			</div>

			<div className="status">
				<p className="game-status">
					<strong>{status}</strong>
				</p>
				{lastMove && <p>{lastMove}</p>}
				<p>
					<code>{fen}</code>
				</p>
			</div>
		</div>
	);
}
