
// src/components/game/FightDialog.tsx
'use client';
import React, {useMemo, useEffect, useReducer, useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {getTranslator} from '@/lib/i18n';
import {Swords, Dices, Shield, ArrowRight, Skull, Star, HelpCircle, User, Bot, Eye, ChevronsUp, Heart, Brain, BookOpen, Smile, Footprints} from 'lucide-react';
import type {PlayerStats, FightState, PlayerAttributes} from '@/types/game';
import {cn} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FightDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  player: PlayerStats;
  enemy: PlayerStats; // Assuming enemy has the same stat structure
  onFightComplete: (result: 'win' | 'loss') => void;
  language: 'en' | 'zh';
}

const clamp = (num: number, min: number, max: number) => Math.max(min, Math.min(num, max));
const getMod = (score: number) => clamp(Math.floor((score - 10) / 2), 0, 3);
const rollD6 = () => Math.floor(Math.random() * 6) + 1;


type FightAction =
    | { type: 'START_FIGHT' }
    | { type: 'START_ROUND' }
    | { type: 'PLAYER_PRESS' }
    | { type: 'PLAYER_STAND' }
    | { type: 'ENEMY_TURN' }
    | { type: 'END_ROUND'; winner: 'player' | 'enemy' | 'tie' }
    | { type: 'USE_SKILL'; skill: keyof PlayerAttributes, target: 'player' | 'enemy'}
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
                ...createInitialFightState(state.player, state.enemy),
                round: state.round + 1,
                playerRoundsWon: state.playerRoundsWon,
                enemyRoundsWon: state.enemyRoundsWon,
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
            
            const playerBusted = state.currentRound.playerSum > (12 + getMod(state.player.attributes.constitution));
            const shouldStand = state.currentRound.enemySum >= 10 || playerBusted || (state.currentRound.playerStand && state.currentRound.enemySum >= state.currentRound.playerSum);

            if (shouldStand) {
                return {
                    ...state,
                    currentRound: {
                        ...state.currentRound,
                        enemyStand: true,
                        isPlayerTurn: state.currentRound.playerStand ? false : true,
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
                        isPlayerTurn: state.currentRound.playerStand ? false : true,
                        log: [...state.currentRound.log, `Enemy presses, rolls a ${newDie}. Sum: ${newSum}`]
                    }
                };
            }
        }
        
        case 'USE_SKILL': {
             let newState = { ...state };
             const { skill, target } = action;
             const user = target === 'player' ? state.player : state.enemy;
             const usedSkills = target === 'player' ? { ...state.currentRound.usedPlayerSkills } : { ...state.currentRound.usedEnemySkills };
             const mod = getMod(user.attributes[skill]);
             
             if ((usedSkills[skill] || 0) >= mod) {
                return state; // No uses left
             }
             
             usedSkills[skill] = (usedSkills[skill] || 0) + 1;
             
             let logMessage = `${target === 'player' ? 'Player' : 'Enemy'} uses ${skill}!`;

             switch(skill) {
                case 'strength':
                    if(target === 'player') newState.currentRound.playerBonus += 1;
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
                     if(target === 'player') newState.currentRound.playerBonus += 2;
                     else newState.currentRound.enemyBonus += 2;
                    break;
                case 'charisma': // Pressure, handled in component
                     logMessage = 'Player uses Pressure, forcing the enemy to press!';
                     // The actual forcing happens in the component logic
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
            const { winner } = action;
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

const skillDetails: Record<keyof PlayerAttributes, { icon: React.ElementType, name: string, description: string }> = {
    strength: { icon: ChevronsUp, name: 'Power', description: 'At end of round, add +1 to your final sum. Can be used multiple times.' },
    dexterity: { icon: Footprints, name: 'Sidestep', description: 'When a roll makes you bust, use this to cancel that roll and immediately Stand.' },
    constitution: { icon: Heart, name: 'Buffer', description: 'Passive. Your bust threshold is increased by your CON modifier.' },
    intelligence: { icon: Eye, name: 'Peek', description: 'Before you Press, use this to see what the next die roll will be.' },
    wisdom: { icon: BookOpen, name: 'Poise', description: 'When you Stand with a sum of 10 or less, use this to add +2 to your sum for comparison purposes only.' },
    charisma: { icon: Smile, name: 'Pressure', description: 'When the enemy is about to Stand with a sum of 10 or less, use this to force them to Press instead.' },
};

const SkillButton: React.FC<{
    skill: keyof PlayerAttributes,
    player: PlayerStats,
    usedCount: number,
    onClick: () => void,
    disabled: boolean,
}> = ({skill, player, usedCount, onClick, disabled}) => {
    const details = skillDetails[skill];
    const mod = getMod(player.attributes[skill]);
    const remaining = mod - usedCount;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={onClick} disabled={disabled || remaining <= 0} variant="outline" size="sm" className="relative">
                        <details.icon className="mr-2" />
                        {details.name}
                        <Badge className="absolute -top-2 -right-2">{remaining}</Badge>
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


export function FightDialog({ isOpen, onOpenChange, player, enemy, onFightComplete, language }: FightDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);
  const [state, dispatch] = useReducer(fightReducer, createInitialFightState(player, enemy));
  
  const [showPeek, setShowPeek] = useState(false);
  const [animatedDice, setAnimatedDice] = useState<Set<number>>(new Set());

  // Derived state for easier access
  const { currentRound, winner } = state;
  const playerMod = {
      str: getMod(player.attributes.strength),
      dex: getMod(player.attributes.dexterity),
      con: getMod(player.attributes.constitution),
      int: getMod(player.attributes.intelligence),
      wis: getMod(player.attributes.wisdom),
      cha: getMod(player.attributes.charisma),
  };
   const enemyMod = {
      con: getMod(enemy.attributes.constitution),
      cha: getMod(enemy.attributes.charisma),
  };

  const playerBustThreshold = 12 + playerMod.con;
  const enemyBustThreshold = 12 + enemyMod.con;
  const didPlayerBust = currentRound.playerSum > playerBustThreshold;
  const didEnemyBust = currentRound.enemySum > enemyBustThreshold;

  const prevPlayerDiceCount = useRef(currentRound.playerDice.length);
  const prevEnemyDiceCount = useRef(currentRound.enemyDice.length);

  useEffect(() => {
    const newAnimated = new Set<number>();
    if (currentRound.playerDice.length > prevPlayerDiceCount.current) {
        newAnimated.add(currentRound.playerDice.length - 1);
    }
     if (currentRound.enemyDice.length > prevEnemyDiceCount.current) {
        newAnimated.add(100 + currentRound.enemyDice.length - 1); // use prefix to avoid collision
    }
    setAnimatedDice(newAnimated);

    prevPlayerDiceCount.current = currentRound.playerDice.length;
    prevEnemyDiceCount.current = currentRound.enemyDice.length;
  }, [currentRound.playerDice, currentRound.enemyDice]);


  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'START_FIGHT' });
      // Use timeout to allow state to reset before starting round
      setTimeout(() => dispatch({ type: 'START_ROUND' }), 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!currentRound.isPlayerTurn && !winner && !didPlayerBust) {
        if (didPlayerBust) {
            // If player busts, enemy turn is skipped, go to end of round
            // But only if they can't sidestep
             const sidestepAvailable = (playerMod.dex - (currentRound.usedPlayerSkills.dexterity || 0)) > 0;
             if (!sidestepAvailable) {
                dispatch({ type: 'END_ROUND', winner: 'enemy' });
             }
        } else {
            setTimeout(() => dispatch({ type: 'ENEMY_TURN' }), 1000);
        }
    }
  }, [currentRound.isPlayerTurn, didPlayerBust, winner]);


  useEffect(() => {
    // End of round conditions
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
            
            const pDist = playerBustThreshold - pFinal;
            const eDist = enemyBustThreshold - eFinal;
            
            if (pDist < eDist) roundWinner = 'player';
            else if (eDist < pDist) roundWinner = 'enemy';
            else { // Tie-break
                if (player.attributes.dexterity > enemy.attributes.dexterity) roundWinner = 'player';
                else if (enemy.attributes.dexterity > player.attributes.dexterity) roundWinner = 'enemy';
                else { // Final tie-break
                    roundWinner = rollD6() > 3 ? 'player' : 'enemy';
                }
            }
            dispatch({ type: 'LOG', message: `Comparing scores: Player(${pFinal}) vs Enemy(${eFinal})` });
        }
        
        setTimeout(() => dispatch({type: 'END_ROUND', winner: roundWinner }), 1000);
    }
  }, [currentRound.playerStand, currentRound.enemyStand, didPlayerBust, didEnemyBust, winner, currentRound.playerSum, currentRound.enemySum, currentRound.playerBonus, currentRound.enemyBonus, playerBustThreshold, enemyBustThreshold, player.attributes.dexterity, enemy.attributes.dexterity, playerMod.dex, currentRound.usedPlayerSkills.dexterity]);
  

  const handlePlayerPress = () => {
    dispatch({ type: 'PLAYER_PRESS' });
  };
  
  const handlePlayerStand = () => {
    if (currentRound.playerSum <= 10 && (currentRound.usedPlayerSkills.wisdom || 0) < playerMod.wis) {
        if(confirm("Use Poise to add +2 to your comparison total?")){
            dispatch({ type: 'USE_SKILL', skill: 'wisdom', target: 'player' });
        }
    }
    dispatch({ type: 'PLAYER_STAND' });
  }

  const handleClose = () => {
    if(winner) {
        onFightComplete(winner);
    }
    onOpenChange(false);
  }

  const handleSidestep = () => {
    dispatch({ type: 'USE_SKILL', skill: 'dexterity', target: 'player' });
  }
  
  const handlePeek = () => {
      dispatch({ type: 'USE_SKILL', skill: 'intelligence', target: 'player'});
      setShowPeek(true);
      setTimeout(() => {
          setShowPeek(false);
          dispatch({ type: 'LOG', message: 'You now know the next roll.' });
      }, 2000);
  }

  const isRoundOver = (currentRound.playerStand && currentRound.enemyStand) || (didPlayerBust && !(playerMod.dex - (currentRound.usedPlayerSkills.dexterity || 0) > 0)) || didEnemyBust;

  const renderDice = (dice: number[], isPlayer: boolean, isPeek: boolean = false, peekValue: number | null = null) => (
    <div className="flex flex-wrap gap-2 min-h-[60px]">
        {dice.map((d, i) => {
             const key = isPlayer ? i : 100 + i;
             const isAnimated = animatedDice.has(key);
             return (
                <div key={key} className={cn("flex flex-col items-center", isAnimated && 'animate-dice-roll')}>
                    <Dices className="w-8 h-8 p-1 border rounded-md" />
                    <span className={cn("text-sm font-mono mt-1 transition-opacity duration-500", isAnimated ? "opacity-0" : "opacity-100")}>{d}</span>
                </div>
            )
        })}
        {isPeek && peekValue && (
            <div className="flex flex-col items-center">
                <Dices className="w-8 h-8 p-1 border rounded-md text-sky-500 animate-pulse" />
                <span className="text-sm font-mono mt-1 text-sky-500">{peekValue}</span>
            </div>
        )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline justify-center">
            <Swords />
            Twelve Rush: Round {state.round}
          </DialogTitle>
          <DialogDescription className="text-center">
            Get closer to 12 + your CON bonus than your opponent without going over. Best 2 out of 3.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-6 items-stretch">
            {/* Enemy Side */}
             <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Bot /> {enemy.name}</h3>
                    <Badge variant={didEnemyBust ? "destructive" : "secondary"}>
                        Sum: {currentRound.enemySum} / {enemyBustThreshold}
                    </Badge>
                </div>
                {renderDice(currentRound.enemyDice, false)}
                 <Separator/>
                 <div className="flex-grow">
                    {/* Placeholder for enemy info */}
                 </div>
            </div>

            {/* Center Column: Score & Logs */}
            <div className="flex flex-col space-y-4">
                 <div className="text-4xl font-bold text-center">
                    {state.playerRoundsWon} - {state.enemyRoundsWon}
                </div>
                <div className="w-full flex-grow bg-background border rounded-lg p-2 overflow-y-auto text-sm">
                    {currentRound.log.map((l, i) => <p key={i} className="font-mono">&gt; {l}</p>)}
                </div>
                {winner && (
                    <div className="text-center font-bold text-3xl p-4 text-primary animate-in fade-in-50">
                        {winner === 'player' ? 'YOU WIN THE FIGHT!' : 'YOU LOST THE FIGHT.'}
                    </div>
                )}
                {isRoundOver && !winner && (
                    <Button onClick={() => dispatch({ type: 'START_ROUND' })} className="w-full">
                        Start Next Round
                    </Button>
                )}
                 {winner && (
                    <Button onClick={handleClose} className="w-full">
                        Leave
                    </Button>
                )}
            </div>

            {/* Player Side */}
            <div className="flex flex-col space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2"><User /> {player.name}</h3>
                    <Badge variant={didPlayerBust ? "destructive" : "secondary"}>
                         Sum: {currentRound.playerSum} / {playerBustThreshold}
                    </Badge>
                </div>
                 {renderDice(currentRound.playerDice, true, showPeek, currentRound.peekResult)}
                 <Separator/>
                 <div className="space-y-2">
                    <p className="font-semibold">Actions</p>
                    <div className="flex gap-2">
                        <Button onClick={handlePlayerPress} disabled={!currentRound.isPlayerTurn || didPlayerBust || currentRound.playerStand || !!winner }>Press (Hit)</Button>
                        <Button onClick={handlePlayerStand} disabled={!currentRound.isPlayerTurn || didPlayerBust || currentRound.playerStand || !!winner } variant="secondary">Stand</Button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <p className="font-semibold">Skills</p>
                     <div className="grid grid-cols-2 gap-2">
                        <SkillButton skill="strength" player={player} usedCount={currentRound.usedPlayerSkills.strength || 0} onClick={() => dispatch({type:'USE_SKILL', skill: 'strength', target: 'player'})} disabled={!currentRound.playerStand || !!winner} />
                        <SkillButton skill="dexterity" player={player} usedCount={currentRound.usedPlayerSkills.dexterity || 0} onClick={handleSidestep} disabled={!didPlayerBust || !!winner} />
                        <SkillButton skill="intelligence" player={player} usedCount={currentRound.usedPlayerSkills.intelligence || 0} onClick={handlePeek} disabled={!currentRound.isPlayerTurn || currentRound.playerStand || !!winner} />
                        <SkillButton skill="wisdom" player={player} usedCount={currentRound.usedPlayerSkills.wisdom || 0} onClick={() => {}} disabled={true} />
                        <SkillButton skill="charisma" player={player} usedCount={currentRound.usedPlayerSkills.charisma || 0} onClick={() => {}} disabled={true} />
                    </div>
                 </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
