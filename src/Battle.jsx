import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Swords, Shield, Heart, Zap, Trophy, Skull, Clock, Volume2, VolumeX, Play, Target, Flame, Crown } from 'lucide-react';
import { 
  BATTLE_ADDRESS, 
  FIGHTER_ADDRESS, 
  HERALD_STAKING_ADDRESS,
  HERALD_ADDRESS,
  GAMEBALANCE_ADDRESS,
  BATTLE_ABI,
  FIGHTER_ABI,
  HERALD_STAKING_ABI,
  HERALD_ABI,
  GAMEBALANCE_ABI,
  CLAN_NAMES
} from './contractConfig';

// BATTLE ENTRY COST
const BATTLE_ENTRY_COST = 50; // 50 FOOD tokens
const ENERGY_COST = 20; // 20 energy per battle

// ENEMY DATA
const ENEMIES = [
  {
    id: 1,
    name: "Zimrek",
    title: "Professional Assassin",
    weapon: "Blunderbuss",
    description: "A cold-blooded killer for hire",
    maxHP: 3,
    rewardFood: 10,
    rewardGold: 2,
    rewardWood: 1
  },
  {
    id: 2,
    name: "Lord Jeroboam",
    title: "Elite Conspirator",
    weapon: "Flintlock Pistol",
    description: "A cunning noble with dark ambitions",
    maxHP: 3,
    rewardFood: 25,
    rewardGold: 5,
    rewardWood: 3
  },
  {
    id: 3,
    name: "Nebchud Baddon",
    title: "Corrupted Ruler",
    weapon: "Gilded Sceptre",
    description: "The fallen king who sold his soul",
    maxHP: 3,
    rewardFood: 50,
    rewardGold: 10,
    rewardWood: 10
  }
];

// HIT CHANCE TABLES
const FIGHTER_HIT_CHANCES = {
  0: [20, 10, 3],   // Bronze
  1: [30, 20, 10],  // Silver
  2: [40, 30, 20]   // Gold
};

const ENEMY_HIT_CHANCES = {
  0: [85, 90, 95],  // vs Bronze
  1: [75, 80, 85],  // vs Silver
  2: [70, 72, 75]   // vs Gold
};

// ACTIVE ARENA (only one for testing)
const ACTIVE_ARENA = {
  id: 5,
  name: "The Castle Grounds",
  clan: 5, // Witkastle
  description: "Ancient battleground of the Witkastle clan"
};

export default function Battle({ walletAddress }) {
  // Core state
  const [gameState, setGameState] = useState('loading');
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [currentEnemy, setCurrentEnemy] = useState(1);
  
  // Fighter data
  const [stakedFighters, setStakedFighters] = useState([]);
  const [heraldBonus, setHeraldBonus] = useState(0);
  
  // Combat state
  const [fighterHP, setFighterHP] = useState(3);
  const [enemyHP, setEnemyHP] = useState(3);
  const [currentTurn, setCurrentTurn] = useState('player');
  const [combatLog, setCombatLog] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Battle boosts
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [usedBoosts, setUsedBoosts] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combatLog]);

  useEffect(() => {
    if (walletAddress) {
      loadBattleData();
    }
  }, [walletAddress]);

  // ============= DATA LOADING =============
  
  const loadBattleData = async () => {
    try {
      console.log('Loading battle data for:', walletAddress);
      setLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, provider);

      const balance = await fighterContract.balanceOf(walletAddress);
      console.log('User owns', balance.toString(), 'fighters');
      
      const fighters = [];
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await fighterContract.tokenOfOwnerByIndex(walletAddress, i);
          const data = await fighterContract.fighters(tokenId);
          
          fighters.push({
            tokenId: tokenId.toString(),
            rarity: Number(data[0]),
            clan: Number(data[1]),
            energy: Number(data[2]),
            isStaked: data[8],
            inBattle: data[9]
          });
        } catch (e) {
          console.warn('Error loading fighter:', e);
        }
      }

      const staked = fighters.filter(f => f.isStaked && !f.inBattle && f.energy >= ENERGY_COST);
      console.log('Found', staked.length, 'staked fighters ready for battle');
      setStakedFighters(staked);

      setGameState('fighter-select');
    } catch (err) {
      console.error('Error loading battle data:', err);
      setError('Failed to load battle data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkClanHeraldStaked = async (fighterClan) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const heraldStaking = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, provider);
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI, provider);

      let stakedHeralds = [];
      try {
        stakedHeralds = await heraldStaking.getUserStakedHeralds(walletAddress);
      } catch (e) {
        try {
          stakedHeralds = await heraldStaking.getStakedHeralds(walletAddress);
        } catch (e2) {
          console.warn('Could not get staked heralds:', e2);
          return { hasHerald: false, bonus: 0 };
        }
      }

      for (const tokenId of stakedHeralds) {
        try {
          const heraldData = await heraldContract.getHerald(tokenId);
          const heraldRarity = Number(heraldData[0]);
          const heraldClan = Number(heraldData[1]);

          if (heraldClan === fighterClan) {
            let bonus = 0;
            if (heraldRarity === 0) bonus = 2;
            else if (heraldRarity === 1) bonus = 5;
            else if (heraldRarity === 2) bonus = 10;

            console.log(`Found ${['Bronze', 'Silver', 'Gold'][heraldRarity]} Herald of clan ${CLAN_NAMES[heraldClan]}, bonus: +${bonus}%`);
            return { hasHerald: true, bonus };
          }
        } catch (e) {
          console.warn('Error checking herald:', e);
        }
      }

      return { hasHerald: false, bonus: 0 };
    } catch (err) {
      console.error('Error checking herald:', err);
      return { hasHerald: false, bonus: 0 };
    }
  };

  // ============= BATTLE FLOW =============

  const selectFighter = async (fighter) => {
    try {
      setLoading(true);
      
      const { hasHerald, bonus } = await checkClanHeraldStaked(fighter.clan);
      
      if (!hasHerald) {
        setError(`You need a Herald of clan ${CLAN_NAMES[fighter.clan]} staked to battle with this Fighter!`);
        setLoading(false);
        return;
      }

      setSelectedFighter(fighter);
      setHeraldBonus(bonus);
      setLoading(false);
      setGameState('arena-intro');
    } catch (err) {
      console.error('Error selecting fighter:', err);
      setError('Failed to select fighter: ' + err.message);
      setLoading(false);
    }
  };

  const enterArena = async () => {
    try {
      setLoading(true);
      addLog('🎯 Preparing to enter battle arena...', 'system');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);

      // Check if can enter battle
      const canEnter = await battleContract.canEnterBattle(selectedFighter.tokenId, ACTIVE_ARENA.id);
      if (!canEnter) {
        throw new Error('Fighter cannot enter battle - check requirements');
      }

      // Calculate home arena bonus
      const arenaBonus = ACTIVE_ARENA.clan === selectedFighter.clan ? 5 : 0;
      if (arenaBonus > 0) {
        addLog(`🏰 Home Arena Advantage! +${arenaBonus}% hit chance`, 'boost');
      }

      console.log('Entering battle:', {
        fighterId: selectedFighter.tokenId,
        arenaId: ACTIVE_ARENA.id,
        enemyNumber: 1,
        fighterClan: selectedFighter.clan,
        arenaClan: ACTIVE_ARENA.clan,
        homeBonus: arenaBonus
      });

      addLog('⏳ Submitting transaction...', 'system');

      // Call battle contract with explicit gas limit
      const tx = await battleContract.enterBattle(
        selectedFighter.tokenId,
        ACTIVE_ARENA.id,
        1, // Always start at enemy 1
        {
          gasLimit: 500000 // Explicit gas limit to avoid estimation issues
        }
      );

      addLog('⏳ Waiting for confirmation...', 'system');
      const receipt = await tx.wait();

      addLog(`✅ Battle started in ${ACTIVE_ARENA.name}!`, 'success');
      
      // Initialize battle state
      setCurrentEnemy(1);
      setFighterHP(3);
      setEnemyHP(3);
      setCurrentTurn('player');
      setCombatLog([]);
      setUsedBoosts([]);

      // Add test boosts
      setActiveBoosts([
        { id: 'herald_bonus', name: `Herald Bonus (+${heraldBonus}%)`, passive: true, hitBonus: heraldBonus },
        { id: 'arena_bonus', name: `Arena Bonus (+${arenaBonus}%)`, passive: true, hitBonus: arenaBonus }
      ]);

      setGameState('battle');
      setLoading(false);
    } catch (err) {
      console.error('Error entering battle:', err);
      
      // Parse error message
      let errorMsg = err.message;
      if (err.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient FOOD balance. You need at least 50 FOOD to enter battle.';
      } else if (err.message.includes('Not authorized')) {
        errorMsg = 'Battle contract not authorized. Please contact admin.';
      } else if (err.message.includes('Fighter not staked')) {
        errorMsg = 'Fighter must be staked to enter battle.';
      } else if (err.message.includes('Insufficient energy')) {
        errorMsg = 'Fighter needs at least 20 energy to battle.';
      }
      
      setError('Failed to enter battle: ' + errorMsg);
      setLoading(false);
    }
  };

  const playerAttack = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Calculate hit chance
    let baseAccuracy = FIGHTER_HIT_CHANCES[selectedFighter.rarity][currentEnemy - 1];
    let totalAccuracy = baseAccuracy;

    // Apply boosts
    activeBoosts.forEach(boost => {
      if (boost.hitBonus && !usedBoosts.includes(boost.id)) {
        totalAccuracy += boost.hitBonus;
      }
    });

    totalAccuracy = Math.min(95, totalAccuracy);

    const roll = Math.random() * 100;
    const didHit = roll <= totalAccuracy;

    addLog(`🎯 ${CLAN_NAMES[selectedFighter.clan]} Fighter attacks! (${totalAccuracy}% chance)`, 'player');

    setTimeout(() => {
      if (didHit) {
        setEnemyHP(hp => {
          const newHP = Math.max(0, hp - 1);
          addLog(`⚔️ HIT! ${ENEMIES[currentEnemy - 1].name} loses 1 HP (${newHP}/3 remaining)`, 'success');
          return newHP;
        });
      } else {
        addLog(`❌ MISS! Attack failed`, 'miss');
      }

      setTimeout(() => {
        setIsAnimating(false);
        
        const newEnemyHP = didHit ? enemyHP - 1 : enemyHP;
        if (newEnemyHP <= 0) {
          handleEnemyDefeated();
        } else {
          setCurrentTurn('enemy');
          setTimeout(enemyAttack, 1500);
        }
      }, 1000);
    }, 500);
  };

  const enemyAttack = () => {
    setIsAnimating(true);

    let baseAccuracy = ENEMY_HIT_CHANCES[selectedFighter.rarity][currentEnemy - 1];
    const totalAccuracy = Math.max(5, baseAccuracy);

    const roll = Math.random() * 100;
    const didHit = roll <= totalAccuracy;

    addLog(`💀 ${ENEMIES[currentEnemy - 1].name} attacks! (${totalAccuracy}% chance)`, 'enemy');

    setTimeout(() => {
      if (didHit) {
        setFighterHP(hp => {
          const newHP = Math.max(0, hp - 1);
          addLog(`💥 HIT! Fighter loses 1 HP (${newHP}/3 remaining)`, 'damage');
          return newHP;
        });
      } else {
        addLog(`🛡️ MISS! Fighter evaded!`, 'evade');
      }

      setTimeout(() => {
        setIsAnimating(false);
        
        const newFighterHP = didHit ? fighterHP - 1 : fighterHP;
        if (newFighterHP <= 0) {
          handleFighterDefeated();
        } else {
          setCurrentTurn('player');
        }
      }, 1000);
    }, 500);
  };

  const handleEnemyDefeated = () => {
    const enemy = ENEMIES[currentEnemy - 1];
    addLog(`🏆 VICTORY! ${enemy.name} has been defeated!`, 'victory');
    addLog(`💰 Rewards: +${enemy.rewardFood} FOOD, +${enemy.rewardGold} GOLD, +${enemy.rewardWood} WOOD`, 'reward');

    if (currentEnemy === 3) {
      setGameState('victory');
    } else {
      setTimeout(() => {
        setGameState('enemy-transition');
      }, 2000);
    }
  };

  const handleFighterDefeated = () => {
    addLog(`💀 DEFEAT! Your fighter has fallen...`, 'defeat');
    setGameState('defeat');
  };

  const continueToNextEnemy = () => {
    const nextEnemy = currentEnemy + 1;
    setCurrentEnemy(nextEnemy);
    setEnemyHP(3);
    setCurrentTurn('player');
    setCombatLog([]);
    
    addLog(`⚔️ Facing ${ENEMIES[nextEnemy - 1].name}...`, 'system');
    setGameState('battle');
  };

  const returnHome = () => {
    setGameState('fighter-select');
    loadBattleData();
  };

  const addLog = (message, type = 'system') => {
    setCombatLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
  };

  // ============= RENDER =============

  if (loading && gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading battle data...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedFighter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // FIGHTER SELECTION
  if (gameState === 'fighter-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-red-500 mb-2 flex items-center justify-center gap-2">
              <Swords className="w-10 h-10" />
              Battle Arena
            </h1>
            <p className="text-gray-400">Select a staked Fighter to enter battle</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {stakedFighters.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-8 text-center">
              <Skull className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No Fighters Ready for Battle</p>
              <p className="text-gray-500 text-sm">
                You need a staked Fighter with at least {ENERGY_COST} energy to battle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stakedFighters.map(fighter => (
                <div 
                  key={fighter.tokenId}
                  onClick={() => selectFighter(fighter)}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-red-500 transition-all hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-bold">
                        {['Bronze', 'Silver', 'Gold'][fighter.rarity]} Fighter
                      </h3>
                      <p className="text-gray-400 text-sm">{CLAN_NAMES[fighter.clan]}</p>
                    </div>
                    <Crown className={`w-6 h-6 ${
                      fighter.rarity === 2 ? 'text-yellow-400' :
                      fighter.rarity === 1 ? 'text-gray-400' :
                      'text-orange-600'
                    }`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Energy
                      </span>
                      <span className="text-white font-mono">{fighter.energy}/100</span>
                    </div>

                    <div className="bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${fighter.energy}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <span className="inline-block bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                      Click to Select
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              Battle Rules
            </h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Entry Cost: {BATTLE_ENTRY_COST} FOOD + {ENERGY_COST} Energy</li>
              <li>• Face 3 enemies sequentially</li>
              <li>• Defeat all 3 for maximum rewards</li>
              <li>• Requires Herald of same clan staked</li>
              <li>• Home arena gives +5% hit bonus</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ARENA INTRO
  if (gameState === 'arena-intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
            <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
            
            <h2 className="text-3xl font-bold text-white mb-2">
              Ready for Battle?
            </h2>
            
            <div className="my-6 p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 mb-4">Your Fighter:</p>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {['Bronze', 'Silver', 'Gold'][selectedFighter.rarity]} {CLAN_NAMES[selectedFighter.clan]}
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Heart className="w-4 h-4 text-red-500" />
                    3 HP
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    {selectedFighter.energy - ENERGY_COST} Energy (after battle)
                  </span>
                  {heraldBonus > 0 && (
                    <span className="flex items-center gap-1 text-green-400">
                      <Shield className="w-4 h-4" />
                      +{heraldBonus}% Herald Bonus
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
              <p className="text-gray-400 mb-2">Arena:</p>
              <h3 className="text-xl font-bold text-white mb-1">{ACTIVE_ARENA.name}</h3>
              <p className="text-gray-500 text-sm">{ACTIVE_ARENA.description}</p>
              {ACTIVE_ARENA.clan === selectedFighter.clan && (
                <p className="text-green-400 text-sm mt-2">🏰 Home Arena! +5% Hit Bonus</p>
              )}
            </div>

            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-400 font-bold mb-2">Entry Cost:</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-white">{BATTLE_ENTRY_COST} FOOD</span>
                <span className="text-gray-500">+</span>
                <span className="text-white">{ENERGY_COST} Energy</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={returnHome}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={enterArena}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Entering...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Enter Battle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BATTLE SCREEN
  if (gameState === 'battle') {
    const enemy = ENEMIES[currentEnemy - 1];
    const rarityName = ['Bronze', 'Silver', 'Gold'][selectedFighter.rarity];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-red-500 mb-1">{ACTIVE_ARENA.name}</h2>
            <p className="text-gray-400">{ACTIVE_ARENA.description}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-gray-500 text-sm">Enemy {currentEnemy}/3:</span>
              <span className="text-white font-bold">{enemy.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fighter Card */}
            <div className="bg-gray-800/50 border-2 border-blue-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {rarityName} {CLAN_NAMES[selectedFighter.clan]}
                </h3>
                <p className="text-gray-400 text-sm">Your Fighter</p>
              </div>

              <div className="flex justify-center gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i}
                    className={`w-8 h-8 ${i < fighterHP ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
                  />
                ))}
              </div>

              {activeBoosts.length > 0 && (
                <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500 rounded">
                  <p className="text-purple-400 text-xs font-bold mb-2">Active Bonuses:</p>
                  <div className="space-y-1">
                    {activeBoosts.map(boost => (
                      <div key={boost.id} className="text-xs text-purple-300">
                        {boost.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTurn === 'player' && (
                <button
                  onClick={playerAttack}
                  disabled={isAnimating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Swords className="w-5 h-5" />
                  Attack
                </button>
              )}

              {currentTurn === 'enemy' && (
                <div className="text-center text-gray-400 py-3">
                  <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  Enemy's Turn...
                </div>
              )}
            </div>

            {/* Combat Log */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Combat Log
              </h3>
              <div 
                ref={logRef}
                className="h-80 overflow-y-auto space-y-2 pr-2"
              >
                {combatLog.map((log, i) => (
                  <div 
                    key={i}
                    className={`text-sm p-2 rounded ${
                      log.type === 'player' ? 'bg-blue-900/30 text-blue-300' :
                      log.type === 'enemy' ? 'bg-red-900/30 text-red-300' :
                      log.type === 'success' ? 'bg-green-900/30 text-green-300' :
                      log.type === 'damage' ? 'bg-red-900/30 text-red-400' :
                      log.type === 'victory' ? 'bg-yellow-900/30 text-yellow-300' :
                      log.type === 'boost' ? 'bg-purple-900/30 text-purple-300' :
                      'bg-gray-900/30 text-gray-400'
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </div>

            {/* Enemy Card */}
            <div className="bg-gray-800/50 border-2 border-red-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{enemy.name}</h3>
                <p className="text-gray-400 text-sm">{enemy.title}</p>
                <p className="text-gray-500 text-xs">{enemy.weapon}</p>
              </div>

              <div className="flex justify-center gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Skull 
                    key={i}
                    className={`w-8 h-8 ${i < enemyHP ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
                  />
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 text-center">
                {enemy.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ENEMY TRANSITION
  if (gameState === 'enemy-transition') {
    const nextEnemy = ENEMIES[currentEnemy];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          
          <h2 className="text-3xl font-bold text-green-400 mb-4">
            Enemy Defeated!
          </h2>

          <p className="text-gray-300 mb-6">
            Your Fighter stands victorious, but the challenge continues...
          </p>

          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Next Challenge:</h3>
            <p className="text-2xl font-bold text-red-400 mb-1">{nextEnemy.name}</p>
            <p className="text-gray-400">{nextEnemy.title}</p>
          </div>

          <button
            onClick={continueToNextEnemy}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Swords className="w-5 h-5" />
            Continue Battle
          </button>
        </div>
      </div>
    );
  }

  // VICTORY
  if (gameState === 'victory') {
    const totalFood = ENEMIES.reduce((sum, e) => sum + e.rewardFood, 0);
    const totalGold = ENEMIES.reduce((sum, e) => sum + e.rewardGold, 0);
    const totalWood = ENEMIES.reduce((sum, e) => sum + e.rewardWood, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800/50 border-2 border-yellow-500 rounded-lg p-8 text-center">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
          
          <h2 className="text-4xl font-bold text-yellow-400 mb-2">
            GRAND VICTORY!
          </h2>
          
          <p className="text-gray-300 mb-8">
            You have conquered all 3 enemies in {ACTIVE_ARENA.name}!
          </p>

          <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Total Rewards:</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-orange-900/20 border border-orange-500 rounded p-3">
                <p className="text-orange-400 text-2xl font-bold">{totalFood}</p>
                <p className="text-gray-400 text-sm">FOOD</p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500 rounded p-3">
                <p className="text-yellow-400 text-2xl font-bold">{totalGold}</p>
                <p className="text-gray-400 text-sm">GOLD</p>
              </div>
              <div className="bg-green-900/20 border border-green-500 rounded p-3">
                <p className="text-green-400 text-2xl font-bold">{totalWood}</p>
                <p className="text-gray-400 text-sm">WOOD</p>
              </div>
            </div>
          </div>

          <button
            onClick={returnHome}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Return to Fighter Select
          </button>
        </div>
      </div>
    );
  }

  // DEFEAT
  if (gameState === 'defeat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/40 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800/50 border-2 border-red-500 rounded-lg p-8 text-center">
          <Skull className="w-20 h-20 text-red-500 mx-auto mb-4" />
          
          <h2 className="text-4xl font-bold text-red-400 mb-2">
            DEFEAT
          </h2>
          
          <p className="text-gray-300 mb-8">
            Your Fighter has fallen to {ENEMIES[currentEnemy - 1].name}...
          </p>

          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-6">
            <p className="text-gray-400 mb-2">Entry fee was consumed:</p>
            <p className="text-red-400 font-bold">-{BATTLE_ENTRY_COST} FOOD</p>
            <p className="text-red-400 font-bold">-{ENERGY_COST} Energy</p>
          </div>

          <button
            onClick={returnHome}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Return to Fighter Select
          </button>
        </div>
      </div>
    );
  }

  return null;
}