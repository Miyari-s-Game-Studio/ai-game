

export type Item = {
  id: string;
  name: string;
  description: string;
  icon: string;
  slot?: 'top' | 'bottom' | 'underwear' | 'panties' | 'shoes' | 'socks' | 'accessory';
};

export type PlayerAttributes = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type Equipment = {
  top?: string;
  bottom?: string;
  underwear?: string;
  panties?: string;
  shoes?: string;
  socks?: string;
  accessory?: string;
};

export type AttributeChange = {
  attribute: keyof PlayerAttributes;
  change: number;
  oldValue: number;
  newValue: number;
};

export type CompletedScenario = {
  rulesId: string;
  title: string;
  completionDate: string; // ISO String
  endingSituationId: string;
  endingSituationLabel: string;
  attributeChanges: AttributeChange[];
  finalAttributes: PlayerAttributes;
};

export type PlayerStats = {
  name: string;
  identity: string;
  language: 'en' | 'zh';
  attributes: PlayerAttributes;
  equipment: Equipment;
  inventory: Item[];
  history?: CompletedScenario[];
};

export type ActionCheckState = {
  relevantAttributes: (keyof PlayerAttributes)[];
  difficultyClass: number;
  hasPassed: boolean;
};

export type GameState = {
  player: PlayerStats;
  situation: string;
  counters: Record<string, number | boolean>;
  tracks: Record<string, Track>;
  log: LogEntry[];
  route?: string;
  next_situation?: string;
  characters?: Record<string, CharacterProfile>;
  sceneDescriptions: Record<string, string>; // Cache for generated scene descriptions
  actionChecks: Record<string, ActionCheckState>;
};

export type FightState = {
  player: PlayerStats;
  enemy: PlayerStats;
  round: number;
  playerRoundsWon: number;
  enemyRoundsWon: number;
  currentRound: {
    playerDice: number[];
    playerSum: number;
    enemyDice: number[];
    enemySum: number;
    playerStand: boolean;
    enemyStand: boolean;
    isPlayerTurn: boolean;
    log: string[];
    usedPlayerSkills: Partial<Record<keyof PlayerAttributes, number>>;
    usedEnemySkills: Partial<Record<keyof PlayerAttributes, number>>;
    playerBonus: number;
    enemyBonus: number;
    peekResult: number | null;
  };
  winner: 'player' | 'enemy' | null;
}

export type Track = {
  name: string;
  value: number;
  max: number;
};

export type LogEntryChange = {
  id: string;
  name: string;
  delta: number;
  icon: string;
  color: string;
};

export type LogEntry = {
  id: number;
  type: 'action' | 'procedural' | 'narrative' | 'error' | 'player' | 'npc';
  message: string;
  actor?: string; // For conversation logs
  changes?: LogEntryChange[];
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
    targetPattern?: string;
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

export type CharacterProfile = {
  name: string;
  personality: string;
  dialogStyle: string;
  openingLine: string;
};

export type ConversationHistory = {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}[];


// AI Flow Input/Output Types

export interface GenerateSceneDescriptionInput {
  language: 'en' | 'zh';
  background: string;
  situation: string;
  knownTargets: string[];
};

export interface GenerateActionNarrativeInput {
  language: 'en' | 'zh';
  situationLabel: string;
  sceneDescription: string;
  actionTaken: string;
  proceduralLogs: string[];
  knownTargets: string[];
};

export interface GenerateCharacterInput {
  language: 'en' | 'zh';
  situationLabel: string;
  target: string;
};

export interface ConversationInput {
  language: 'en' | 'zh';
  characterProfile: CharacterProfile;
  conversationHistory: ConversationHistory;
  playerInput: string;
  objective: string;
  sceneDescription: string;
}

export interface ExtractSecretInput extends ConversationInput {
};

export interface ReachAgreementInput extends ConversationInput {
};

export interface ConversationOutput {
  dialogue: string;
  expression: string;
  action: string;
}

export interface ValidateSecretInput {
  language: 'en' | 'zh';
  guessedSecret: string;
  actualSecret: string;
}

export interface ValidateSecretOutput {
  isCorrect: boolean;
}


// Dice Roll AI Flows
export interface GenerateRelevantAttributesInput {
  language: 'en' | 'zh';
  player: PlayerStats;
  action: ActionDetail;
  situation: Situation;
}

export interface GenerateDifficultyClassInput {
  language: 'en' | 'zh';
  action: ActionDetail;
  situation: Situation;
  relevantAttributes: (keyof PlayerAttributes)[];
}

    