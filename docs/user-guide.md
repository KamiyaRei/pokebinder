# User guide



A local, multilingual tracker for building a physical National Pokédex binder: one card per Pokémon, with a place for every species.

- 1025 species, searchable across English/Japanese names and Russian aliases.
- Configurable binder pages with portrait cards, pocket maps and progress statistics.
- English, Japanese and Russian interfaces, plus a Pokédex-inspired dark theme.
- Browser-local progress, recovery points and portable JSON backups.
- No account, server, build step or third-party JavaScript dependencies.

## Get started from GitHub

```sh
git clone https://github.com/KamiyaRei/pokebinder.git
cd pokebinder
node scripts/prepare.cjs --images
```

Use Node.js 22 or newer for preparation. The command uses the bundled dataset and downloads the 1025 primary artwork files from the official Pokédex. Once it finishes, open `index.html`. Internet is needed for that initial download; afterwards the main app works offline. Artwork is excluded from Git to keep the source repository compact. Existing local copies already containing `assets/` need no download.

Read [CHANGELOG.md](../CHANGELOG.md) for release history and [third-party.md](third-party.md) for data and artwork attribution.

## Launch

Open `index.html` in your normal browser, or double-click `open.cmd`. No installation or server is needed. Species data and all 1025 prepared Pokémon images work offline. Japanese card metadata is bundled; printed-card images and new English catalog searches require internet.

## Languages

English is the default. The header switches between English, Japanese and Russian and remembers the choice. All interface text, types, regions, settings, accessibility labels, confirmations and errors are translated. Japanese mode shows Japanese Pokémon names first; English and Russian modes use English species names with Japanese secondary names. Russian name search supports approximate English transliteration and additional aliases for common Pokémon; it is not an official complete Russian naming dataset. Search supports all names regardless of interface language.

## Binder settings

Settings includes 4×3, 3×3, 2×2 and 4×4 page-layout presets. Custom layouts support 1–6 columns, 1–6 rows and 1–200 pages per binder. A page means ONE SIDE of a sheet. For a double-sided binder, 40 pages corresponds to 20 physical sheets. Default: 4 columns × 3 rows, 40 pages, 480 cards per binder. Species are ordered by National Pokédex number, left to right, then top to bottom. The number of binders is calculated automatically. Marks are stored by species ID, so layout changes retain all collected cards and only recalculate positions.

Each species has one pocket; alternative forms do not consume extra pockets. Portrait cards use the 63:88 aspect ratio. Both the binder page and its small location preview show a 3-ring spine, page sleeves and portrait cards. Page thumbnails and binder summary rings show collection progress. Unused final pockets remain empty.

## Storage and backup

Version 0.05 saves progress, exact-card choices, selected Pokémon, language, theme and layout in localStorage under `pokebinder.local.0.05`. Previous 0.03 and 0.04 saves use separate keys and are preserved. To upgrade, export Backup in your previous application, then Restore it in 0.05. Continue using the same browser, profile and folder after migration.

The last five collection/layout changes create local recovery points. Navigation and language changes do not consume recovery points. Settings → Restore previous save returns to a prior collection and layout after confirmation. These recovery points are in the SAME browser; they do not protect against clearing browser data or losing the device.

Download a JSON backup regularly using Backup or Settings → Download backup. It includes marks, exact-card choices, binder layout, theme and language. Restore validates the data, asks for confirmation, and imports the backup. Schema 1 backups remain supported; current exports use schema 2, which 0.03 cannot import. Keep your old backup for rollback. Moving to another browser/computer or clearing browser data requires an exported backup. Private browsing may discard storage. Storage failures display a warning. Backup timestamps indicate that a download was initiated, not that an external copy is guaranteed to exist.

Printed-card image URLs are included in backups; image binaries and catalog caches are not. New browsers/devices may need internet for artwork. Species artwork is the fallback if a card scan cannot load; the saved card identity remains intact.

## Exact printed cards

Open a Pokémon and choose **Choose card**. Card language is independent of interface language. Filter by set/expansion, search by name, set code, known collector number or official catalog ID, and sort the results. Select a card, choose its finish and confirm **Use this inserted card**. This saves the printing and marks the species as inserted. The usual collected mark also works without selecting a printing.

**Change card** replaces the printing. **Clear card link** removes only the exact choice and keeps the collected mark. Unmarking retains the saved printing; re-marking displays it again. **Add manually** records cards outside the catalog without requiring artwork.

Japanese lookup uses the bundled official search-index snapshot from October 15, 2026: 17,534 Pokémon-card entries across 450 pages. Species are matched from the card's own National Dex line when available, otherwise by longest non-overlapping Japanese species names in its title. Evolution/attack text is not used. Two special entries without a National Dex species are excluded from species selection.

Detailed metadata is available for 1,188 entries. The rest retain names, set codes and official image URLs; missing collector numbers can be entered manually from your physical card. Catalog IDs are labeled separately from collector numbers. One official source record has no front scan; a placeholder is not presented as an actual card front. Older source images can be low resolution. The [import audit](../data/japanese-catalog-audit.json) records detailed/title-based coverage.

English search uses TCGdex and excludes digital Pokémon TCG Pocket sets. Existing TCGdex choices imported from 0.04 remain valid. Catalog coverage does not guarantee every historical printing. Japanese finish is selected manually; artwork can be shared across finishes and editions.

## Keyboard

Left/right arrows: previous/next species. Space: mark/unmark card. `/`: focus search. Shortcuts are inactive inside editable controls, buttons and the settings dialog.

## Data and development

Dataset snapshot: October 15, 2026.
- Official Japanese names, National IDs, types, height, weight, artwork and form metadata: https://zukan.pokemon.co.jp/zukan-api/api/search/?limit=2000&page=1
- English names and generations: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
- Artwork © Pokémon / Nintendo / Creatures / GAME FREAK.

`data/source/official.json`, `data/source/masters.json`, `data/source/names.csv`, and `data/source/species.csv` retain the source data. `node scripts/prepare.cjs` rebuilds `data/pokedex.js`; adding `--images` downloads missing primary-form images. No automatic dataset updates. `src/i18n.js` contains the three translation dictionaries. `node tests/check.cjs` validates data, downloaded images and behavior. `node tests/check.cjs --skip-images` runs the source-only checks before artwork is downloaded. Code identifiers, file names and development documentation are in English; localized content remains in its respective language.

## Appearance

Missing cards on the main binder page have gently reduced artwork saturation and slightly quieter backgrounds. Names and controls retain full readability, with no additional badges or missing-card text. Collected cards retain full color and their existing check mark. Page thumbnails use compact fixed widths rather than expanding with the window.

The header moon/sun button and Settings → Appearance switch between Light and Pokédex Dark. The dark theme uses a charcoal interface, a red binder shell and green collection indicators. Theme preference is saved and exported with the collection. Older backups remain supported. Theme changes do not consume collection recovery points.
