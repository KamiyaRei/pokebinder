# Data and artwork attribution

PokéBinder is an independent fan-made collection tool maintained by KamiyaRei. It is not affiliated with or endorsed by The Pokémon Company, Nintendo, Creatures Inc. or GAME FREAK.

## Official Japanese Pokédex

Source: https://zukan.pokemon.co.jp/

The dataset snapshot taken on October 15, 2026 includes National Pokédex numbers, Japanese names, types, height, weight, form metadata and official artwork URLs. There are 1025 primary species and 1302 records including forms.

Pokémon names, characters, artwork and trademarks belong to their respective owners. Artwork © Pokémon / Nintendo / Creatures / GAME FREAK. Attribution does not grant permission to redistribute or commercially use these materials. Downloaded artwork is excluded from the source repository.

## PokeAPI

Source: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv

English species names and generation IDs come from `pokemon_species_names.csv` and `pokemon_species.csv`. The source files are retained so the bundled data can be rebuilt. See the upstream repository for its terms and notices.

No license is asserted here over third-party data or artwork.

## TCGdex printing catalog

Printing metadata and artwork URLs are read from https://api.tcgdex.net/v2 and https://assets.tcgdex.net/. Results are matched to National Dex IDs and physical set metadata. English lookup uses TCGdex; previously saved Japanese TCGdex choices remain supported. Catalog data can be incomplete; artwork may be shared by multiple editions/finishes. Printed-card images remain the property of Pokémon and their respective owners. Cached catalog responses and selected images are stored locally and are not part of the source release or JSON backup.

## Official Japanese printed-card catalog

Source: https://www.pokemon-card.com/card-search/. All 450 Pokémon-card search result pages are bundled as local metadata, with official image URLs. Detailed-page coverage and title-based species associations are reported in data/japanese-catalog-audit.json. One source image is a placeholder. Artwork is loaded from the original host and is not bundled or included in JSON collection backups. Pokémon card artwork and trademarks belong to their respective owners. This is an independent local fan tool; no license over third-party data or artwork is asserted.
