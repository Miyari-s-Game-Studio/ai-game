# 中文文档
[中文文档](README_zh.md)


# Interactive Narrative Game Engine

This project is a flexible, AI-powered engine for creating and playing interactive narrative games. It combines a JSON-based ruleset system with generative AI to create dynamic, choice-driven stories. Players take on a role, make decisions, and see the world change in response to their actions, with an AI Game Master weaving the procedural outcomes into a compelling narrative.

The engine is designed to be highly extensible, allowing authors to create their own unique scenarios, actions, and game mechanics through simple JSON configuration files.

**For a detailed guide on how to create your own scenarios, please see the [Ruleset Authoring Guide](docs/AUTHORING_GUIDE.md).**

## Key Features

*   **Rules-Driven Scenarios**: Each story is defined in a self-contained JSON file (`/src/lib/rulesets/*.json`), making it easy to create, modify, and share new adventures.
*   **AI-Powered Narrative**: The game uses Genkit and a Large Language Model (LLM) to act as a "Game Master." The AI generates rich scene descriptions and translates the game's state changes into compelling, moment-to-moment story beats.
*   **Dynamic Conversation System**: Engage in goal-oriented conversations with AI-controlled NPCs. The engine supports objectives like uncovering a `secret` or persuading a character to reach an `agreement`, with specialized AI flows to manage the dialogue.
*   **Persistent AI Characters**: NPCs are generated with unique personalities and are cached within the game state, ensuring players interact with the same consistent character throughout a scenario.
*   **Procedural Minigames**: The engine includes built-in systems for skill checks (`DiceRollDialog`) and combat (`FightDialog`), which are triggered by player actions and resolved through a combination of player stats and chance.
*   **Dynamic UI**: The interface, built with React and ShadCN UI, dynamically highlights interactable elements in the narrative text, guiding player choices.
*   **Themeable Interface**: The look and feel can be customized for each scenario. The engine supports multiple themes (e.g., Default, Pixel, Sci-fi, Darksouls) that can be set in the rules file.

## Gameplay Flow

The game operates on a turn-based loop where the player takes an action, and the game engine, in conjunction with the AI, generates a narrative outcome.

1.  **Scene Generation**: When the player enters a new `situation` (a location or narrative beat), an AI flow (`generateSceneDescription`) generates a rich, descriptive text of the environment. This text subtly weaves in keywords for interactable objects, letting the player know what they can engage with.

2.  **Player Action**: The player chooses an action from the `ActionPanel`. Actions can be simple (e.g., "Observe") or require a specific target (e.g., "Investigate 'dead fish'"). The UI helps by highlighting known targets in the narrative text.

3.  **Game Engine Processing**: The chosen action is sent to the `processAction` function. The engine finds the matching rule in the current situation's `on_action` array based on the player's action and target. It then executes the `do` or `fail` block, modifying the `GameState` by updating counters, tracks, or changing the current situation. This process generates factual, procedural logs (e.g., "You have gained 1 clue.").

4.  **Narrative Generation**: The procedural logs from the engine are sent to another AI flow (`generateActionNarrative`). This AI acts as the Game Master, translating the factual outcomes into a short, compelling story beat that describes what just happened as a result of the player's choice.

5.  **UI Update**: The UI updates to reflect the new `GameState` and displays the latest narrative from the AI to the player, starting the loop over again.
