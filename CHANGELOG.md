# Changelog

## 0.05 — 2026-10-15

- Bundle the official Japanese Pokémon-card search index: 17,534 entries with official image URLs, including 19 Bulbasaur cards.
- Search Japanese cards locally, filter by set, distinguish catalog IDs from collector numbers and optionally enter missing collector numbers.
- Report source coverage and import validation; retain source-specific artwork and foil-variation limitations.
- Extend automated checks to the card provider and Japanese database.

## 0.04 — 2026-10-15 (local preview)

- Add optional exact printed-card selection, set filters, finish choices and manual entries.
- Show chosen card fronts in the binder and location preview.
- Include exact-card choices in schema 2 backups while retaining schema 1 imports.
- Preserve collection marks when clearing a card link and preserve printing choices when unmarking a Pokémon.

## 0.03 — 2026-10-15

- Organize app code, source data, scripts, tests and documentation into dedicated directories while keeping the root launch URL stable.
- Add real application screenshots and a focused README gallery.
- Slightly deepen the muted appearance of missing binder cards.
- Add Pokédex Dark with persistent theme preferences and backup support.
- Gently desaturate uncollected artwork on the main binder page, without extra labels.
- Make page thumbnails compact while retaining the filled-pocket map.

## 0.02 — 2026-10-15

- Add English, Japanese and Russian interface languages; default to English.
- Introduce portrait cards with 63:88 proportions, sleeve pages and binder rings.
- Add 4×3, 3×3, 2×2 and 4×4 presets, custom layouts and configurable page counts.
- Add per-binder statistics, page progress and five local recovery points.
- Keep species marks when changing binder layout; extend backups with settings.

## 0.01 — 2026-10-15

- Initial local tracker with all 1025 National Pokédex species and primary artwork.
- Search by number, English/Japanese names and approximate Russian aliases.
- Add collection marks, previous/next navigation, binder positions and JSON backups.
