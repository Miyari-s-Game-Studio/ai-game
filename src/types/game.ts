
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
};

export type Track = {
  name: string;
  value: number;
  max: number;
};

export type LogEntry = {
  id: number;
  type: 'action' | 'procedural' | 'narrative' | 'error' | 'player' | 'npc';
  message: string;
  actor?: string; // For conversation logs
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
  theme?: 'theme-default' | 'theme-forest' | 'theme-ocean' | 'theme-crimson';
  actions: Record<string, ActionDetail>;
  initial: {
    situation: string;
    counters: Record<string, number | boolean>;
    player: PlayerStats;
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
  role: 'user' | 'model';
  parts: { text: string }[];
}[];
