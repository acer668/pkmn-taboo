Pokémon Taboo
============
Files:
- index.html — page structure
- style.css — appearance/layout
- script.js — game logic
- pokemon.json — editable Pokémon roster + taboo word lists

The app is now self-contained and does not use PokeAPI for its roster. To edit a Pokémon, open pokemon.json and change its name, generation, or easy/medium/hard arrays. To remove a Pokémon, delete its object. To add one, add a new object with a unique id.

Each Pokémon has exactly 4 Easy, 6 Medium, and 6 Hard taboo words. Generation/region terms are intentionally excluded from the generated lists because the game rules already forbid them.


Update:
- Displays official Pokémon artwork for the selected Pokémon (internet connection required for images).
- NEXT POKÉMON counts as one correct guess and adds 10 points.
- SKIP advances without points and adds 2 to the taboo-word penalty.
- End-of-round results show guessed count, total points, and taboo-word penalty.
