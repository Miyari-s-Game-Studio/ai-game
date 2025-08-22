
// src/lib/i18n.ts
import type { GameRules } from "@/types/game";

type Language = 'en' | 'zh';

const translations = {
  en: {
    // GameUI
    loadingScene: 'Generating scene...',
    characterApproaching: 'Character is approaching...',
    aiCraftingStory: 'AI is crafting the next part of your story...',
    currentSituation: 'Current Situation',
    error: 'Error',
    failedToGenerateScene: 'Could not generate the scene description.',
    invalidSituation: 'The current situation is not defined in the game rules.',
    pleaseCheckRules: 'Please check your rules configuration.',
    failedToProcessAction: 'Failed to process the action. Please try again.',
    viewFullLog: 'View Full Log',
    environmentalStatus: 'Environmental Status',
    keyItemsAndInfo: 'Key Items & Info',
    storyWillUnfold: 'The story will unfold here...',

    // TalkDialog
    talkingTo: 'Talking to',
    yourObjective: 'Your Objective',
    uncoverSecret: 'Uncover the secret.',
    getThemToAgree: 'Get them to agree to the following:',
    saySomething: 'Say something...',
    send: 'Send',
    endConversation: 'End Conversation',
    objectiveAchieved: 'Objective Achieved!',
    characterLostInThought: 'The character seems lost in thought and does not reply.',
    
    // LoadGameDialog
    loadGame: 'Load Game',
    loadGameDescription: 'Select a saved game to continue your progress.',
    noSavedGames: 'No saved games found.',
    load: 'Load',
    cancel: 'Cancel',
    
    // ActionLogDialog
    fullActionLog: 'Full Action Log',
    actionLogDescription: 'A complete history of your actions and the resulting narrative.',
    
    // Sidebar
    gameControls: 'Game Controls',
    settings: 'Settings',
    manageRules: 'Manage Rules',
    scenarios: 'Scenarios',

    // Page.tsx
    selectScenario: 'Select a Scenario',
    selectScenarioDescription: 'Choose an interactive story to begin, or load a saved game.',
    playScenario: 'Play Scenario',
    version: 'Version',
    yourStory: 'Your Story',
    createNew: 'Create New',
    
    // useToast related
    gameSaved: 'Game Saved',
    saveFailed: 'Save Failed',
    gameLoaded: 'Game Loaded',
    saveDeleted: 'Save Deleted',
  },
  zh: {
    // GameUI
    loadingScene: '正在生成场景...',
    characterApproaching: '角色正在走来...',
    aiCraftingStory: 'AI正在创作你的下一个故事...',
    currentSituation: '当前状况',
    error: '错误',
    failedToGenerateScene: '无法生成场景描述。',
    invalidSituation: '当前状况在游戏规则中未定义。',
    pleaseCheckRules: '请检查你的规则配置。',
    failedToProcessAction: '处理操作失败，请重试。',
    viewFullLog: '查看完整日志',
    environmentalStatus: '环境状态',
    keyItemsAndInfo: '关键物品和信息',
    storyWillUnfold: '故事将在这里展开...',

    // TalkDialog
    talkingTo: '与...交谈',
    yourObjective: '你的目标',
    uncoverSecret: '揭开秘密。',
    getThemToAgree: '让他们同意以下内容：',
    saySomething: '说点什么...',
    send: '发送',
    endConversation: '结束对话',
    objectiveAchieved: '目标已达成！',
    characterLostInThought: '角色似乎陷入了沉思，没有回应。',

    // LoadGameDialog
    loadGame: '读取游戏',
    loadGameDescription: '选择一个存档以继续你的进度。',
    noSavedGames: '未找到存档。',
    load: '读取',
    cancel: '取消',

    // ActionLogDialog
    fullActionLog: '完整行动日志',
    actionLogDescription: '你的行动和相应叙事的完整历史记录。',

    // Sidebar
    gameControls: '游戏控制',
    settings: '设置',
    manageRules: '管理规则',
    scenarios: '选择剧本',

    // Page.tsx
    selectScenario: '选择一个剧本',
    selectScenarioDescription: '选择一个互动故事开始，或读取一个存档。',
    playScenario: '开始剧本',
    version: '版本',
    yourStory: '你的故事',
    createNew: '创建新的',

    // useToast related
    gameSaved: '游戏已保存',
    saveFailed: '保存失败',
    gameLoaded: '游戏已读取',
    saveDeleted: '存档已删除',
  },
};

export function getTranslator(language: Language) {
    return translations[language] || translations.en;
}
