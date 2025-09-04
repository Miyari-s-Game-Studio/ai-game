# Ruleset Authoring Guide

This guide provides a comprehensive overview of how to create scenarios by writing JSON `GameRules` files. It covers the structure of the rules, how to define game logic, and how to use the built-in minigame systems.

## 1. GameRules JSON Structure

The entire logic and content for a scenario is defined in a single `.json` file located in `/src/lib/rulesets`.

### 1.1. Top-Level Properties

- `id` (string, required): A unique identifier. Convention is `[name]_[language]`, e.g., `my_story_en`.
- `title` (string, required): The name of the scenario displayed to the player.
- `language` (string, required): The language of the content (`"en"` or `"zh"`). This also determines which AI prompt translations are used.
- `theme` (string, optional): The visual theme for the scenario. Options: `"theme-default"`, `"theme-forest"`, `"theme-ocean"`, `"theme-crimson"`.
- `description` (string, required): A short description shown on the scenario selection screen.
- `actions` (object, required): A dictionary of all possible actions in the scenario.
- `ui` (object, optional): UI customization options.
- `initial` (object, required): The starting state of the game.
- `tracks` (object, required): Defines the progress meters for the scenario.
- `situations` (object, required): The core state machine of the game, defining all locations and events.

### 1.2. Actions

The `actions` object maps an `actionId` to its UI properties.

```json
"actions": {
  "investigate": {
    "icon": "Search",
    "label": "Investigate"
  },
  "talk": {
    "icon": "MessageSquare",
    "label": "Talk"
  }
}
```

- `icon`: The name of a `lucide-react` icon.
- `label`: The text displayed on the action button/tooltip.

## 2. Situations & Game Logic

The game progresses as the player moves from one `situation` to another. Each situation defines what actions the player can take and what happens when they do.

### 2.1. The `on_action` Array

Each situation has an `on_action` array, which is a list of rules that are checked every time the player performs an action.

```json
"on_action": [
  {
    "when": { ... },
    "do": [ ... ],
    "fail": [ ... ]
  }
]
```

### 2.2. `when`: The Trigger Condition

The `when` block specifies the conditions under which a rule is triggered. The engine checks these rules from top to bottom and executes the *first one* that matches.

- `actionId`: The ID of the action the player chose (e.g., `"investigate"`).
- `targets` (optional): A pipe-separated `|` list of strings for actions that require a target. The player's target must match one of these. E.g., `"lever|computer|strange device"`.
- `require` (optional): A JavaScript expression string that must evaluate to `true`. You can use `counters`, `tracks`, and `player` variables in the expression (e.g., `"counters.my_counter >= 2 && tracks['some_track'].value < 5"`).

### 2.3. `do` and `fail`: The Effects

The `do` array lists the effects that happen when an action is successful. The `fail` array is executed if the action is unsuccessful (e.g., a failed dice roll).

Effects are objects with a single key defining the effect type.

- `{"add": "counters.my_counter,1"}`: Adds a value to a numeric counter. The path (`counters.my_counter`) and value (`1`) are comma-separated. Use a negative number to subtract.
- `{"set": "counters.some_flag,true"}`: Sets a value. Can set a counter to a boolean or number, or set `"next_situation"` to move the player to a new scene after the action narrative.
- `{"track": "some_track,-1"}`: Adds or subtracts from a track's value. The value is automatically clamped between 0 and the track's max.
- `{"log": "You found something interesting."}`: Adds a procedural log entry. This log is sent to the AI to help it generate the narrative.
- `{"if": "counters.my_counter > 2"}`: This key can be added to any effect to make it conditional.

## 3. Minigame Systems & Special Rules

The engine includes several built-in systems that can be triggered through the `on_action` rules.

### 3.1. Talk (Conversation)

The `talk` action is special. It initiates a conversation with an AI-controlled NPC.

**How to Trigger:**
Create an `on_action` rule for `actionId: "talk"`.

**Configuration:**
The `do` block for a talk action must define the conversation's objective.

1.  **Extract a Secret**:
    ```json
    "do": [
      { "secret": "The mayor has been replaced by an imposter." },
      { "set": "counters.has_secret,true" }
    ]
    ```
    - The `secret` value is what the player needs to figure out. The player can then open a dialog to guess the secret. If they are correct, the `do` block's *other* effects (like `set: "counters.has_secret,true"`) are executed.

2.  **Reach an Agreement**:
    ```json
    "do": [
      { "agreement": "The guards will stand down and let you pass." },
      { "set": "counters.agreement_reached,true" }
    ]
    ```
    - The `agreement` value is the phrase the player must persuade the NPC to say. If the NPC's response includes "I agree to [your objective]", the objective is achieved, and the other effects in the `do` block are executed.

### 3.2. Dice Roll (Skill Check)

You can require a successful dice roll for an action to succeed.

**How to Trigger:**
Simply add a `fail` array to an `on_action` rule. The presence of a `fail` block tells the engine that this action requires a skill check.

```json
"when": { "actionId": "investigate", "targets": "locked_door" },
"do": [
  { "add": "counters.items_found,1" },
  { "set": "next_situation,inner_sanctum" }
],
"fail": [
  { "track": "some_track,1" },
  { "log": "Your attempt fails, and you hear footsteps approaching." }
]
```

**How it Works:**
1.  When the player performs the action, the `DiceRollDialog` appears.
2.  The AI uses the `generateRelevantAttributes` and `generateDifficultyClass` flows to determine the check's parameters (e.g., the DC is 15, and `intelligence` and `wisdom` are the key attributes).
3.  The player chooses an attribute to use for their bonus.
4.  The player rolls a d20. `(d20 roll + attribute bonus)` is compared against the DC.
5.  If the roll is successful, the `do` block is executed. If it fails, the `fail` block is executed.

### 3.3. Fight (Twelve Rush)

The `fight` action triggers a card-game-like combat minigame called "Twelve Rush".

**How to Trigger:**
Create an `on_action` rule for `actionId: "fight"`. The `targets` can be used to define the opponent.

```json
"when": {
  "actionId": "fight",
  "targets": "guard"
},
"do": [
  { "log": "You won the fight against the guard." }
],
"fail": [
  { "log": "You lost the fight against the guard." }
]
```

**How it Works:**
1.  The `FightDialog` opens. The opponent's stats are currently hardcoded but can be customized in the future.
2.  The game is a simplified version of blackjack. The goal is to get a sum of dice rolls closer to a target number (usually 12 + your constitution modifier) than the opponent, without going over.
3.  The fight is best 2 out of 3 rounds.
4.  Player attributes grant special skills:
    - **Strength**: Add +1 to your final score comparison.
    - **Dexterity (Sidestep)**: If a roll makes you bust, cancel that roll.
    - **Constitution**: Increases your bust threshold.
    - **Intelligence (Peek)**: See the result of the next die before you commit to rolling it.
    - **Wisdom (Poise)**: If you stand with a low score, add +2 to your total.
    - **Charisma (Pressure)**: Force the enemy to roll when they would have stood.
5.  If the player wins the overall fight, the action is considered a success and the `do` block is executed. If they lose, the `fail` block is executed.

### 3.4. Endings

The game concludes when the player enters a situation that is marked as an ending.

**How to Trigger:**
Add `"ending": true` to any situation in your `situations` object.

```json
"victory_hall": {
  "label": "Victory!",
  "ending": true,
  "auto_enter_if": "tracks['some_track'].value <= 2 && tracks['another_track'].value >= 7",
  "on_action": []
}
```

**How it Works:**
1. When the player enters a situation with `"ending": true`, the game is considered over.
2. The UI will automatically add a final action button (e.g., "Celebrate" or "Reflect"). This is done programmatically and does not need to be added to the `on_action` array.
3. When the player clicks this final action, the game session concludes, and they are returned to the main scenario selection screen.
4. The system will also automatically save any permanent changes to the player's stats to their profile.
