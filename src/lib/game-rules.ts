
import type { GameRules } from '@/types/game';

export const defaultGameRules: GameRules = {
  version: 1,
  id: 'eco_pollution',
  title: 'Environmental Crisis',
  description: 'An interactive narrative game where the player assumes the role of an environmental protection officer tasked with resolving a mysterious pollution incident in a river.',
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
      name: 'Pollution',
      value: 2,
      max: 10,
    },
    'eco.governance': {
      name: 'Governance',
      value: 0,
      max: 8,
    },
    'eco.media': {
      name: 'Media Attention',
      value: 3,
      max: 10,
    },
  },
  situations: {
    investigate_area: {
      label: 'Field Investigation',
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
            { log: 'You record the water color, smell, and flow rate, forming a basic survey note.' },
          ],
        },
        {
          when: { actionId: 'investigate', targetPattern: '(outlet|oil|dead fish)' },
          do: [
            { add: 'counters.clues,1' },
            { addKnownTarget: 'outlet' },
            { log: 'You have locked on to key signs of pollution and can now deal with the discharge outlet.' },
          ],
        },
        {
          when: { actionId: 'investigate', targetPattern: 'upstream factory' },
          do: [
            { add: 'counters.clues,1' },
            { set: 'next_situation,interview_industry', if: 'counters.clues >= 2' },
            { log: 'The factory has suspicious emissions at night; it would be better if you could get testimony.' },
          ],
        },
        {
          when: { actionId: 'sample' },
          do: [
            { add: 'counters.samples,1' },
            { track: 'eco.pollution,1' },
            { set: 'next_situation,technical_ops', if: 'counters.samples >= 2' },
            { log: 'Sampling stirred up the sediment, causing a short-term rise in pollution; the data will support subsequent treatment.' },
          ],
        },
        {
          when: { actionId: 'talk', targetPattern: '(fisherman|resident|guard)' },
          do: [
            { add: 'counters.clues,1' },
            { log: 'The locals complain about the pollution, but they don\'t seem to want to reveal more.' },
          ],
        },
        {
          when: { actionId: 'announce' },
          do: [
            { track: 'eco.media,-1' },
            { log: 'Public opinion has temporarily cooled down.' },
            { track: 'eco.media,2', if: "tracks['eco.pollution'].value >= 7" },
            { log: 'Foreign media questioned the authenticity of the data, and public opinion rebounded.', if: "tracks['eco.pollution'].value >= 7" },
          ],
        },
        {
          when: { actionId: 'declare', textRegex: '(Engineering)' },
          do: [
            { set: 'route,policy.engineering' },
            { log: '[Route] Engineering First: Prioritize construction and technical governance.' },
          ],
        },
        {
          when: { actionId: 'declare', textRegex: '(Enforcement)' },
          do: [
            { set: 'route,policy.enforcement' },
            { log: '[Route] Mandatory Enforcement: Prioritize forensics/shutdown.' },
          ],
        },
        {
          when: { actionId: 'declare', textRegex: '(PR)' },
          do: [
            { set: 'route,policy.pr' },
            { log: '[Route] Public Relations Cover-up: Prioritize stabilizing public opinion.' },
          ],
        },
      ],
    },
    interview_industry: {
      label: 'Interview Factory',
      allowed_actions: ['talk', 'investigate', 'negotiate', 'sample', 'announce'],
      on_action: [
        {
          when: { actionId: 'talk', targetPattern: '(manager|guard|foreman)' },
          do: [
            { set: 'counters.testimony,true' },
            { log: 'You have obtained written or recorded testimony.' },
          ],
        },
        {
          when: {
            actionId: 'negotiate',
            targetPattern: '(shutdown|rectify|seal|stop production)',
            require: 'counters.testimony == true',
          },
          do: [
            { set: 'counters.shutdown_ok,true' },
            { track: 'eco.pollution,-2' },
            { track: 'eco.governance,1' },
            { log: 'The other party signed a commitment to stop production for rectification, and the pollution was alleviated.' },
          ],
        },
        {
          when: { actionId: 'investigate' },
          do: [
            { set: 'next_situation,technical_ops', if: 'counters.samples >= 2 && counters.shutdown_ok == false' },
            { log: 'Further investigation yielded no new clues.'}
          ],
        },
      ],
    },
    technical_ops: {
      label: 'Technical Governance',
      allowed_actions: ['build', 'clean', 'announce', 'investigate'],
      on_action: [
        {
          when: { actionId: 'build' },
          do: [
            { track: 'eco.governance,2' },
            { track: 'eco.media,1' },
            { log: 'The project is progressing significantly, but the construction has attracted attention.' },
            { set: 'next_situation,wrap_up', if: "tracks['eco.governance'].value >= 8 && tracks['eco.pollution'].value <= 3 && tracks['eco.media'].value <= 5" },
          ],
        },
        {
          when: { actionId: 'clean' },
          do: [
            { track: 'eco.pollution,-1' },
            { track: 'eco.governance,1' },
            { log: 'Decontamination operations have reduced pollution and steadily advanced governance.' },
          ],
        },
      ],
    },
    wrap_up: {
      label: 'Wrap Up',
      allowed_actions: ['reflect', 'celebrate'],
      on_action: [
        {
          when: { actionId: 'reflect' },
          do: [{ log: 'You have sorted out the entire evidence chain and governance data and entered a long-term monitoring period.' }],
        },
        {
          when: { actionId: 'celebrate' },
          do: [{ log: 'The crisis has been resolved. You celebrate with your team and revisit the local residents, who express their gratitude for the environmental improvements.' }],
        },
      ],
    },
  },
};
