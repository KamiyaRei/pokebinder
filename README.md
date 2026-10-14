<div align="center">

# PokéBinder

**Your National Dex. Your physical binder.**

One Pokémon per pocket — with a place for every card you collect.

English · 日本語 · Русский

[Quick start](#quick-start) · [User guide](docs/user-guide.md) · [Changelog](CHANGELOG.md)

</div>

![Pokédex search and collection overview](docs/screenshots/pokedex-light.jpg)

## A collection you can see

| Feature | What it does |
| :--- | :--- |
| National Pokédex | All 1025 species, with English and Japanese names, types and artwork. |
| Your binder layout | 4×3, 3×3, 2×2, 4×4 presets, or custom columns, rows and page counts. |
| A pocket for every Pokémon | National-number order, exact binder/page/pocket positions and previous/next navigation. |
| Visible progress | Collected cards stay in full color; missing cards are gently muted. Page maps show every filled pocket. |
| Three languages | English, Japanese and Russian interfaces. Search works across all available names. |
| Two themes | Light and Pokédex Dark, with a red binder shell and green collection indicators. |
| Your own data | Automatic local saving, five recovery points and portable JSON backups. |

No account, server, build step or third-party JavaScript dependencies are needed to use the prepared app.

## Inside the binder

| Light | Pokédex Dark |
| :---: | :---: |
| ![Light binder with collected and missing cards](docs/screenshots/binder-light.jpg) | ![Dark binder with collected and missing cards](docs/screenshots/binder-dark.jpg) |

<details>
<summary><strong>Binder layout and storage settings</strong></summary>

![Layout and backup settings](docs/screenshots/settings-dark.jpg)

</details>

Screenshots show a demonstration collection, not a user's private progress.

## Quick start

Clone the repository and download the artwork once:

```sh
git clone https://github.com/KamiyaRei/pokebinder.git
cd pokebinder
node scripts/prepare.cjs --images
```

Preparation requires **Node.js 22 or newer** and an internet connection. Then open **`index.html`** in your normal browser, or double-click **`open.cmd`** on Windows. Afterwards, the primary artwork, Pokédex, search and collection tracking work offline. Downloaded artwork is excluded from Git; existing copies containing `assets/` need no download.

A page means **one side of a sheet**. The default 4×3 layout has 12 pockets per page and 40 pages per binder: 480 pockets. Double-sided sleeves mean 20 physical sheets. Changing the layout keeps collection marks and recalculates their positions.

## Keep your collection safe

Progress, layout, language and theme are saved in this browser. Download a **Backup** regularly and use **Restore** when moving to another browser or device. Local recovery points cannot protect against browser data being cleared. The root `index.html` entry point and storage key remain stable across this project reorganization.

See the [user guide](docs/user-guide.md) for storage details, keyboard controls and supported search names.

## Project layout

```text
pokebinder/
├── index.html            # Stable browser entry point
├── open.cmd              # Windows launcher
├── src/                  # App behavior, translations and styles
├── data/
│   ├── pokedex.js        # Prepared species dataset
│   └── source/           # Original data snapshots
├── scripts/              # Dataset/artwork preparation and local preview
├── tests/                # Data, settings and collection checks
├── docs/                 # Guide, attribution and screenshots
└── .github/workflows/    # Automated checks
```

`assets/` is created by the preparation script and is ignored by Git. Personal backup files and local `.versions/` snapshots are ignored too.

## Development

```sh
node scripts/prepare.cjs         # Rebuild the dataset from bundled sources
node tests/check.cjs --skip-images
node tests/check.cjs             # Also validate downloaded PNGs
node scripts/preview.cjs         # Optional preview: http://127.0.0.1:8765
```

The checks exercise species data, multilingual search, layout boundaries, settings persistence, backup compatibility and recovery. Opening the app through HTTP uses a different browser-storage origin from the file-based app; export/import a backup when switching.

## Data & artwork

Species snapshot: October 15, 2026. Japanese data and primary artwork come from the [official Pokémon Pokédex](https://zukan.pokemon.co.jp/); English names and generations come from [PokeAPI](https://github.com/PokeAPI/pokeapi). Alternate forms currently share the species pocket.

Independent fan project. Pokémon artwork, names and trademarks belong to their respective owners. See [data and artwork attribution](docs/third-party.md).
