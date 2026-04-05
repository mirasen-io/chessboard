import type { Color, Role } from '../../state/board/types';

export function cburnettPieceUrl(color: Color, role: Role): string {
	const key = `${color === 'white' ? 'w' : 'b'}${ROLE_KEY[role]}`;
	return PIECE_URLS[key];
}

const ROLE_KEY: Record<Role, string> = {
	king: 'k',
	queen: 'q',
	rook: 'r',
	bishop: 'b',
	knight: 'n',
	pawn: 'p'
};

// Static URL table — each entry uses a literal path so bundlers can resolve it.
const PIECE_URLS: Record<string, string> = {
	wk: new URL('../../../assets/pieces/cburnett/wk.svg', import.meta.url).toString(),
	wq: new URL('../../../assets/pieces/cburnett/wq.svg', import.meta.url).toString(),
	wr: new URL('../../../assets/pieces/cburnett/wr.svg', import.meta.url).toString(),
	wb: new URL('../../../assets/pieces/cburnett/wb.svg', import.meta.url).toString(),
	wn: new URL('../../../assets/pieces/cburnett/wn.svg', import.meta.url).toString(),
	wp: new URL('../../../assets/pieces/cburnett/wp.svg', import.meta.url).toString(),
	bk: new URL('../../../assets/pieces/cburnett/bk.svg', import.meta.url).toString(),
	bq: new URL('../../../assets/pieces/cburnett/bq.svg', import.meta.url).toString(),
	br: new URL('../../../assets/pieces/cburnett/br.svg', import.meta.url).toString(),
	bb: new URL('../../../assets/pieces/cburnett/bb.svg', import.meta.url).toString(),
	bn: new URL('../../../assets/pieces/cburnett/bn.svg', import.meta.url).toString(),
	bp: new URL('../../../assets/pieces/cburnett/bp.svg', import.meta.url).toString()
};
