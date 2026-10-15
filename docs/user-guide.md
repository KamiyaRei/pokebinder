# User guide

## Start

Use Node.js 22+ to run node scripts/prepare.cjs --images once, then open index.html or open.cmd. Species artwork is downloaded into the ignored assets/ directory. A prepared copy works without an app server.

## Encyclopedia

Pokédex is a species reference with standard images and facts. Search by National number or name, with English/Japanese names and supported Russian aliases available in any interface language. Filter by generation and type. Previous/next controls and arrow keys navigate species.

Settings → Show collection in Pokédex optionally restores exact card images, marks and progress here. The default is the clean reference view.

## Pokédex binders

Each binder has independent columns, rows and pages. National Dex numbers continue through their combined capacity, skipping free binders. Choose Edit binder to change its name, cover color or size. Species marks and exact printing links follow their species when capacity changes. Extra default binders are added if more room is needed for all 1025 species.

A page is one side of a sheet. For 4×3 pockets and 40 pages, capacity is 480; double-sided pages correspond to 20 physical sheets.

Click + or ✓ to mark an inserted card. Open a species to inspect its exact position, choose a printing or navigate nearby Pokémon. Space toggles a mark while browsing Pokédex binders (or the optional collection view in Pokédex).

## Free binders

Use Free binders → Add free binder. Choose a pocket and search a Pokémon; duplicates are allowed. Trainers, energy and other cards can be represented by a custom named placeholder. Custom image uploads are not currently included.

Click an occupied pocket to inspect or replace its contents. Choose an exact printing optionally. Removing a card asks for confirmation. Dragging between pockets on the current page moves or swaps them; Move / swap accepts the absolute pocket number across the entire binder for cross-page moves.

Changing dimensions preserves absolute pocket indices. A smaller capacity is refused if it would remove any occupied pocket. Free binders do not change National Dex progress.

## Exact printed cards

Choose English or Japanese, filter by set, search printing details and confirm the card. Card fronts retain a species-number badge and a bilingual caption. Moving your mouse changes their tilt; reduced-motion and touch interfaces keep cards still.

Japanese default lookup uses the bundled official index and labeled supplements. TCGdex archive is an online alternative; English lookup also needs online TCGdex for new searches. Missing editions or collector numbers can be entered manually. Historical printing/finish coverage is incomplete. Foil variants can share one image.

Exact-printing choices are optional. Clearing a Pokédex printing link retains the collected mark. Unmarking a species retains its printing choice for later. Free pocket choices are independent of National Dex choices.

## Settings

The header Settings opens app preferences: theme, the optional Pokédex collection view, backups and recovery. These preferences save automatically.

Edit binder opens a separate window containing only names, colors and layouts for the selected binder group. Save settings applies that binder’s changes.

## Saving and migration

Data is stored locally under pokebinder.local.0.10. Five recent collection recovery points are retained. Use Settings → Restore previous save for mistakes. Download Backup regularly: browser cleanup or losing the device can remove both the active collection and recovery points.

Backups include all binders, free pockets, exact card metadata and preferences. New backups use schema 3; imports accept schemas 1, 2 and 3. Export from the previous app, then Restore in 0.10. Keep older backups for rollback because older apps cannot interpret free binders. When a compatible previous local save exists in the same storage origin, first start can read it; the original key is preserved.

Image binaries are not in JSON backups. Printed-card artwork needs the source host or a populated browser cache. Opening through HTTP instead of file://, changing browser or changing device changes storage context; use Backup/Restore to transfer your collection.

## Keyboard

- Left / right: previous / next species.
- Space: mark a card in collection views.
- /: open Pokédex and focus search.

Shortcuts are suppressed while editing fields or dialogs. All app controls are localized into English, Japanese and Russian.
