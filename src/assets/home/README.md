# Foodex Home Scene Assets

- Keep dynamic text and counters out of images.
- Use transparent PNG or WebP for landmarks, characters, and effects.
- Export artwork with tight transparent bounds to make CSS placement predictable.
- Background layers may be opaque and should cover the portrait stage.
- Replace a registry URL in `HomeSceneAssets.ts`; do not import assets directly inside layer components.
- Suggested source sizes: background 1080×1920, large landmark 640×640, character 512×512, effect 512×512.
- Verify at 320px, 390px, and 768px viewport widths after replacement.

## Folder roles

- `backgrounds/`: sky, distant scenery, ground, and plaza layers
- `landmarks/`: collection, record, adventure, and buddy buildings
- `characters/`: companion art and shadows
- `effects/`: glow, sparkles, confetti, and ambient decoration
- `ui/`: optional decorative frames only; live text and controls stay in HTML
