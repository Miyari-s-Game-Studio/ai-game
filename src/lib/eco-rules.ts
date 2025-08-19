import type { GameRules } from '@/types/game';

export const ecoPollutionRules: GameRules = {
  version: 1,
  id: 'eco_pollution',
  title: '生态污染事件',
  ui: {
    counterIcons: {
      clues: 'FileText',
      samples: 'Beaker',
      testimony: 'Handshake',
      shutdown_ok: 'CheckCircle2',
      default: 'Star',
    },
    trackStyles: {
      'eco.pollution': {
        icon: 'AlertTriangle',
        color: 'text-rose-500',
        progressColor: '[&>div]:bg-rose-500',
      },
      'eco.governance': {
        icon: 'Shield',
        color: 'text-emerald-500',
        progressColor: '[&>div]:bg-emerald-500',
      },
      'eco.media': {
        icon: 'Megaphone',
        color: 'text-sky-500',
        progressColor: '[&>div]:bg-sky-500',
      }
    }
  },
  initial: {
    situation: 'investigate_area',
    counters: {
      clues: 0,
      samples: 0,
      testimony: false,
      shutdown_ok: false,
    },
  },
  tracks: {
    'eco.pollution': {
      name: '生态污染',
      value: 2,
      max: 10,
    },
    'eco.governance': {
      name: '治理进度',
      value: 0,
      max: 8,
    },
    'eco.media': {
      name: '媒体关注',
      value: 3,
      max: 10,
    },
  },
  situations: {
    investigate_area: {
      label: '场域摸底',
      allowed_actions: [
        'observe',
        'investigate',
        'sample',
        'talk',
        'announce',
        'declare',
      ],
      on_action: [
        {
          when: { actionId: 'observe' },
          do: [
            { add: 'counters.clues,1', cap: 2 },
            { log: '你记录下水体颜色、气味与流速，形成基础勘查笔记。' },
          ],
        },
        {
          when: { actionId: 'investigate', targetPattern: '(排污口|油污|死鱼)' },
          do: [
            { add: 'counters.clues,1' },
            { addKnownTarget: '排污口' },
            { log: '你锁定了关键污染迹象，可围绕排污口展开处置。' },
          ],
        },
        {
          when: { actionId: 'investigate', targetPattern: '上游工厂' },
          do: [
            { add: 'counters.clues,1' },
            { set: 'next_situation,interview_industry', if: 'counters.clues >= 2' },
            { log: '工厂夜间疑似异常排放；若能拿到证词将更有利。' },
          ],
        },
        {
          when: { actionId: 'sample' },
          do: [
            { add: 'counters.samples,1' },
            { track: 'eco.pollution,1' },
            { set: 'next_situation,technical_ops', if: 'counters.samples >= 2' },
            { log: '采样搅动底泥，短时污染上升；数据将支持后续治理。' },
          ],
        },
        {
          when: { actionId: 'talk', targetPattern: '(渔民|居民|保安)' },
          do: [
            { add: 'counters.clues,1' },
            { log: '当地人对污染怨声载道，但似乎不愿透露更多。' },
          ],
        },
        {
          when: { actionId: 'announce' },
          do: [
            { track: 'eco.media,-1' },
            { log: '舆情暂时降温。' },
            { track: 'eco.media,2', if: "tracks['eco.pollution'].value >= 7" },
            { log: '外媒质疑数据真实性，舆情反弹。', if: "tracks['eco.pollution'].value >= 7" },
          ],
        },
        {
          when: { actionId: 'declare', textRegex: '(工程先行|Engineering)' },
          do: [
            { set: 'route,policy.engineering' },
            { log: '【路线】工程先行：优先建设与技术治理。' },
          ],
        },
        {
          when: { actionId: 'declare', textRegex: '(强制执法|Enforcement)' },
          do: [
            { set: 'route,policy.enforcement' },
            { log: '【路线】强制执法：优先取证/关停。' },
          ],
        },
        {
          when: { actionId: 'declare', textRegex: '(公关|PR)' },
          do: [
            { set: 'route,policy.pr' },
            { log: '【路线】公关遮掩：优先维稳舆情。' },
          ],
        },
      ],
    },
    interview_industry: {
      label: '采访工厂',
      allowed_actions: ['talk', 'investigate', 'negotiate', 'sample', 'announce'],
      on_action: [
        {
          when: { actionId: 'talk', targetPattern: '(厂长|保安|工头)' },
          do: [
            { set: 'counters.testimony,true' },
            { log: '你拿到了书面或录音证词。' },
          ],
        },
        {
          when: {
            actionId: 'negotiate',
            targetPattern: '(关停|整改|封条|停产)',
            require: 'counters.testimony == true',
          },
          do: [
            { set: 'counters.shutdown_ok,true' },
            { track: 'eco.pollution,-2' },
            { track: 'eco.governance,1' },
            { log: '对方签署了停产整改承诺，污染得到缓解。' },
          ],
        },
        {
          when: { actionId: 'investigate' },
          do: [
            { set: 'next_situation,technical_ops', if: 'counters.samples >= 2 && counters.shutdown_ok == false' },
            { log: '进一步的调查没有发现新的线索。'}
          ],
        },
      ],
    },
    technical_ops: {
      label: '技术治理',
      allowed_actions: ['build', 'clean', 'announce', 'investigate'],
      on_action: [
        {
          when: { actionId: 'build' },
          do: [
            { track: 'eco.governance,2' },
            { track: 'eco.media,1' },
            { log: '工程推进显著，但施工引发关注。' },
            { set: 'next_situation,wrap_up', if: "tracks['eco.governance'].value >= 8 && tracks['eco.pollution'].value <= 3 && tracks['eco.media'].value <= 5" },
          ],
        },
        {
          when: { actionId: 'clean' },
          do: [
            { track: 'eco.pollution,-1' },
            { track: 'eco.governance,1' },
            { log: '清污作业压低污染并稳步推进治理。' },
          ],
        },
      ],
    },
    wrap_up: {
      label: '收尾',
      allowed_actions: ['reflect', 'celebrate'],
      on_action: [
        {
          when: { actionId: 'reflect' },
          do: [{ log: '你整理了全案证据链与治理数据，进入长期监测。' }],
        },
        {
          when: { actionId: 'celebrate' },
          do: [{ log: '危机解除，你与团队庆祝胜利，并回访了当地居民，他们对环境的改善表示感谢。' }],
        },
      ],
    },
  },
};
