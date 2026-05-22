---
'@mirasen/chessboard': patch
---

Fix mobile lifted-piece drag clipping near board edges.

Scaled mobile drag visuals can intentionally extend outside the board viewport so the dragged piece stays visible under the user's finger. The root SVG and SvelteKit example container now allow those board-local overlay visuals to remain visible without changing layout geometry, pointer mapping, or drag behavior.
