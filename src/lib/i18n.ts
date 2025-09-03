
// src/lib/i18n.ts
import type {
  GameRules,
  GenerateActionNarrativeInput,
  GenerateCharacterInput,
  GenerateSceneDescriptionInput,
  ReachAgreementInput,
  ExtractSecretInput,
  ValidateSecretInput,
  GenerateRelevantAttributesInput,
  GenerateDifficultyClassInput,
} from "@/types/game";

type Language = 'en' | 'zh';

const translations = {
  en: {
    // UI Translations from before...
    loadingScene: 'Generating scene...',
    characterApproaching: 'Character is approaching...',
    aiCraftingStory: 'AI is crafting the next part of your story...',
    aiCalculatingAction: 'AI is calculating the action...',
    currentSituation: 'Current Situation',
    lastActionResult: 'Last Action Result',
    error: 'Error',
    failedToGenerateScene: 'Could not generate the scene description.',
    invalidSituation: 'The current situation is not defined in the game rules.',
    pleaseCheckRules: 'Please check your rules configuration.',
    failedToProcessAction: 'Failed to process the action. Please try again.',
    viewFullLog: 'View Full Log',
    environmentalStatus: 'Environmental Status',
    keyItemsAndInfo: 'Key Items & Info',
    storyWillUnfold: 'The story will unfold here...',
    talkingTo: 'Talking to',
    yourObjective: 'Your Objective',
    uncoverSecret: 'Your goal is to figure out the secret this person is hiding.',
    iKnowTheSecret: "I know the secret...",
    getThemToAgree: 'Get them to agree to the following:',
    saySomething: 'Say something...',
    send: 'Send',
    endConversation: 'End Conversation',
    objectiveAchieved: 'Objective Achieved!',
    characterLostInThought: 'The character seems lost in thought and does not reply.',
    loadGame: 'Load Game',
    loadGameDescription: 'Select a saved game to continue your progress.',
    noSavedGames: 'No saved games found for this language.',
    load: 'Load',
    cancel: 'Cancel',
    continue: 'Continue',
    areYouSure: 'Are you sure?',
    deleteCharacterConfirmation: "This action cannot be undone. This will permanently delete your character and all associated save files.",
    fullActionLog: 'Full Action Log',
    actionLogDescription: 'A complete history of your actions and the resulting narrative.',
    gameControls: 'Game Controls',
    settings: 'Settings',
    manageRules: 'Manage Rules',
    scenarios: 'Scenarios',
    selectScenario: 'Select a Scenario',
    selectScenarioDescription: 'Choose an interactive story to begin, or load a saved game.',
    playScenario: 'Play Scenario',
    version: 'Version',
    yourStory: 'Your Story',
    createNew: 'Create New',
    gameSaved: 'Game Saved',
    saveFailed: 'Save Failed',
    gameLoaded: 'Game Loaded',
    saveDeleted: 'Save Deleted',
    createYourCharacter: 'Create Your Character',
    editYourCharacter: 'Edit Your Character',
    defineYourRoleIn: 'Define your role in',
    language: 'Language',
    languageEnglish: 'English',
    languageChinese: 'Chinese',
    characterName: 'Character Name',
    enterNamePlaceholder: 'e.g., Alex Ryder',
    characterIdentity: 'Character Identity / Role',
    enterIdentityPlaceholder: 'e.g., Freelance Investigator',
    beginAdventure: 'Begin Adventure',
    validateSecretTitle: 'Validate Secret',
    validateSecretDescription: 'What do you believe the secret is? Enter it below. The AI will determine if your guess is correct.',
    enterSecretPlaceholder: 'Type your guess here...',
    submitGuess: 'Submit Guess',
    guessCorrectTitle: 'Guess Correct!',
    guessIncorrectTitle: 'Guess Incorrect',
    secretValidationFailed: 'Could not validate your secret. Please try again.',
    diceRollTitle: 'Action Check',
    diceRollDescription: 'Your action requires a skill check to succeed. The AI has determined the most relevant attributes for this task. Choose one to add its modifier to your roll.',
    difficultyClass: 'Difficulty Class (DC)',
    relevantAttributes: 'Relevant Attributes',
    yourRoll: 'Your Roll (1-20)',
    attributeBonus: 'Attribute Bonus',
    total: 'Total',
    roll: 'Roll',
    success: 'Success!',
    failure: 'Failure!',
    tabLastResult: 'Last Result',
    tabStatus: 'Status',
    tabItems: 'Items',


    // AI Flow Translations
    ai: {
      generateScene: {
        prompt: (input: GenerateSceneDescriptionInput) => `
You are a game master for an interactive narrative game. Your task is to craft a compelling scene description for the player. This description sets the stage for the current situation.

Background: ${input.background}
Current Situation: ${input.situation}

You must create a captivating, multi-paragraph narrative that describes the environment, atmosphere, and key elements. Crucially, you MUST naturally weave all of the following interaction targets into your description to ensure the player knows what they can interact with.

Interaction Targets:
${input.knownTargets.map(target => `- ${target}`).join('\n')}

Generate the scene description now.
`,
        schema: {
          sceneDescription: "A compelling, multi-paragraph narrative that describes the scene. It MUST naturally weave in all of the provided 'knownTargets' to introduce them to the player."
        }
      },
      generateActionNarrative: {
        prompt: (input: GenerateActionNarrativeInput) => `
You are a game master for an interactive narrative game. Your task is to describe the outcome of the player's action.

The player is currently in this situation:
Situation: ${input.situationLabel}
Scene: ${input.sceneDescription}

The player took this action:
Action: ${input.actionTaken}

The game engine determined the following concrete results from this action:
${input.proceduralLogs.map(log => `- ${log}`).join('\n')}

Based on these results, write a compelling, 2-3 sentence narrative describing what happens. The tone should be consistent with the scene. It is crucial that your response provides clear hints about what the player can interact with next by subtly weaving in items from the 'Known Interaction Targets' list.

Known Interaction Targets:
${input.knownTargets.map(target => `- ${target}`).join('\n')}

Generate the action-result narrative now.
`,
        schema: {
          narrative: "A compelling, 2-3 sentence narrative describing the result of the player's action. It must be based on the procedural logs and fit the scene description. It must also subtly weave in the known interaction targets."
        }
      },
      generateCharacter: {
        prompt: (input: GenerateCharacterInput) => `
You are a character creator for a narrative game. Your task is to generate a unique, random NPC for the player to interact with.

The player is in the following situation: ${input.situationLabel}
The player wants to talk to a person described as: ${input.target}

Generate a character profile for this NPC. Make them feel like a real, unique person. Avoid clichés.
`,
        schema: {
          language: "The language for the character profile.",
          situationLabel: "The label of the current situation or chapter.",
          target: "The role or type of person the player is talking to (e.g., 'fisherman', 'guard', 'factory manager').",
          name: "A common, realistic name for the character.",
          personality: "A brief, 1-2 sentence description of the character's personality (e.g., 'grumpy but helpful,' 'nervous and evasive').",
          dialogStyle: "A description of how the character speaks (e.g., 'uses short, clipped sentences,' 'speaks very formally,' 'has a thick local accent').",
          openingLine: "The first thing the character says to the player to start the conversation."
        }
      },
      extractSecret: {
        systemPrompt: (input: ExtractSecretInput) => `
You will play the NPC in the third person in the game.
Your name is: ${input.characterProfile.name}
Your personality is: ${input.characterProfile.personality}
Your dialogue style is: ${input.characterProfile.dialogStyle}

The player is talking to you in this scene: ${input.sceneDescription}

You must stay in character at all times. The player is trying to get you to reveal a secret.
The secret is: "${input.objective}"

Do NOT reveal the secret unless the player's dialogue skillfully and naturally leads you to do so. Be subtle. 

Respond to the player's message based on ${input.characterProfile.name}'s personality and the conversation so far. Your response must include what ${input.characterProfile.name} say, ${input.characterProfile.name}'s current expression, and any physical action ${input.characterProfile.name} take.
`,
        schema: {
          playerInput: "The latest message from the player.",
          objective: "The secret information the player is trying to get the character to reveal.",
          sceneDescription: "The description of the scene where the conversation is happening.",
          dialogue: "What the character says in response. This is the speech part only.",
          expression: "The character's current facial expression or emotional state (e.g., 'looks nervous', 'frowns', 'seems thoughtful').",
          action: "A brief description of the character's physical action (e.g., 'glances around', 'wrings their hands', 'leans forward')."
        }
      },
      reachAgreement: {
        systemPrompt: (input: ReachAgreementInput) => `
You will play the NPC in the third person in the game.
Your name is: ${input.characterProfile.name}
Your personality is: ${input.characterProfile.personality}
Your dialogue style is: ${input.characterProfile.dialogStyle}

The player is talking to you in this scene: ${input.sceneDescription}

You must stay in character at all times. The player is trying to get you to agree to something.
The objective is: "${input.objective}"

Do NOT agree to the proposal unless the player's dialogue skillfully and naturally persuades you.
If you are agreeing to the proposal, your dialogue MUST include the words "I agree to ${input.objective}".

Respond to the player's message based on ${input.characterProfile.name}'s personality and the conversation so far. Your response must include what ${input.characterProfile.name} say, ${input.characterProfile.name}'s current expression, and any physical action ${input.characterProfile.name} take.
`,
        schema: {
          playerInput: "The latest message from the player.",
          objective: "A negotiation point the player wants the character to agree to.",
          sceneDescription: "The description of the scene where the conversation is happening.",
          dialogue: "What the character says in response. This is the speech part only. If agreeing, it must contain 'I agree to...'",
          expression: "The character's current facial expression or emotional state (e.g., 'looks skeptical', 'nods slowly', 'looks relieved').",
          action: "A brief description of the character's physical action (e.g., 'crosses their arms', 'taps their finger on the table', 'stands up')."
        }
      },
      validateSecret: {
        prompt: (input: ValidateSecretInput) => `
You are an impartial judge in a narrative game. Your task is to determine if the player's guess about a secret is correct.
Your judgment should not be overly strict. The player's guess does not need to be a word-for-word match, but it must capture the core meaning of the secret.

The Actual Secret: "${input.actualSecret}"
The Player's Guess: "${input.guessedSecret}"

Based on a lenient, semantic comparison, is the player's guess correct?
`,
        schema: {
          isCorrect: "A boolean value. True if the player's guess is semantically close enough to the actual secret, otherwise false."
        }
      },
       generateRelevantAttributes: {
        prompt: (input: GenerateRelevantAttributesInput) => `
You are a game master AI for a narrative RPG. Your task is to determine which player attributes are relevant for a skill check.

Player's Role: ${input.player.identity}
Action being attempted: ${input.action.label} (${input.action.description || 'No description'})
Current Situation: ${input.situation.label}

Based on the action and the situation, select the 2 or 3 most relevant attributes from the following list that would influence the outcome of this action:
- strength: Physical power, brute force.
- dexterity: Agility, sleight of hand, stealth.
- constitution: Endurance, health, resistance.
- intelligence: Logic, knowledge, investigation, technical skills.
- wisdom: Perception, intuition, willpower.
- charisma: Persuasion, deception, leadership.

Return only the names of the attributes.
`,
        schema: {
          relevantAttributes: "An array of 2 or 3 attribute names (e.g., ['intelligence', 'wisdom']) that are most relevant for the skill check."
        }
      },
      generateDifficultyClass: {
        prompt: (input: GenerateDifficultyClassInput) => `
You are a game master AI for a narrative RPG. Your task is to set a fair Difficulty Class (DC) for a skill check. The DC represents how hard the task is.

Action being attempted: ${input.action.label} (${input.action.description || 'No description'})
Current Situation: ${input.situation.label}
The key attributes for this check are: ${input.relevantAttributes.join(', ')}

Consider the inherent difficulty of the action in the current context.
- Trivial actions: DC 5-8
- Easy actions: DC 9-12
- Medium actions: DC 13-16
- Hard actions: DC 17-20
- Very Hard actions: DC 21+

Generate a single number for the Difficulty Class.
`,
        schema: {
          difficultyClass: "A single integer representing the Difficulty Class (DC) for the skill check."
        }
      }
    }
  },
  zh: {
    // UI Translations from before...
    loadingScene: '正在生成场景...',
    characterApproaching: '角色正在走来...',
    aiCraftingStory: 'AI正在创作你的下一个故事...',
    aiCalculatingAction: 'AI正在计算行动...',
    currentSituation: '当前状况',
    lastActionResult: '最新结果',
    error: '错误',
    failedToGenerateScene: '无法生成场景描述。',
    invalidSituation: '当前状况在游戏规则中未定义。',
    pleaseCheckRules: '请检查你的规则配置。',
    failedToProcessAction: '处理操作失败，请重试。',
    viewFullLog: '查看完整日志',
    environmentalStatus: '环境状态',
    keyItemsAndInfo: '关键物品和信息',
    storyWillUnfold: '故事将在这里展开...',
    talkingTo: '与...交谈',
    yourObjective: '你的目标',
    uncoverSecret: '你的目标是揭开此人隐藏的秘密。',
    iKnowTheSecret: "我知道秘密了...",
    getThemToAgree: '让他们同意以下内容：',
    saySomething: '说点什么...',
    send: '发送',
    endConversation: '结束对话',
    objectiveAchieved: '目标已达成！',
    characterLostInThought: '角色似乎陷入了沉思，没有回应。',
    loadGame: '读取游戏',
    loadGameDescription: '选择一个存档以继续你的进度。',
    noSavedGames: '未找到此语言的存档。',
    load: '读取',
    cancel: '取消',
    continue: '继续',
    areYouSure: '你确定吗？',
    deleteCharacterConfirmation: "此操作无法撤销。这将永久删除您的角色和所有相关的存档文件。",
    fullActionLog: '完整行动日志',
    actionLogDescription: '你的行动和相应叙事的完整历史记录。',
    gameControls: '游戏控制',
    settings: '设置',
    manageRules: '管理规则',
    scenarios: '选择剧本',
    selectScenario: '选择一个剧本',
    selectScenarioDescription: '选择一个互动故事开始，或读取一个存档。',
    playScenario: '开始剧本',
    version: '版本',
    yourStory: '你的故事',
    createNew: '创建新的',
    gameSaved: '游戏已保存',
    saveFailed: '保存失败',
    gameLoaded: '游戏已读取',
    saveDeleted: '存档已删除',
    createYourCharacter: '创建你的角色',
    editYourCharacter: '编辑你的角色',
    defineYourRoleIn: '在...中定义你的角色',
    language: '语言',
    languageEnglish: '英语',
    languageChinese: '中文',
    characterName: '角色名称',
    enterNamePlaceholder: '例如，莱德·亚历克斯',
    characterIdentity: '角色身份/职业',
    enterIdentityPlaceholder: '例如，自由调查员',
    beginAdventure: '开始冒险',
    validateSecretTitle: '验证秘密',
    validateSecretDescription: '你认为秘密是什么？在下面输入。AI将判断你的猜测是否正确。',
    enterSecretPlaceholder: '在此输入你的猜测...',
    submitGuess: '提交猜测',
    guessCorrectTitle: '猜对了！',
    guessIncorrectTitle: '猜错了',
    secretValidationFailed: '无法验证你的秘密。请重试。',
    diceRollTitle: '行动检定',
    diceRollDescription: '你的行动需要进行一次技能检定才能成功。AI已经为此任务确定了最相关的属性。选择一个属性以将其修正值加到你的骰子点数上。',
    difficultyClass: '难度等级 (DC)',
    relevantAttributes: '相关属性',
    yourRoll: '你的掷骰 (1-20)',
    attributeBonus: '属性加成',
    total: '总计',
    roll: '掷骰',
    success: '成功！',
    failure: '失败！',
    tabLastResult: '最新结果',
    tabStatus: '状态',
    tabItems: '物品',


    // AI Flow Translations
    ai: {
      generateScene: {
        prompt: (input: GenerateSceneDescriptionInput) => `
你是一个互动叙事游戏的地下城主。你的任务是为玩家制作一个引人入胜的场景描述。这个描述为当前的情境设定了舞台。

背景：${input.background}
当前情境：${input.situation}

你必须创造一个引人入胜的、多段落的叙述，描述环境、氛围和关键元素。至关重要的是，你必须将以下所有互动目标自然地编织到你的描述中，以确保玩家知道他们可以与什么互动。

互动目标：
${input.knownTargets.map(target => `- ${target}`).join('\n')}

现在生成场景描述。
`,
        schema: {
          sceneDescription: "一个引人-入胜的、多段落的叙述，描述了场景。它必须自然地编织入所有提供的“已知目标”，以将它们介绍给玩家。"
        }
      },
      generateActionNarrative: {
        prompt: (input: GenerateActionNarrativeInput) => `
你是一个互动叙事游戏的地下城主。你的任务是描述玩家行动的结果。

玩家目前处于这种情况：
情境：${input.situationLabel}
场景：${input.sceneDescription}

玩家采取了此行动：
行动：${input.actionTaken}

游戏引擎确定了此行动的具体结果如下：
${input.proceduralLogs.map(log => `- ${log}`).join('\n')}

根据这些结果，写一个引人入胜的、2-3句话的叙述，描述发生了什么。基调应与场景一致。至关重要的是，你的回应必须通过巧妙地编织“已知互动目标”列表中的项目，为玩家下一步可以与什么互动提供清晰的提示。

已知互动目标：
${input.knownTargets.map(target => `- ${target}`).join('\n')}

现在生成行动结果的叙述。
`,
        schema: {
          narrative: "一个引人入胜的、2-3句话的叙述，描述玩家行动的结果。它必须基于程序日志，并与场景描述相符。它还必须巧妙地编织入已知的互动目标。"
        }
      },
      generateCharacter: {
        prompt: (input: GenerateCharacterInput) => `
你是一个叙事游戏的角色创造者。你的任务是为玩家生成一个独特的、随机的NPC以供互动。

玩家处于以下情境中：${input.situationLabel}
玩家想要与一个被描述为“${input.target}”的人交谈。

为此NPC生成一个角色简介。让他们感觉像一个真实的、独特的人。避免陈词滥调。
`,
        schema: {
          language: "角色简介的语言。",
          situationLabel: "当前情境或章节的标签。",
          target: "玩家正在交谈的人的角色或类型（例如，‘渔夫’、‘保安’、‘工厂经理’）。",
          name: "角色的一个常见、现实的名字。",
          personality: "关于角色个性的简短一两句话描述（例如，“脾气暴躁但乐于助人”，“紧张而回避”）。",
          dialogStyle: "角色说话方式的描述（例如，“使用简短、生硬的句子”，“说话非常正式”，“带有浓厚的地方口音”）。",
          openingLine: "角色对玩家说的第一句话，以开始对话。"
        }
      },
      extractSecret: {
        systemPrompt: (input: ExtractSecretInput) => `
你要用第三人称扮演游戏中的NPC。
你的名字是：${input.characterProfile.name}
你的个性是：${input.characterProfile.personality}
你的对话风格是：${input.characterProfile.dialogStyle}

玩家正在这个场景中与你交谈：${input.sceneDescription}

你必须始终保持角色。玩家正试图让你透露一个秘密。
秘密是：“${input.objective}”

除非玩家的对话技巧娴熟自然地引导你这样做，否则不要透露秘密。要微妙。

根据${input.characterProfile.name}的个性和目前的对话情况，回应玩家的信息。你的回应必须包括${input.characterProfile.name}说的话、${input.characterProfile.name}当前的神态和${input.characterProfile.name}的任何身体动作。
`,
        schema: {
          playerInput: "来自玩家的最新消息。",
          objective: "玩家试图让角色揭示的秘密信息。",
          sceneDescription: "对话发生的场景描述。",
          dialogue: "角色回应时说的话。这只是语音部分。",
          expression: "角色当前的面部表情或情绪状态（例如，‘看起来很紧张’，‘皱眉’，‘似乎在思考’）。",
          action: "角色身体动作的简短描述（例如，‘环顾四周’，‘绞着双手’，‘身体前倾’）。"
        }
      },
      reachAgreement: {
        systemPrompt: (input: ReachAgreementInput) => `
你要用第三人称扮演游戏中的NPC。
你的名字是：${input.characterProfile.name}
你的个性是：${input.characterProfile.personality}
你的对话风格是：${input.characterProfile.dialogStyle}

玩家正在这个场景中与你交谈：${input.sceneDescription}

你必须始终保持角色。玩家正试图让你同意某件事。
目标是：“${input.objective}”

除非玩家的对话技巧娴熟自然地说服你，否则不要同意这个提议。
如果你同意这个提议，你的对话必须包含“我同意${input.objective}”这句话。

根据${input.characterProfile.name}的个性和目前的对话情况，回应玩家的信息。你的回应必须包括${input.characterProfile.name}说的话、${input.characterProfile.name}当前的神态和${input.characterProfile.name}的任何身体动作。
`,
        schema: {
          playerInput: "来自玩家的最新消息。",
          objective: "玩家希望角色同意的谈判要点。",
          sceneDescription: "对话发生的场景描述。",
          dialogue: "角色回应时说的话。这只是语音部分。如果同意，必须包含“我同意...”。",
          expression: "角色当前的面部表情或情绪状态（例如，“看起来很怀疑”，“慢慢点头”，“看起来松了一口气”）。",
          action: "角色身体动作的简短描述（例如，“双臂交叉”，“用手指敲桌子”，“站起来”）。"
        }
      },
      validateSecret: {
        prompt: (input: ValidateSecretInput) => `
你是一个叙事游戏中的公正法官。你的任务是判断玩家关于秘密的猜测是否正确。
你的判断不应该过于严格。玩家的猜测不必与实际秘密一字不差，但必须抓住秘密的核心含义。

实际秘密：“${input.actualSecret}”
玩家的猜测：“${input.guessedSecret}”

根据宽松的、语义上的比较，玩家的猜测是否正确？
`,
        schema: {
          isCorrect: "一个布尔值。如果玩家的猜测在语义上足够接近实际秘密，则为True，否则为false。"
        }
      },
      generateRelevantAttributes: {
        prompt: (input: GenerateRelevantAttributesInput) => `
你是一款叙事角色扮演游戏的游戏大师AI。你的任务是确定哪些玩家属性与技能检定相关。

玩家角色：${input.player.identity}
尝试的行动：${input.action.label} (${input.action.description || '无描述'})
当前情境：${input.situation.label}

根据行动和情境，从以下列表中选择2到3个最相关的属性，这些属性会影响此行动的结果：
- strength (力量): 体力，蛮力。
- dexterity (敏捷): 敏捷度，手上功夫，潜行。
- constitution (体质): 耐力，健康，抵抗力。
- intelligence (智力): 逻辑，知识，调查，技术技能。
- wisdom (感知): 洞察力，直觉，意志力。
- charisma (魅力): 说服，欺骗，领导力。

只返回属性的名称。
`,
        schema: {
          relevantAttributes: "一个包含2到3个属性名称的数组（例如，['intelligence', 'wisdom']），这些属性与技能检定最相关。"
        }
      },
      generateDifficultyClass: {
        prompt: (input: GenerateDifficultyClassInput) => `
你是一款叙事角色扮演游戏的游戏大师AI。你的任务是为技能检定设置一个公平的难度等级（DC）。DC代表任务的困难程度。

尝试的行动：${input.action.label} (${input.action.description || '无描述'})
当前情境：${input.situation.label}
此检定的关键属性是: ${input.relevantAttributes.join(', ')}

在当前背景下考虑行动的内在难度。
- 微不足道的行动: DC 5-8
- 简单的行动: DC 9-12
- 中等难度的行动: DC 13-16
- 困难的行动: DC 17-20
- 非常困难的行动: DC 21+

为难度等级生成一个单一的数字。
`,
        schema: {
          difficultyClass: "一个表示技能检定难度等级（DC）的单一整数。"
        }
      }
    }
  },
};

export function getTranslator(language: Language) {
  return translations[language] || translations.en;
}
