# 规则集创作指南

本指南全面概述了如何通过编写 JSON `GameRules` 文件来创建游戏场景。它涵盖了规则的结构、如何定义游戏逻辑，以及如何使用内置的迷你游戏系统。

## 1. GameRules JSON 结构

一个场景的全部逻辑和内容都在位于 `/src/lib/rulesets` 目录下的单个 `.json` 文件中定义。

### 1.1. 顶层属性

- `id` (string, 必需): 唯一标识符。约定格式为 `[名称]_[语言]`，例如 `eco_crisis_en`。
- `title` (string, 必需): 显示给玩家的场景名称。
- `language` (string, 必需): 内容的语言 (`"en"` 或 `"zh"`)。这也决定了使用哪个 AI 提示翻译。
- `theme` (string, 可选): 场景的视觉主题。可选值: `"theme-default"`, `"theme-forest"`, `"theme-ocean"`, `"theme-crimson"`。
- `description` (string, 必需): 在场景选择屏幕上显示的简短描述。
- `actions` (object, 必需): 场景中所有可能操作的字典。
- `ui` (object, 可选): UI 自定义选项。
- `initial` (object, 必需): 游戏的初始状态。
- `tracks` (object, 必需): 定义场景的进度条。
- `situations` (object, 必需): 游戏的核心状态机，定义了所有地点和事件。
- `endings` (object, 可选): 定义了可能的结局及其对玩家永久属性的影响。

### 1.2. Actions (行动)

`actions` 对象将 `actionId` 映射到其 UI 属性。

```json
"actions": {
  "investigate": {
    "icon": "Search",
    "label": "调查"
  },
  "talk": {
    "icon": "MessageSquare",
    "label": "交谈"
  }
}
```

- `icon`: `lucide-react` 图标的名称。
- `label`: 显示在行动按钮/工具提示上的文本。

## 2. Situations & Game Logic (情境与游戏逻辑)

随着玩家从一个 `situation` 移动到另一个，游戏进程得以推进。每个情境定义了玩家可以采取什么行动以及行动的后果。

### 2.1. `on_action` 数组

每个情境都有一个 `on_action` 数组，这是一个规则列表，每次玩家执行行动时都会检查。

```json
"on_action": [
  {
    "when": { ... },
    "do": [ ... ],
    "fail": [ ... ]
  }
]
```

### 2.2. `when`: 触发条件

`when` 块指定了触发规则的条件。引擎从上到下检查这些规则，并执行*第一个*匹配的规则。

- `actionId`: 玩家选择的行动 ID (例如 `"investigate"`)。
- `targetPattern` (可选): 一个字符串或用管道符 `|` 分隔的字符串列表，用于需要目标的行动。玩家的目标必须匹配其中之一。例如 `"outlet|oil|dead fish"`。
- `require` (可选): 一个必须评估为 `true` 的 JavaScript 表达式字符串。你可以在表达式中使用 `counters`, `tracks` 和 `player` 变量 (例如 `"counters.clues >= 2 && tracks['eco.pollution'].value < 5"`)。

### 2.3. `do` 与 `fail`: 效果

`do` 数组列出了行动成功时发生的效果。如果行动不成功（例如，骰子检定失败），则执行 `fail` 数组。

效果是具有单个键定义效果类型的对象。

- `{"add": "counters.clues,1"}`: 为一个数值计数器增加一个值。路径 (`counters.clues`) 和值 (`1`) 用逗号分隔。使用负数来减去。
- `{"set": "counters.testimony,true"}`: 设置一个值。可以将计数器设置为布尔值或数字，或者设置 `"next_situation"` 以在行动叙述后将玩家移动到新场景。
- `{"track": "eco.pollution,-1"}`: 增加或减少一个进度条的值。该值会自动限制在 0 和轨道的最大值之间。
- `{"log": "你发现了一条线索。"}`: 添加一个程序性日志条目。此日志会发送给 AI，以帮助其生成叙述。
- `{"if": "counters.clues > 2"}`: 这个键可以添加到任何效果中，使其成为条件性的。

## 3. Minigame Systems (迷你游戏系统)

引擎包含了几个内置的迷你游戏，可以通过 `on_action` 规则触发。

### 3.1. Talk (交谈)

`talk` 行动是特殊的。它会与一个由 AI 控制的 NPC 展开对话。

**如何触发:**
为 `actionId: "talk"` 创建一个 `on_action` 规则。

**配置:**
`talk` 行动的 `do` 块必须定义对话的目标。

1.  **Extract a Secret (探查秘密)**:
    ```json
    "do": [
      { "secret": "工厂在夜间有可疑的排放。" },
      { "set": "counters.testimony,true" }
    ]
    ```
    - `secret` 的值是玩家需要弄清楚的内容。然后玩家可以打开一个对话框来猜测秘密。如果他们是正确的，`do` 块中的*其他*效果（如 `set: "counters.testimony,true"`）将被执行。

2.  **Reach an Agreement (达成协议)**:
    ```json
    "do": [
      { "agreement": "工厂将停产整改。" },
      { "set": "counters.shutdown_ok,true" }
    ]
    ```
    - `agreement` 的值是玩家必须说服 NPC 说出的短语。如果 NPC 的回应包含“我同意 [你的目标]”，则目标达成，并且 `do` 块中的其他效果将被执行。

### 3.2. Dice Roll (骰子检定)

你可以要求一次成功的骰子检定来使行动成功。

**如何触发:**
只需向一个 `on_action` 规则添加一个 `fail` 数组。`fail` 块的存在告诉引擎这个行动需要一次技能检定。

```json
"when": { "actionId": "investigate", "targetPattern": "上游工厂" },
"do": [
  { "add": "counters.clues,1" },
  { "set": "next_situation,interview_industry" }
],
"fail": [
  { "track": "eco.media,1" },
  { "log": "你的调查陷入停滞，媒体开始报道进展不力。" }
]
```

**工作原理:**
1.  当玩家执行该行动时，`DiceRollDialog` 会出现。
2.  AI 使用 `generateRelevantAttributes` 和 `generateDifficultyClass` 流程来确定检定的参数（例如，DC 是 15，`intelligence` 和 `wisdom` 是关键属性）。
3.  玩家选择一个属性来使用其加成。
4.  玩家掷一个 d20 骰子。将 `(d20 掷骰结果 + 属性加成)` 与 DC 进行比较。
5.  如果检定成功，则执行 `do` 块。如果失败，则执行 `fail` 块。

### 3.3. Fight (十二攻心)

`fight` 行动会触发一个名为“十二攻心”的类似纸牌游戏的战斗迷你游戏。

**如何触发:**
为 `actionId: "fight"` 创建一个 `on_action` 规则。`targetPattern` 可用于定义对手。

```json
"when": {
  "actionId": "fight",
  "targetPattern": "保安"
},
"do": [
  { "log": "你打赢了和保安的架。" }
],
"fail": [
  { "log": "你输掉了和保安的架。" }
]
```

**工作原理:**
1.  `FightDialog` 打开。对手的属性目前是硬编码的，但将来可以自定义。
2.  该游戏是二十一点的简化版。目标是使掷骰总和比对手更接近目标数字（通常是 12 + 你的体质修正值），但不能超过。
3.  战斗是三局两胜制。
4.  玩家属性提供特殊技能：
    - **力量 (Strength)**: 在最终分数比较时，为你的总和增加 +1。
    - **敏捷 (Dexterity / Sidestep)**: 如果一次掷骰让你爆牌，使用此技能取消那次掷骰。
    - **体质 (Constitution)**: 增加你的爆牌阈值。
    - **智力 (Intelligence / Peek)**: 在你决定要牌之前，使用此技能查看下一颗骰子的结果。
    - **感知 (Wisdom / Poise)**: 如果你以低分停牌，为你的总和增加 +2。
    - **魅力 (Charisma / Pressure)**: 强迫本想停牌的敌人要牌。
5.  如果玩家赢得整场战斗，则该行动被视为成功，并执行 `do` 块。如果他们输了，则执行 `fail` 块。