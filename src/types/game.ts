

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

export type PlayerStats = {
  name: string;
  identity: string;
  language: 'en' | 'zh';
  attributes: PlayerAttributes;
  equipment: Equipment;
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
};

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

export type ActionRule = {
  when: {
    actionId: string;
    targetPattern?: string;
    require?: string;
    textRegex?: string;
  };
  do: Array<{
    add?: string;
    set?: string;
    track?: string;
    log?: string;
    secret?: string;
    agreement?: string;
    if?: string;
    cap?: number;
  }>;
};

export type Situation = {
  label: string;
  on_action: ActionRule[];
};

export type ActionDetail = {
  icon: string;
  label: string;
};

export type GameRules = {
  version: number;
  id: string;
  title: string;
  description: string;
  language: 'en' | 'zh';
  theme?: 'theme-default' | 'theme-forest' | 'theme-ocean' | 'theme-crimson';
  actions: Record<string, ActionDetail>;
  initial: {
    situation: string;
    counters: Record<string, number | boolean>;
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
  situationLabel: string;
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

export interface ExtractSecretInput extends ConversationInput {};
export interface ReachAgreementInput extends ConversationInput {};

export interface ConversationOutput {
    dialogue: string;
    expression: string;
    action: string;
}
