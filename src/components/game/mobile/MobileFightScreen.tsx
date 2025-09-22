// src/components/game/mobile/MobileFightScreen.tsx
'use client';
import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {Button} from '@/components/ui/button';
import {getTranslator} from '@/lib/i18n';
import {BookOpen, Bot, ChevronsUp, Dices, Eye, Footprints, Heart, Smile, Swords, User, XCircle} from 'lucide-react';
import type {FightState, PlayerAttributes, PlayerStats} from '@/types/game';
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from "@/components/ui/tooltip"
import {Dice} from "@/components/ui/dice";
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobileFightScreenProps {
  player: PlayerStats;
  enemy: PlayerStats; 
  onFightComplete: (result: 'win' | 'loss') => void;
  language: 'en' | 'zh';
}

const clamp = (num: number, min: number, max: number) => Math.max(min, Math.min(num, max));
const getMod = (score: number) => clamp(Math.floor((score - 10) / 2), 0, 3);
const rollD6 = () => Math.floor(Math.random() * 6) + 1;

const ANIMATION_DURATION = 1500;

type FightAction =
  | { type: 'START_FIGHT' }
  | { type: 'START_ROUND' }
  | { type: 'PLAYER_PRESS' }
  | { type: 'PLAYER_STAND' }
  | { type: 'ENEMY_TURN' }
  | { type: 'END_ROUND'; winner: 'player' | 'enemy' | 'tie' }
  | { type: 'USE_SKILL'; skill: keyof PlayerAttributes, target: 'player' | 'enemy' }
  | { type: 'LOG', message: string };


const createInitialFightState = (player: PlayerStats, enemy: PlayerStats): FightState => {
  return {
    player,
    enemy,
    round: 0,
    playerRoundsWon: 0,
    enemyRoundsWon: 0,
    currentRound: {
      playerDice: [],
      playerSum: 0,
      enemyDice: [],
      enemySum: 0,
      playerStand: false,
      enemyStand: false,
      isPlayerTurn: true,
      log: [],
      usedPlayerSkills: {},
      usedEnemySkills: {},
      playerBonus: 0,
      enemyBonus: 0,
      peekResult: null,
    },
    winner: null,
  };
};


const fightReducer = (state: FightState, action: FightAction): FightState => {
  switch (action.type) {
    case 'START_FIGHT':
      return createInitialFightState(state.player, state.enemy);

    case 'START_ROUND': {
      const pDice1 = rollD6();
      const pDice2 = rollD6();
      const eDice1 = rollD6();
      const eDice2 = rollD6();
      return {
        ...state,
        round: state.round + 1,
        currentRound: {
          playerDice: [pDice1, pDice2],
          playerSum: pDice1 + pDice2,
          enemyDice: [eDice1, eDice2],
          enemySum: eDice1 + eDice2,
          playerStand: false,
          enemyStand: false,
          isPlayerTurn: true,
          log: [`Round ${state.round + 1} starts!`, `Player rolls ${pDice1}, ${pDice2} (Sum: ${pDice1 + pDice2})`, `Enemy rolls ${eDice1}, ${eDice2} (Sum: ${eDice1 + eDice2})`],
          usedPlayerSkills: {},
          usedEnemySkills: {},
          playerBonus: 0,
          enemyBonus: 0,
          peekResult: null,
        }
      };
    }

    case 'LOG':
      return {
        ...state,
        currentRound: {...state.currentRound, log: [...state.currentRound.log, action.message]}
      };

    case 'PLAYER_PRESS': {
      const newDie = rollD6();
      const newSum = state.currentRound.playerSum + newDie;

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          playerDice: [...state.currentRound.playerDice, newDie],
          playerSum: newSum,
          isPlayerTurn: false,
          log: [...state.currentRound.log, `Player presses, rolls a ${newDie}. Sum: ${newSum}`],
          peekResult: null,
        }
      };
    }

    case 'PLAYER_STAND':
      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          playerStand: true,
          isPlayerTurn: false,
          log: [...state.currentRound.log, `Player stands with a sum of ${state.currentRound.playerSum}.`]
        }
      };

    case 'ENEMY_TURN': {
      const conMod = getMod(state.enemy.attributes.constitution);
      const bustThreshold = 12 + conMod;

      const playerBusted = state.currentRound.playerSum > (12 + getMod(state.player.attributes.constitution));
      const shouldStand = state.currentRound.enemySum > bustThreshold - 3 || playerBusted || (state.currentRound.playerStand && state.currentRound.enemySum > state.currentRound.playerSum);

      if (shouldStand) {
        return {
          ...state,
          currentRound: {
            ...state.currentRound,
            enemyStand: true,
            isPlayerTurn: !state.currentRound.playerStand,
            log: [...state.currentRound.log, `Enemy stands with a sum of ${state.currentRound.enemySum}.`]
          }
        };
      } else {
        const newDie = rollD6();
        const newSum = state.currentRound.enemySum + newDie;
        return {
          ...state,
          currentRound: {
            ...state.currentRound,
            enemyDice: [...state.currentRound.enemyDice, newDie],
            enemySum: newSum,
            isPlayerTurn: !state.currentRound.playerStand,
            log: [...state.currentRound.log, `Enemy presses, rolls a ${newDie}. Sum: ${newSum}`]
          }
        };
      }
    }

    case 'USE_SKILL': {
      let newState = {...state};
      const {skill, target} = action;
      const user = target === 'player' ? state.player : state.enemy;
      const usedSkills = target === 'player' ? {...state.currentRound.usedPlayerSkills} : {...state.currentRound.usedEnemySkills};
      const mod = getMod(user.attributes[skill]);

      if ((usedSkills[skill] || 0) >= mod) {
        return state; // No uses left
      }

      usedSkills[skill] = (usedSkills[skill] || 0) + 1;

      let logMessage = `${target === 'player' ? 'Player' : 'Enemy'} uses ${skill}!`;

      switch (skill) {
        case 'strength':
          if (target === 'player') newState.currentRound.playerBonus += 1;
          else newState.currentRound.enemyBonus += 1;
          break;
        case 'dexterity': // Sidestep, handled in component
          const lastDie = newState.currentRound.playerDice.pop()!;
          newState.currentRound.playerSum -= lastDie;
          newState.currentRound.playerStand = true;
          newState.currentRound.isPlayerTurn = false;
          logMessage = `Player uses Sidestep to cancel a ${lastDie}!`
          break;
        case 'intelligence': // Peek
          newState.currentRound.peekResult = rollD6();
          logMessage = `Player uses Peek to see the next roll...`
          break;
        case 'wisdom': // Poise
          if (target === 'player') newState.currentRound.playerBonus += 2;
          else newState.currentRound.enemyBonus += 2;
          break;
        case 'charisma': // Pressure, handled in component
          logMessage = 'Player uses Pressure, forcing the enemy to press!';
          break;
      }

      return {
        ...newState,
        currentRound: {
          ...newState.currentRound,
          log: [...newState.currentRound.log, logMessage],
          usedPlayerSkills: target === 'player' ? usedSkills : state.currentRound.usedPlayerSkills,
          usedEnemySkills: target === 'enemy' ? usedSkills : state.currentRound.usedEnemySkills,
        }
      };
    }

    case 'END_ROUND': {
      const {winner} = action;
      let playerRoundsWon = state.playerRoundsWon;
      let enemyRoundsWon = state.enemyRoundsWon;
      let logMessage = '';

      if (winner === 'player') {
        playerRoundsWon++;
        logMessage = 'Player wins the round!';
      } else if (winner === 'enemy') {
        enemyRoundsWon++;
        logMessage = 'Enemy wins the round!';
      } else {
        logMessage = "It's a tie!";
      }

      let fightWinner: 'player' | 'enemy' | null = null;
      if (playerRoundsWon >= 2) fightWinner = 'player';
      if (enemyRoundsWon >= 2) fightWinner = 'enemy';

      return {
        ...state,
        playerRoundsWon,
        enemyRoundsWon,
        winner: fightWinner,
        currentRound: {
          ...state.currentRound,
          log: [...state.currentRound.log, logMessage],
          isPlayerTurn: false, // End of round
        }
      };
    }

    default:
      return state;
  }
};

const SkillButton: React.FC<{
  skill: keyof PlayerAttributes,
  player: PlayerStats,
  usedCount: number,
  onClick: () => void,
  disabled: boolean,
  skillDetails: Record<keyof PlayerAttributes, { icon: React.ElementType, name: string, description: string }>
}> = ({skill, player, usedCount, onClick, disabled,skillDetails}) => {
  const details = skillDetails[skill];
  const mod = getMod(player.attributes[skill]);
  const remaining = mod - usedCount;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onClick} disabled={disabled || remaining <= 0} variant="outline" size="sm" className="relative h-auto py-2 flex flex-col">
            <details.icon />
            <span className="text-xs mt-1">{details.name}</span>
            <Badge className="absolute -top-2 -right-2 px-1.5">{remaining}</Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">{details.name} (Uses: {remaining}/{mod})</p>
          <p className="text-xs text-muted-foreground">{details.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function MobileFightScreen({player, enemy, onFightComplete, language}: MobileFightScreenProps) {
  const t = useMemo(() => getTranslator(language), [language]);
  const [state, dispatch] = useReducer(fightReducer, createInitialFightState(player, enemy));

  const [showPeek, setShowPeek] = useState(false);

  const {currentRound, winner} = state;
  const playerMod = {
    str: getMod(player.attributes.strength),
    dex: getMod(player.attributes.dexterity),
    con: getMod(player.attributes.constitution),
    int: getMod(player.attributes.intelligence),
    wis: getMod(player.attributes.wisdom),
    cha: getMod(player.attributes.charisma),
  };
  
  const playerBustThreshold = 12 + playerMod.con;
  const enemyBustThreshold = 12 + getMod(enemy.attributes.constitution);
  const didPlayerBust = currentRound.playerSum > playerBustThreshold;
  const didEnemyBust = currentRound.enemySum > enemyBustThreshold;

  const skillDetails: Record<keyof PlayerAttributes, { icon: React.ElementType, name: string, description: string }> = useMemo(() => ({
    strength: { icon: ChevronsUp, name: t.skillPower, description: t.skillPowerDescription },
    dexterity: { icon: Footprints, name: t.skillSidestep, description: t.skillSidestepDescription },
    constitution: { icon: Heart, name: t.skillBuffer, description: t.skillBufferDescription },
    intelligence: { icon: Eye, name: t.skillPeek, description: t.skillPeekDescription },
    wisdom: { icon: BookOpen, name: t.skillPoise, description: t.skillPoiseDescription },
    charisma: { icon: Smile, name: t.skillPressure, description: t.skillPressureDescription },
  }), [t]);


  useEffect(() => {
      dispatch({type: 'START_FIGHT'});
      setTimeout(() => dispatch({type: 'START_ROUND'}), 100);
  }, []);

  useEffect(() => {
    if (winner) return;

    const sidestepAvailable = (playerMod.dex - (currentRound.usedPlayerSkills.dexterity || 0)) > 0;
    const playerIsBustedAndCannotRecover = didPlayerBust && !sidestepAvailable;

    const roundIsOver = (currentRound.playerStand && currentRound.enemyStand) || playerIsBustedAndCannotRecover || didEnemyBust;

    if (roundIsOver) {
      let roundWinner: 'player' | 'enemy' | 'tie' = 'tie';

      if (playerIsBustedAndCannotRecover) {
        roundWinner = 'enemy';
      } else if (didEnemyBust) {
        roundWinner = 'player';
      } else {
        const pFinal = currentRound.playerSum + currentRound.playerBonus;
        const eFinal = currentRound.enemySum + currentRound.enemyBonus;

        if (pFinal > eFinal) roundWinner = 'player';
        else if (pFinal < eFinal) roundWinner = 'enemy';
        else roundWinner = rollD6() > 3 ? 'player' : 'enemy';
        
        dispatch({type: 'LOG', message: `Comparing scores: Player(${pFinal}) vs Enemy(${eFinal})`});
      }

      setTimeout(() => dispatch({type: 'END_ROUND', winner: roundWinner}), 1000);
    } else {
      if (!currentRound.isPlayerTurn) {
        setTimeout(() => dispatch({type: 'ENEMY_TURN'}), 1000);
      }
    }
  }, [currentRound.playerStand, currentRound.enemyStand, didPlayerBust, didEnemyBust, winner, currentRound.playerSum, currentRound.enemySum, currentRound.playerBonus, currentRound.enemyBonus, playerBustThreshold, enemyBustThreshold, player.attributes.dexterity, enemy.attributes.dexterity, playerMod.dex, currentRound.usedPlayerSkills.dexterity]);


  const handlePlayerPress = () => dispatch({type: 'PLAYER_PRESS'});
  const handlePlayerStand = () => {
    if (currentRound.playerSum <= 10 && (currentRound.usedPlayerSkills.wisdom || 0) < playerMod.wis) {
      if (confirm("Use Poise to add +2 to your comparison total?")) {
        dispatch({type: 'USE_SKILL', skill: 'wisdom', target: 'player'});
      }
    }
    dispatch({type: 'PLAYER_STAND'});
  }

  const handleClose = () => {
    if (winner) onFightComplete(winner === 'player' ? 'win' : 'loss');
  }

  const handleSidestep = () => dispatch({type: 'USE_SKILL', skill: 'dexterity', target: 'player'});
  const handlePeek = () => {
    dispatch({type: 'USE_SKILL', skill: 'intelligence', target: 'player'});
    setShowPeek(true);
    setTimeout(() => {
      setShowPeek(false);
      dispatch({type: 'LOG', message: 'You now know the next roll.'});
    }, 2000);
  }

  const isRoundOver = (currentRound.playerStand && currentRound.enemyStand) || didPlayerBust || didEnemyBust;

  const renderDice = (dice: number[], isPeek: boolean = false, peekValue: number | null = null) => (
    <div className="flex flex-wrap gap-2">
      {dice.map((d, i) => (
        <div key={`${state.round}-${i}`} className="flex flex-col items-center">
          <Dice d={d} duration={ANIMATION_DURATION}></Dice>
        </div>
      ))}
      {isPeek && peekValue && (
        <div className="flex flex-col items-center">
          <Dices className="w-8 h-8 p-1 border rounded-md text-sky-500 animate-pulse"/>
          <span className="text-sm font-mono mt-1 text-sky-500">{peekValue}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
         <header className="p-4 border-b text-center">
            <h2 className="flex items-center gap-2 text-xl font-headline justify-center">
                <Swords/>
                {t.fightTitle(state.round)}
            </h2>
            <p className="text-sm text-muted-foreground">{t.fightDescription(playerBustThreshold)}</p>
         </header>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Enemy */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Bot/> {enemy.name}</h3>
                    <Badge variant={didEnemyBust ? "destructive" : "secondary"}>
                        {currentRound.enemySum} / {enemyBustThreshold}
                    </Badge>
                </div>
                {renderDice(currentRound.enemyDice)}
            </div>
            
            {/* Score & Log */}
            <div className="flex flex-col items-center space-y-2">
                <div className="text-3xl font-bold text-center">
                    {state.playerRoundsWon} - {state.enemyRoundsWon}
                </div>
                <ScrollArea className="w-full h-24 bg-background border rounded-lg p-2 text-xs">
                    {currentRound.log.map((l, i) => <p key={i} className="font-mono">&gt; {l}</p>)}
                </ScrollArea>
            </div>
            
             {/* Player */}
            <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><User/> {player.name}</h3>
                    <Badge variant={didPlayerBust ? "destructive" : "secondary"}>
                        {currentRound.playerSum} / {playerBustThreshold}
                    </Badge>
                </div>
                {renderDice(currentRound.playerDice, showPeek, currentRound.peekResult)}
                <Separator />
                 <div className="flex gap-2">
                    <Button onClick={handlePlayerPress} className="flex-1"
                            disabled={!currentRound.isPlayerTurn || didPlayerBust || currentRound.playerStand || !!winner}>{t.pressAction}</Button>
                    <Button onClick={handlePlayerStand} className="flex-1"
                            disabled={!currentRound.isPlayerTurn || didPlayerBust || currentRound.playerStand || !!winner}
                            variant="secondary">{t.standAction}</Button>
                </div>
                <p className="font-semibold text-sm">{t.skills}</p>
                <div className="grid grid-cols-3 gap-2">
                    <SkillButton skill="strength" player={player} usedCount={currentRound.usedPlayerSkills.strength || 0}
                                onClick={() => dispatch({type: 'USE_SKILL', skill: 'strength', target: 'player'})}
                                disabled={!currentRound.playerStand || !!winner} skillDetails={skillDetails}/>
                    <SkillButton skill="dexterity" player={player} usedCount={currentRound.usedPlayerSkills.dexterity || 0}
                                onClick={handleSidestep} disabled={!didPlayerBust || !!winner} skillDetails={skillDetails}/>
                    <SkillButton skill="intelligence" player={player}
                                usedCount={currentRound.usedPlayerSkills.intelligence || 0} onClick={handlePeek}
                                disabled={!currentRound.isPlayerTurn || currentRound.playerStand || !!winner}
                                skillDetails={skillDetails}/>
                </div>
            </div>
        </div>
        
        <div className="p-4 border-t space-y-2 shrink-0">
            {winner && (
              <div className="text-center font-bold text-2xl p-2 text-primary animate-in fade-in-50">
                {winner === 'player' ? t.fightWin : t.fightLoss}
              </div>
            )}
            {isRoundOver && !winner && (
              <Button onClick={() => dispatch({type: 'START_ROUND'})} className="w-full">
                {t.fightNextRound}
              </Button>
            )}
            {winner && (
              <Button onClick={handleClose} className="w-full">
                {t.fightLeave}
              </Button>
            )}
             {!winner && !isRoundOver && (
                 <Button onClick={() => onFightComplete('loss')} variant="outline" className="w-full">
                    <XCircle className="mr-2"/> Forfeit
                 </Button>
            )}
        </div>
      </div>
  );
}
