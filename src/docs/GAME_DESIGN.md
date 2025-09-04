# Game Design & Architecture Overview

This document outlines the structure, gameplay flow, and key features of the interactive narrative game engine.

**For a detailed guide on how to create your own scenarios and write the rules JSON, please see the [Ruleset Authoring Guide](./AUTHORING_GUIDE.md).**

## 1. Core Game Structure

The game is built around a flexible, rules-driven engine that allows for the creation of multiple, distinct scenarios.

### 1.1. Rulesets (`/src/lib/rulesets/*.json`)

- **Centralized Logic**: Each gameplay scenario is defined by a single JSON file (e.g., `eco_crisis.json`). This file contains all the necessary data to run the game, including situations, actions, and initial state.
- **Scalability**: New scenarios can be easily added by creating a new JSON file in this directory and adding it to the `rulesetMap` in `src/lib/rulesets/index.ts`.
- **Dynamic Loading**: The application dynamically loads the selected ruleset at runtime, allowing for a library of different stories.

### 1.2. Game State (`src/types/game.ts`)

The `GameState` is the central object that tracks all progress. It is managed primarily within `GameUI.tsx` and includes:

- `situation`: A string identifying the player's current location or narrative beat (e.g., "investigate_area").
- `counters`: A key-value store for simple state tracking, such as items collected (`samples`), clues found (`clues`), or flags (`testimony: true`).
- `tracks`: Numerical values with a defined maximum, representing progress meters like "Pollution Level" or "Public Trust."
- `player`: Contains the player's stats, identity, and equipment.
- `characters`: A cache of AI-generated NPC profiles to ensure characters are persistent throughout a playthrough.

## 2. Gameplay Flow

The game operates on a turn-based loop where the player takes an action, and the game engine, in conjunction with AI, generates a narrative outcome.

1.  **Scene Generation**: When the player enters a new `situation`, an AI flow (`generateSceneDescription`) generates a rich, descriptive text of the environment, subtly weaving in keywords for interactable objects (`knownTargets`).

2.  **Player Action**: The player chooses an action from the `ActionPanel`. Actions can be simple (e.g., "observe") or require a target (e.g., "investigate 'dead fish'").

3.  **Game Engine Processing**: The chosen action is sent to the `processAction` function in the game engine. The engine finds the matching rule in the current situation's `on_action` array and executes the `do` block, modifying the `GameState` (e.g., updating counters, tracks, or changing the situation). This process generates factual, procedural logs (e.g., "You have gained 1 clue.").

4.  **Narrative Generation**: The procedural logs are then sent to another AI flow (`generateActionNarrative`). This AI acts as a "Game Master," translating the factual outcomes into a compelling, 2-3 sentence story beat that describes what just happened.

5.  **UI Update**: The UI updates to reflect the new `GameState` and displays the latest narrative to the player.

## 3. Key Features

### 3.1. AI-Driven Conversation System

- **Goal-Oriented Dialogue**: Conversations with NPCs are mini-games. The `talk` action rules define an objective, which can be either a `secret` to uncover or an `agreement` to reach.
- **Specialized AI Flows**: Two distinct Genkit flows (`extractSecret` and `reachAgreement`) handle these scenarios. Each flow has a tailored system prompt that guides the AI character's behavior, making it cooperative, reluctant, or persuasive as needed.
- **Persistent Characters**: The first time a player talks to an NPC (e.g., "fisherman"), an AI flow (`generateCharacter`) creates a unique profile (name, personality, opening line). This profile is then cached in the `GameState` to ensure the player interacts with the same consistent character in subsequent conversations.
- **Deterministic Outcomes**: Success is determined by TypeScript code in the `TalkDialog` component, which checks the AI's response for key phrases (e.g., "I agree to..." or the secret itself). This makes the success condition reliable and removes ambiguity.

### 3.2. Dynamic and Themed UI

- **Component-Based UI**: The interface is built with React and ShadCN UI components.
- **Dynamic Action Highlighting**: The `NarrativeLog` component automatically identifies `knownTargets` in the narrative text and turns them into interactive popovers, showing the player what actions they can take on that specific target.
- **Themeable Interface**: The application supports multiple visual themes (e.g., Forest, Ocean) defined in `globals.css` and managed by `ThemeProvider.tsx`. The theme can be set in the game rules file, giving each scenario a unique look and feel.
