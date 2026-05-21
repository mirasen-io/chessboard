---
'@mirasen/chessboard': patch
---

Calibrate the default mobile drag piece scale and add board-level desktop/mobile config presets.

The mobile main-renderer drag preset now uses a larger lifted piece scale while preserving the existing bottom anchor and offset.

The root package now also exports `DefaultChessboardDesktopConfig` and `DefaultChessboardMobileConfig`, which combine the matching interaction defaults with the matching main-renderer defaults for easier desktop/mobile preset usage.
