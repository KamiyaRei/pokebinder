# PokéBinder

**Version 0.03** · Created and maintained by [KamiyaRei](https://github.com/KamiyaRei)

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
node prepare.cjs --images
```

Use Node.js 22 or newer for preparation. The command uses the bundled dataset and downloads the 1025 primary artwork files from the official Pokédex. Once it finishes, open `index.html`. Internet is needed for that initial download; afterwards the main app works offline. Artwork is excluded from Git to keep the source repository compact. Existing local copies already containing `assets/` need no download.

Read [CHANGELOG.md](CHANGELOG.md) for release history and [THIRD_PARTY.md](THIRD_PARTY.md) for data and artwork attribution.

## Launch

Open `index.html` in your normal browser, or double-click `open.cmd`. No installation or server is needed. The dataset and all 1025 Pokémon images work offline. Only external source links require an internet connection.

## Languages

English is the default. The header switches between English, Japanese and Russian and remembers the choice. All interface text, types, regions, settings, accessibility labels, confirmations and errors are translated. Japanese mode shows Japanese Pokémon names first; English and Russian modes use English species names with Japanese secondary names. Russian name search supports approximate English transliteration and additional aliases for common Pokémon; it is not an official complete Russian naming dataset. Search supports all names regardless of interface language.

## Binder settings

Settings includes 4×3, 3×3, 2×2 and 4×4 page-layout presets. Custom layouts support 1–6 columns, 1–6 rows and 1–200 pages per binder. A page means ONE SIDE of a sheet. For a double-sided binder, 40 pages corresponds to 20 physical sheets. Default: 4 columns × 3 rows, 40 pages, 480 cards per binder. Species are ordered by National Pokédex number, left to right, then top to bottom. The number of binders is calculated automatically. Marks are stored by species ID, so layout changes retain all collected cards and only recalculate positions.

Each species has one pocket; alternative forms do not consume extra pockets. Portrait cards use the 63:88 aspect ratio. Both the binder page and its small location preview show a 3-ring spine, page sleeves and portrait cards. Page thumbnails and binder summary rings show collection progress. Unused final pockets remain empty.

## Storage and backup

Progress, selected Pokémon, language and binder layout are stored automatically in localStorage under `pokebinder.v1`. This key and the original `index.html` location are kept stable for compatibility with version 1. Continue using the same browser, profile and folder. Updating the app files does not intentionally modify browser storage.

The last five collection/layout changes create local recovery points. Navigation and language changes do not consume recovery points. Settings → Restore previous save returns to a prior collection and layout after confirmation. These recovery points are in the SAME browser; they do not protect against clearing browser data or losing the device.

Download a JSON backup regularly using Backup or Settings → Download backup. It includes marks, binder layout and language. Restore validates IDs/settings, asks for confirmation, and imports the backup. Original version 1 backups containing just marks remain supported. Moving to a different browser/computer or clearing browser data requires a downloaded backup. Private browsing may discard storage. Storage failures display a warning. Backup timestamps indicate that a download was initiated, not that an external copy is guaranteed to exist.

## Keyboard

Left/right arrows: previous/next species. Space: mark/unmark card. `/`: focus search. Shortcuts are inactive inside editable controls, buttons and the settings dialog.

## Data and development

Dataset snapshot: October 15, 2026.
- Official Japanese names, National IDs, types, height, weight, artwork and form metadata: https://zukan.pokemon.co.jp/zukan-api/api/search/?limit=2000&page=1
- English names and generations: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
- Artwork © Pokémon / Nintendo / Creatures / GAME FREAK.

`official.json`, `masters.json`, `names.csv`, and `species.csv` retain the source data. `node prepare.cjs` rebuilds `data.js`; adding `--images` downloads missing primary-form images. No automatic dataset updates. `i18n.js` contains the three translation dictionaries. `node check.cjs` validates data, downloaded images and behavior. `node check.cjs --skip-images` runs the source-only checks before artwork is downloaded. Code identifiers, file names and development documentation are in English; localized content remains in its respective language.

## Appearance

Missing cards on the main binder page have gently reduced artwork saturation and slightly quieter backgrounds. Names and controls retain full readability, with no additional badges or missing-card text. Collected cards retain full color and their existing check mark. Page thumbnails use compact fixed widths rather than expanding with the window.

The header moon/sun button and Settings → Appearance switch between Light and Pokédex Dark. The dark theme uses a charcoal interface, a red binder shell and green collection indicators. Theme preference is saved and exported with the collection. Older backups remain supported. Theme changes do not consume collection recovery points.

