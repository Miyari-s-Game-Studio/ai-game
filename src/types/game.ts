export type GameState = {
  situation: string;
  counters: Record<string, number | boolean>;
  tracks: Record<string, Track>;
  knownTargets: string[];
  log: LogEntry[];
  route?: string;
  next_situation?: string;
};

export type Track = {
  name: string;
  value: number;
  max: number;
};

export type LogEntry = {
  id: number;
  type: 'action' | 'procedural' | 'narrative' | 'error';
  message: string;
};

export type ActionRule = {
  when: {
    actionId: string;
    targetPattern?: string;
    require?: string;
    textRegex?: string;
  };
  do: Array<Record<string, any>>;
};

export type Situation = {
  label: string;
  allowed_actions: string[];
  on_action: ActionRule[];
};

export type GameRules = {
  version: number;
  id: string;
  title: string;
  description: string;
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
