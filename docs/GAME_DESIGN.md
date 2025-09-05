# Game Design & Architecture Overview

This document outlines the technical structure and architecture of the interactive narrative game engine.

**For an overview of the gameplay and key features, please see the main [README.md](../README.md).**
**For a detailed guide on how to create your own scenarios, please see the [Ruleset Authoring Guide](AUTHORING_GUIDE.md).**

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

## 2. AI-Driven Conversation System

- **Goal-Oriented Dialogue**: Conversations with NPCs are mini-games. The `talk` action rules define an objective, which can be either a `secret` to uncover or an `agreement` to reach.
- **Specialized AI Flows**: Two distinct Genkit flows (`extractSecret` and `reachAgreement`) handle these scenarios. Each flow has a tailored system prompt that guides the AI character's behavior, making it cooperative, reluctant, or persuasive as needed.
- **Persistent Characters**: The first time a player talks to an NPC (e.g., "fisherman"), an AI flow (`generateCharacter`) creates a unique profile (name, personality, opening line). This profile is then cached in the `GameState` to ensure the player interacts with the same consistent character in subsequent conversations.
- **Deterministic Outcomes**: Success is determined by TypeScript code in the `TalkDialog` component, which checks the AI's response for key phrases (e.g., "I agree to..." or the secret itself). This makes the success condition reliable and removes ambiguity.
