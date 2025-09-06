# 规则集创作指南

本指南全面概述了如何通过编写 JSON `GameRules` 文件来创建游戏场景。它涵盖了规则的结构、如何定义游戏逻辑，以及如何使用内置的迷你游戏系统。

## 1. GameRules JSON 结构

```typescript
export type Track = {
  name: string;
  value: number;
  max: number;
};

export type DoAction = {
  add?: string;
  set?: string;
  track?: string;
  log?: string;
  secret?: string;
  agreement?: string;
  give_item?: Item;
  remove_item?: string; // by item id
  if?: string;
  cap?: number;
};

export type ActionRule = {
  when: {
    actionId: string;
    targets?: string;
    require?: string;
    textRegex?: string;
  };
  do: DoAction[];
  fail?: DoAction[];
};

export type Situation = {
  label: string;
  description?: string;
  auto_enter_if?: string; // condition to auto enter this situation
  on_action: ActionRule[];
  ending?: boolean;
};

export type ActionDetail = {
  icon: string;
  label: string;
  description?: string;
};

export type GameRules = {
  version: number;
  id: string;
  title: string;
  description: string;
  language: 'en' | 'zh';
  theme?: 'theme-default' | 'theme-forest' | 'theme-ocean' | 'theme-crimson' | 'theme-pixel';
  actions: Record<string, ActionDetail>;
  initial: {
    situation: string;
    counters: Record<string, number | boolean>;
    inventory?: Item[];
  };
  tracks: Record<string, Track>;
  situations: Record<string, Situation>;
  ui?: {
    counterIcons?: Record<string, string>; // keyword -> lucide icon name
    trackStyles?: Record<string, { icon: string; color: string; progressColor: string; }>;
  }
};
```

### 1.1. 顶层属性

- `id` (string, 必需): 唯一标识符。约定格式为 `[名称]_[语言]`，例如 `my_story_zh`。
- `title` (string, 必需): 显示给玩家的场景名称。
- `language` (string, 必需): 内容的语言 (`"en"` 或 `"zh"`)。这也决定了使用哪个 AI 提示翻译。
- `theme` (string, 可选): 场景的视觉主题。可选值: `"theme-default"`, `"theme-forest"`, `"theme-ocean"`, `"theme-crimson"`。
- `description` (string, 必需): 在场景选择屏幕上显示的简短描述。
- `actions` (object, 必需): 场景中所有可能操作的字典。
- `ui` (object, 可选): UI 自定义选项。
- `initial` (object, 必需): 游戏的初始状态。
- `tracks` (object, 必需): 定义场景的进度条。
- `situations` (object, 必需): 游戏的核心状态机，定义了所有地点和事件。

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
- `targets` (可选): 一个用管道符 `|` 分隔的字符串列表，用于需要目标的行动。玩家的目标必须匹配其中之一。例如 `"物品A|人物A|其他任何可以互动的东西"`。
- `require` (可选): 一个必须评估为 `true` 的 JavaScript 表达式字符串。你可以在表达式中使用 `counters`, `tracks` 和 `player` 变量 (例如 `"counters.my_counter >= 2 && tracks['some_track'].value < 5"`)。

### 2.3. `do` 与 `fail`: 效果

`do` 数组列出了行动成功时发生的效果。如果行动不成功（例如，骰子检定失败），则执行 `fail` 数组。

效果是具有单个键定义效果类型的对象。

- `{"add": "counters.my_counter,1"}`: 为一个数值计数器增加一个值。路径 (`counters.my_counter`) 和值 (`1`) 用逗号分隔。使用负数来减去。
- `{"set": "counters.some_flag,true"}`: 设置一个值。可以将计数器设置为布尔值或数字，或者设置 `"next_situation"` 以在行动叙述后将玩家移动到新场景。
- `{"track": "some_track,-1"}`: 增加或减少一个进度条的值。该值会自动限制在 0 和轨道的最大值之间。
- `{"log": "你发现了一些有趣的东西。"}`: 添加一个程序性日志条目。此日志会发送给 AI，以帮助其生成叙述，请确保*log*永远出现在效果的最后，并且只有一个。
- `{"if": "counters.my_counter > 2"}`: 这个键可以添加到任何效果中，使其成为条件性的。

## 3. 迷你游戏系统与特殊规则

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
      { "secret": "XXX是YYY。" },
      { "set": "counters.has_secret,true" }
    ]
    ```
    - `secret` 的值是玩家需要弄清楚的内容。然后玩家可以打开一个对话框来猜测秘密。如果他们是正确的，`do` 块中的*其他*效果（如 `set: "counters.has_secret,true"`）将被执行。

2.  **Reach an Agreement (达成协议)**:
    ```json
    "do": [
      { "agreement": "XXX。" },
      { "set": "counters.agreement_reached,true" }
    ]
    ```
    - `agreement` 的值是玩家必须说服 NPC 说出的短语。如果 NPC 的回应包含“我同意 [你的目标]”，则目标达成，并且 `do` 块中的其他效果将被执行。

### 3.2. Dice Roll (骰子检定)

你可以要求一次成功的骰子检定来使行动成功。

**如何触发:**
只需向一个 `on_action` 规则添加一个 `fail` 数组。`fail` 块的存在告诉引擎这个行动需要一次技能检定。

```json
"when": { "actionId": "investigate", "targets": "物品A" },
"do": [
  { "add": "counters.my_counter,1" },
  { "set": "next_situation,inner_sanctum" }
],
"fail": [
  { "track": "some_track,1" },
  { "log": "你的尝试失败了，并且你听到了脚步声正在靠近。" }
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
为 `actionId: "fight"` 创建一个 `on_action` 规则。`targets` 可用于定义对手。

```json
"when": {
  "actionId": "fight",
  "targets": "敌人"
},
"do": [
  { "log": "你打赢了战斗。" }
],
"fail": [
  { "log": "你输掉了战斗。" }
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

### 3.4. 结局 (Endings)

当玩家进入一个被标记为结局的情境时，游戏结束。

**如何触发:**
在你的 `situations` 对象中的任何一个情境里，添加 `"ending": true`。

```json
"victory_hall": {
  "label": "胜利！",
  "ending": true,
  "auto_enter_if": "tracks['some_track'].value <= 2 && tracks['another_track'].value >= 7",
  "on_action": []
}
```

**工作原理:**
1. 当玩家进入一个带有 `"ending": true` 的情境时，游戏引擎会自动将结果记录在玩家的历史记录中。
2. UI 将隐藏常规的行动栏，并显示一个单独的“结束剧本”按钮。
3. 当玩家点击这个按钮时，游戏会话结束，他们将返回到主剧本选择屏幕，在那里他们可以看到更新后的角色历史。
4. 你**不**需要在 `on_action` 数组中为结局定义一个行动。该按钮是自动添加的。
