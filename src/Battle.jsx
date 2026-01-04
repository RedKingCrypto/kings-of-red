import React, { useState, useEffect } from 'react';
import { Swords, Heart, Trophy, Skull, ArrowLeft, Zap, Shield, Crown, Target, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  FIGHTER_V4_ADDRESS, 
  BATTLE_ADDRESS, 
  GAME_BALANCE_V4_ADDRESS,
  HERALD_STAKING_ADDRESS,
  FIGHTER_V4_ABI, 
  BATTLE_ABI, 
  GAME_BALANCE_V4_ABI,
  HERALD_STAKING_ABI,
  TOKEN_IDS,
  CLAN_NAMES,
  RARITY_NAMES
} from './contractConfig';

// Fighter types per clan
const CLAN_FIGHTERS = {
  0: { name: 'Kenshi Champion', weapon: 'Katana' },
  1: { name: 'Shinobi', weapon: 'Kunai' },
  2: { name: 'Boarding Bruiser', weapon: "Sailor's Dirk" },
  3: { name: 'Templar Guard', weapon: 'Holy Sword' },
  4: { name: 'Enforcer', weapon: 'Iron Mace' },
  5: { name: 'Knight', weapon: 'Longsword' },
  6: { name: 'Oakwood Guardian', weapon: 'Bow' }
};

// Base IPFS URL for fighter images
const FIGHTER_IMAGE_BASE = 'https://emerald-adequate-eagle-845.mypinata.cloud/ipfs/bafybeia2alwupvq4ffp6pexcc4ekxz5nmtj4fguk7goxaddd7dcp7w2vbm';

export default function BattlePage({ connected, walletAddress, provider, onNavigate }) {
  // ============ STATE VARIABLES ============
  
  // Battle State
  const [gameState, setGameState] = useState('loading');
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [enemiesDefeated, setEnemiesDefeated] = useState([]);
  
  // HP Tracking
  const [fighterHP, setFighterHP] = useState(3);
  const [enemyHP, setEnemyHP] = useState(3);
  
  // Combat Flow
  const [currentTurn, setCurrentTurn] = useState('player');
  const [isAnimating, setIsAnimating] = useState(false);
  const [weaponAnimation, setWeaponAnimation] = useState(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [battleLog, setBattleLog] = useState([]);
  const [round, setRound] = useState(1);
  const [earnedRewards, setEarnedRewards] = useState(null);

  // Battle Boosts State
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [poisonedAttacksRemaining, setPoisonedAttacksRemaining] = useState(0);
  const [enemyFrozen, setEnemyFrozen] = useState(false);

  // Blockchain State
  const [userFighters, setUserFighters] = useState([]);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [txPending, setTxPending] = useState(false);
  const [foodBalance, setFoodBalance] = useState('0');
  const [hasStakedHerald, setHasStakedHerald] = useState(false);
  const [activeBattleId, setActiveBattleId] = useState(null);
  
  // Fighter Configuration
  const [fighter, setFighter] = useState(null);
  
  // Constants
  const ARENA_ID = 5;

  // Arena Configuration
  const arena = {
    name: "The Castle Grounds",
    clan: "Witkastle",
    description: "Ancient battleground where honor meets treachery",
    backgroundVideo: "/videos/castle_grounds_arena.mp4",
    staticImage: "/images/castle_grounds_arena.png"
  };

  // Enemy Configurations
  const enemies = {
    1: {
      name: "Zimrek",
      title: "Professional Assassin",
      description: "Discreet, lethal, not noble-born but trusted for dirty work",
      weapon: "Blunderbuss",
      weaponVideo: "/videos/blunderbuss_fire.mp4",
      characterVideo: "/videos/zimrek.mp4",
      staticImage: "/images/zimrek.png",
      hp: 3
    },
    2: {
      name: "Lord Jeroboam",
      title: "Elite Conspirator",
      description: "Wealthy, calculated antagonist — educated, dangerous and elite",
      weapon: "Flintlock Pistol",
      weaponVideo: "/videos/flintlock_fire.mp4",
      characterVideo: "/videos/lord_jeroboam.mp4",
      staticImage: "/images/lord_jeroboam.png",
      hp: 3
    },
    3: {
      name: "Nebchud Baddon",
      title: "Corrupted Ruler",
      description: "Intimidating, mythical — a corrupted ruler, not a common brute",
      weapon: "Gilded Sceptre",
      weaponVideo: "/videos/gilded_sceptre_strike.mp4",
      characterVideo: "/videos/nebchud_baddon.mp4",
      staticImage: "/images/nebchud_baddon.png",
      hp: 3
    }
  };

  // ============ HELPER FUNCTIONS ============

  // Get fighter image URL based on rarity and clan
  const getFighterImageUrl = (rarity, clan) => {
    const rarityName = RARITY_NAMES[rarity]?.toLowerCase() || 'bronze';
    const clanName = CLAN_NAMES[clan]?.toLowerCase() || 'witkastle';
    return `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.jpg`;
  };

  // Get fighter display name
  const getFighterDisplayName = (rarity, clan, tokenId) => {
    const rarityName = RARITY_NAMES[rarity] || 'Bronze';
    const clanFighter = CLAN_FIGHTERS[clan] || { name: 'Fighter' };
    return `${rarityName} ${clanFighter.name}`;
  };

  // Get fighter weapon name
  const getFighterWeapon = (clan) => {
    return CLAN_FIGHTERS[clan]?.weapon || 'Sword';
  };

  // ============ USEEFFECT ============
  
  useEffect(() => {
    if (connected && walletAddress && provider) {
      loadUserData();
    }
  }, [connected, walletAddress, provider]);

  // ============ BLOCKCHAIN FUNCTIONS ============
  
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const signer = await provider.getSigner();
      const fighterContract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      const gameBalanceContract = new ethers.Contract(GAME_BALANCE_V4_ADDRESS, GAME_BALANCE_V4_ABI, signer);
      const heraldStakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, signer);

      // Get staked fighters
      const stakedFighters = await fighterContract.getUserStakedFighters(walletAddress);
      
      const fightersData = await Promise.all(
        stakedFighters.map(async (tokenId) => {
          try {
            // Use getFighterStats for complete data
            const stats = await fighterContract.getFighterStats(tokenId);
            return {
              tokenId: tokenId.toString(),
              rarity: Number(stats.rarity),
              clan: Number(stats.clan),
              energy: Number(stats.energy),
              wins: Number(stats.wins),
              losses: Number(stats.losses),
              isStaked: stats.isStaked,
              inBattle: stats.inBattle,
              isRefueling: stats.isRefueling
            };
          } catch (err) {
            // Fallback to basic fighters() call
            const fighterData = await fighterContract.fighters(tokenId);
            return {
              tokenId: tokenId.toString(),
              rarity: Number(fighterData.rarity),
              clan: Number(fighterData.clan),
              energy: Number(fighterData.energy),
              wins: Number(fighterData.wins),
              losses: Number(fighterData.losses),
              isStaked: fighterData.isStaked,
              inBattle: fighterData.inBattle,
              isRefueling: Number(fighterData.refuelStartTime) > 0
            };
          }
        })
      );

      setUserFighters(fightersData);

      // Get FOOD balance from GameBalance
      const foodBal = await gameBalanceContract.getBalance(walletAddress, TOKEN_IDS.FOOD);
      setFoodBalance(ethers.formatEther(foodBal));

      // Check for staked heralds
      const stakedHeralds = await heraldStakingContract.getUserStakedHeralds(walletAddress);
      setHasStakedHerald(stakedHeralds.length > 0);

      setLoading(false);
      setGameState('arena-intro');
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const selectFighterForBattle = (fighterData) => {
    setSelectedFighter(fighterData);
    
    const fighterName = getFighterDisplayName(fighterData.rarity, fighterData.clan, fighterData.tokenId);
    const fighterWeapon = getFighterWeapon(fighterData.clan);
    const fighterImage = getFighterImageUrl(fighterData.rarity, fighterData.clan);
    
    setFighter({
      name: fighterName,
      fullName: `${fighterName} #${fighterData.tokenId}`,
      clan: CLAN_NAMES[fighterData.clan],
      rarity: RARITY_NAMES[fighterData.rarity],
      rarityId: fighterData.rarity,
      clanId: fighterData.clan,
      weapon: fighterWeapon,
      weaponVideo: `/videos/${fighterWeapon.toLowerCase().replace(/[^a-z]/g, '_')}.mp4`,
      characterVideo: null, // Use static image instead
      staticImage: fighterImage,
      hp: 3,
      tokenId: fighterData.tokenId
    });
    
    setGameState('enemy-select');
  };

  const selectEnemy = async (enemyNum) => {
    if (enemiesDefeated.includes(enemyNum)) return;
    
    const isAvailable = enemyNum === 1 || enemiesDefeated.includes(enemyNum - 1);
    if (!isAvailable) return;
    
    setCurrentEnemy(enemyNum);
    setEnemyHP(3);
    setFighterHP(3);
    setGameState('pre-battle');
  };

  const enterArena = async (enemyNum) => {
    if (!selectedFighter) {
      setError('No Fighter selected');
      return;
    }

    try {
      setTxPending(true);
      setError(null);

      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);

      console.log('Entering arena:', {
        fighterId: selectedFighter.tokenId,
        arenaId: ARENA_ID,
        enemyNum: enemyNum,
        fighterContract: FIGHTER_V4_ADDRESS,
        battleContract: BATTLE_ADDRESS
      });
      
      const tx = await battleContract.enterArena(selectedFighter.tokenId, ARENA_ID, enemyNum);
      
      addLog('⏳ Entering arena...');
      await tx.wait();
      
      addLog('✅ Entered arena! Battle begins!');
      
      setCurrentEnemy(enemyNum);
      setActiveBattleId(selectedFighter.tokenId);
      setEnemyHP(3);
      setFighterHP(3);
      setGameState('fighting');
      setCurrentTurn('player');
      setRound(1);
      setBattleLog([]);
      setTxPending(false);
      
      // Initialize battle boosts for first enemy
      if (enemyNum === 1 && activeBoosts.length === 0) {
        setActiveBoosts([
          { id: 'konfisof_minor', name: 'Battle Boost (+15%)', emoji: '🎯', clan: 'Konfisof', effect: '+15% hit', animation: '/animations/battle_boost_minor.gif' },
          { id: 'konfisof_major', name: 'Battle Boost (+40%)', emoji: '🎯', clan: 'Konfisof', effect: '+40% hit', animation: '/animations/battle_boost_major.gif' },
          { id: 'bervation_prayer', name: 'Holy Prayer', emoji: '🙏', clan: 'Bervation', effect: 'Restore 1 HP', animation: '/animations/holy_prayer.gif' },
          { id: 'witkastle_morale', name: 'Morale Boost', emoji: '💪', clan: 'Witkastle', effect: '+10% hit, -10% enemy', animation: '/animations/morale_boost.gif' },
          { id: 'smizfume_poison', name: 'Poison Potion', emoji: '🧪', clan: 'Smizfume', effect: 'Enemy -20% (2 attacks)', animation: '/animations/poison_potion.gif' },
          { id: 'coalheart_freeze', name: 'Freeze', emoji: '❄️', clan: 'Coalheart', effect: 'Enemy skips turn', animation: '/animations/freeze.gif' },
          { id: 'warmdice_treasure', name: 'Treasure Chest', emoji: '💰', clan: 'Warmdice', effect: 'Random reward', animation: '/animations/treasure_chest.gif' },
          { id: 'bowkin_trap', name: 'Trap', emoji: '🪤', clan: 'Bowkin', effect: 'Enemy -1 HP', animation: '/animations/trap.gif' }
        ]);
      }
      
    } catch (err) {
      console.error('Error entering arena:', err);
      
      // Parse specific error messages
      let errorMessage = err.message || 'Failed to enter arena';
      if (err.reason) {
        errorMessage = err.reason;
      }
      if (errorMessage.includes('Cannot enter battle')) {
        errorMessage = 'Cannot enter battle. Make sure:\n• Fighter is staked\n• Fighter has enough energy (20+)\n• Fighter is not already in battle\n• You have enough FOOD for entry fee';
      }
      
      setError(errorMessage);
      setTxPending(false);
    }
  };

  const enemyDefeated = () => {
    const enemy = enemies[currentEnemy];
    setGameState('claiming-victory');
    addLog(`${enemy.name} has been defeated!`);
    claimVictoryOnChain();
  };

  const claimVictoryOnChain = async () => {
    try {
      setTxPending(true);
      setError(null);

      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);

      addLog('⏳ Claiming victory...');
      
      const tx = await battleContract.claimVictory(selectedFighter.tokenId, currentEnemy);
      const receipt = await tx.wait();
      
      // Parse rewards from events
      const rewards = {};
      receipt.logs.forEach(log => {
        try {
          const parsed = battleContract.interface.parseLog(log);
          if (parsed.name === 'RewardDistributed') {
            const tokenId = Number(parsed.args.tokenId);
            const amount = ethers.formatEther(parsed.args.amount);
            
            const tokenNames = { 1: 'FOOD', 2: 'GOLD', 3: 'WOOD', 4: 'RKT' };
            const tokenName = tokenNames[tokenId];
            
            if (tokenName) {
              rewards[tokenName] = parseFloat(amount).toFixed(2);
            }
          }
        } catch (e) {}
      });

      setEarnedRewards(rewards);
      addLog('✅ Victory claimed! Rewards distributed!');
      
      setEnemiesDefeated(prev => [...prev, currentEnemy]);
      setActiveBattleId(null);
      setGameState('victory');
      setTxPending(false);
      
      await loadUserData();
      
    } catch (err) {
      console.error('Error claiming victory:', err);
      setError(err.message || 'Failed to claim victory');
      setTxPending(false);
    }
  };

  const playerDefeated = () => {
    setGameState('claiming-defeat');
    addLog(`${fighter.name} has fallen...`);
    claimDefeatOnChain();
  };

  const claimDefeatOnChain = async () => {
    try {
      setTxPending(true);
      setError(null);

      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);

      addLog('⏳ Recording defeat...');
      
      const tx = await battleContract.claimDefeat(selectedFighter.tokenId);
      await tx.wait();
      
      addLog('Defeat recorded');
      
      setActiveBattleId(null);
      setGameState('defeat');
      setTxPending(false);
      
      await loadUserData();
      
    } catch (err) {
      console.error('Error claiming defeat:', err);
      setError(err.message || 'Failed to record defeat');
      setTxPending(false);
    }
  };

  // ============ GAME FUNCTIONS ============
  
  const calculateFighterAccuracy = (fighterRarity, enemyNum) => {
    const rarityName = typeof fighterRarity === 'string' ? fighterRarity : RARITY_NAMES[fighterRarity];
    const hitChances = {
      Bronze: [20, 10, 3],
      Silver: [30, 20, 10],
      Gold: [40, 30, 20]
    };
    return hitChances[rarityName]?.[enemyNum - 1] || 20;
  };
  
  const calculateEnemyAccuracy = (enemyNum, fighterRarity) => {
    const rarityName = typeof fighterRarity === 'string' ? fighterRarity : RARITY_NAMES[fighterRarity];
    const hitChances = {
      1: { Gold: 70, Silver: 75, Bronze: 85 },
      2: { Gold: 72, Silver: 80, Bronze: 90 },
      3: { Gold: 75, Silver: 85, Bronze: 95 }
    };
    return hitChances[enemyNum]?.[rarityName] || 85;
  };

  const useBoost = (boostId) => {
    const boost = activeBoosts.find(b => b.id === boostId);
    if (!boost) return;
    
    switch(boostId) {
      case 'konfisof_minor':
        addLog('🎯 Battle Boost (+15%): Fighter accuracy increased!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.map(b => 
          b.id === boostId ? {...b, usedThisBattle: true} : b
        ));
        break;
        
      case 'konfisof_major':
        addLog('🎯 Battle Boost (+40%): Fighter accuracy greatly increased!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.map(b => 
          b.id === boostId ? {...b, usedThisBattle: true} : b
        ));
        break;
        
      case 'bervation_prayer':
        setFighterHP(hp => Math.min(hp + 1, 3));
        addLog('🙏 Holy Prayer: Restored 1 HP!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.filter(b => b.id !== boostId));
        break;
        
      case 'witkastle_morale':
        addLog('💪 Morale Boost: Team morale increased!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.map(b => 
          b.id === boostId ? {...b, usedThisBattle: true} : b
        ));
        break;
        
      case 'smizfume_poison':
        setPoisonedAttacksRemaining(2);
        addLog('🧪 Poison Potion: Enemy weakened for 2 attacks!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.filter(b => b.id !== boostId));
        break;
        
      case 'coalheart_freeze':
        setEnemyFrozen(true);
        addLog('❄️ Freeze: Enemy will skip next attack!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.filter(b => b.id !== boostId));
        break;
        
      case 'warmdice_treasure':
        const goldAmount = Math.floor(Math.random() * 8) + 10;
        const woodAmount = Math.floor(Math.random() * 6) + 5;
        
        setOutcomeText(`💰 TREASURE!\n${goldAmount} GOLD + ${woodAmount} WOOD`);
        addLog(`💰 Treasure Chest: Found ${goldAmount} GOLD + ${woodAmount} WOOD!`);
        
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => {
            setWeaponAnimation(null);
            setOutcomeText('');
          }, 3000);
        } else {
          setTimeout(() => setOutcomeText(''), 3000);
        }
        
        setActiveBoosts(boosts => boosts.filter(b => b.id !== boostId));
        break;
        
      case 'bowkin_trap':
        setEnemyHP(hp => Math.max(hp - 1, 0));
        addLog('🪤 Trap: Enemy stepped in trap! Lost 1 HP!');
        if (boost.animation) {
          setWeaponAnimation(boost.animation);
          setTimeout(() => setWeaponAnimation(null), 2000);
        }
        setActiveBoosts(boosts => boosts.filter(b => b.id !== boostId));
        break;
    }
  };

  const addLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 8));
  };

  const playerAttack = () => {
    if (isAnimating || gameState !== 'fighting' || currentTurn !== 'player') return;
    
    setIsAnimating(true);
    setOutcomeText('');
    
    let accuracy = calculateFighterAccuracy(fighter.rarity, currentEnemy);
    
    const usedBoosts = activeBoosts.filter(b => b.usedThisBattle);
    if (usedBoosts.some(b => b.id === 'konfisof_minor')) accuracy += 15;
    if (usedBoosts.some(b => b.id === 'konfisof_major')) accuracy += 40;
    if (usedBoosts.some(b => b.id === 'witkastle_morale')) accuracy += 10;
    
    // Home arena bonus (+4% if fighter clan matches arena clan)
    if (fighter.clanId === 5) { // Witkastle arena
      accuracy += 4;
      addLog(`🏠 Home Arena Bonus: +4% accuracy!`);
    }
    
    setWeaponAnimation(fighter.weaponVideo);
    
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= accuracy;
    
    setTimeout(() => {
      setWeaponAnimation(null);
      
      if (didHit) {
        setOutcomeText('FIGHTER HITS!');
        const newHP = enemyHP - 1;
        setEnemyHP(newHP);
        addLog(`${fighter.name} strikes with ${fighter.weapon}! Hit! (${newHP} HP remaining)`);
        
        if (newHP <= 0) {
          setTimeout(() => enemyDefeated(), 2000);
        } else {
          setTimeout(() => {
            setCurrentTurn('enemy');
            setOutcomeText('');
            
            if (enemyFrozen) {
              setEnemyFrozen(false);
              setRound(r => r + 1);
              setCurrentTurn('player');
              addLog('❄️ Enemy is frozen! Skips attack!');
            } else {
              enemyAttack();
            }
          }, 2000);
        }
      } else {
        setOutcomeText('FIGHTER MISSES!');
        addLog(`${fighter.name} swings ${fighter.weapon}... MISS!`);
        
        setTimeout(() => {
          setCurrentTurn('enemy');
          setOutcomeText('');
          
          if (enemyFrozen) {
            setEnemyFrozen(false);
            setRound(r => r + 1);
            setCurrentTurn('player');
            addLog('❄️ Enemy is frozen! Skips attack!');
          } else {
            enemyAttack();
          }
        }, 2000);
      }
      
      setIsAnimating(false);
    }, 2000);
  };

  const enemyAttack = () => {
    setIsAnimating(true);
    
    const enemy = enemies[currentEnemy];
    let accuracy = calculateEnemyAccuracy(currentEnemy, fighter.rarity);
    
    const usedBoosts = activeBoosts.filter(b => b.usedThisBattle);
    if (usedBoosts.some(b => b.id === 'witkastle_morale')) accuracy -= 10;
    
    if (poisonedAttacksRemaining > 0) {
      accuracy -= 20;
      setPoisonedAttacksRemaining(p => p - 1);
      addLog(`🧪 Enemy is poisoned! (${poisonedAttacksRemaining - 1} remaining)`);
    }
    
    setWeaponAnimation(enemy.weaponVideo);
    
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= accuracy;
    
    setTimeout(() => {
      setWeaponAnimation(null);
      
      if (didHit) {
        setOutcomeText('ENEMY HITS!');
        const newHP = fighterHP - 1;
        setFighterHP(newHP);
        addLog(`${enemy.name} attacks with ${enemy.weapon}! Hit! (${newHP} HP remaining)`);
        
        if (newHP <= 0) {
          setTimeout(() => playerDefeated(), 2000);
        } else {
          setTimeout(() => {
            setRound(r => r + 1);
            setCurrentTurn('player');
            setOutcomeText('');
            addLog(`Round ${round + 1} begins!`);
          }, 2000);
        }
      } else {
        setOutcomeText('ENEMY MISSES!');
        addLog(`${enemy.name} fires ${enemy.weapon}... MISS!`);
        
        setTimeout(() => {
          setRound(r => r + 1);
          setCurrentTurn('player');
          setOutcomeText('');
          addLog(`Round ${round + 1} begins!`);
        }, 2000);
      }
      
      setIsAnimating(false);
    }, 2000);
  };

  const continueToNextEnemy = () => {
    setActiveBoosts(boosts => boosts.filter(b => {
      if (b.usedThisBattle && 
          (b.id === 'konfisof_minor' || 
           b.id === 'konfisof_major' || 
           b.id === 'witkastle_morale')) {
        return false;
      }
      return true;
    }).map(b => ({...b, usedThisBattle: false})));
    
    setCurrentEnemy(null);
    setSelectedFighter(null);
    setFighter(null);
    setGameState('arena-intro');
    setBattleLog([]);
    loadUserData();
  };

  const exitArena = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  // ============ RENDER ============

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Battle Arena</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to enter the arena</p>
      </div>
    );
  }

  if (loading || gameState === 'loading') {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Loader className="w-16 h-16 text-red-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-4">Loading Battle Data...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
          <p className="text-red-400 whitespace-pre-line">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-sm text-red-300 underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Transaction Pending Overlay */}
      {txPending && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <Loader className="w-16 h-16 text-red-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold mb-2">Transaction Pending</h3>
            <p className="text-gray-400">Please confirm in your wallet...</p>
          </div>
        </div>
      )}

      {/* Arena Intro */}
      {gameState === 'arena-intro' && (
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2">{arena.name}</h1>
            <p className="text-xl text-gray-400 mb-1">{arena.clan} Clan Territory</p>
            <p className="text-gray-500">{arena.description}</p>
            
            <div className="mt-6 flex justify-center gap-6 text-sm">
              <div>
                <span className="text-gray-400">Staked Fighters: </span>
                <span className="font-bold text-white">{userFighters.length}</span>
              </div>
              <div>
                <span className="text-gray-400">FOOD Balance: </span>
                <span className="font-bold text-yellow-400">{parseFloat(foodBalance).toFixed(0)} 🍖</span>
              </div>
              <div>
                <span className="text-gray-400">Herald Staked: </span>
                <span className={`font-bold ${hasStakedHerald ? 'text-green-400' : 'text-red-400'}`}>
                  {hasStakedHerald ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden mb-8">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster={arena.staticImage}
            >
              <source src={arena.backgroundVideo} type="video/mp4" />
              <img src={arena.staticImage} alt={arena.name} className="w-full h-full object-cover" />
            </video>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Three Enemies Await</h2>
              {userFighters.length > 0 ? (
                <button
                  onClick={() => setGameState('fighter-select')}
                  className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-xl transition"
                >
                  Select Fighter (50 FOOD Entry)
                </button>
              ) : (
                <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-400 font-bold mb-2">⚠️ No Fighters Available</p>
                  <p className="text-sm text-gray-400">Stake a Fighter to enter battle</p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={exitArena}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Fighter Selection */}
      {gameState === 'fighter-select' && (
        <div>
          <h2 className="text-4xl font-bold mb-8 text-center">Choose Your Fighter</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {userFighters.map(f => {
              const rarityColors = { 0: '#CD7F32', 1: '#C0C0C0', 2: '#FFD700' };
              const canFight = f.energy >= 20 && !f.inBattle && !f.isRefueling;
              const fighterImage = getFighterImageUrl(f.rarity, f.clan);
              const fighterName = getFighterDisplayName(f.rarity, f.clan, f.tokenId);
              
              return (
                <div
                  key={f.tokenId}
                  className={`bg-gray-800/50 border-2 rounded-lg p-6 transition ${
                    canFight ? 'cursor-pointer hover:border-red-600' : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{ borderColor: canFight ? rarityColors[f.rarity] : '#1f2937' }}
                  onClick={() => canFight && selectFighterForBattle(f)}
                >
                  {/* Fighter Image */}
                  <div className="w-full h-48 bg-gray-900 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={fighterImage} 
                      alt={fighterName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/fighter_placeholder.png';
                      }}
                    />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">{fighterName}</h3>
                  <p className="text-sm text-gray-400 mb-2">#{f.tokenId} • {CLAN_NAMES[f.clan]}</p>
                  <p className="text-sm mb-2" style={{ color: rarityColors[f.rarity] }}>
                    {RARITY_NAMES[f.rarity]}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-400">Energy: </span>
                      <span className="font-bold">{f.energy}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Record: </span>
                      <span className="font-bold">{f.wins}W - {f.losses}L</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Weapon: </span>
                      <span className="font-bold">{getFighterWeapon(f.clan)}</span>
                    </div>
                  </div>
                  
                  {canFight ? (
                    <button className="w-full mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition">
                      Select Fighter
                    </button>
                  ) : (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      {f.inBattle ? 'In Battle' : f.energy < 20 ? 'Low Energy' : 'Refueling'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <button 
              onClick={() => setGameState('arena-intro')} 
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Enemy Selection */}
      {gameState === 'enemy-select' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">Choose Your Opponent</h2>
            <p className="text-gray-400">{arena.name} • {enemiesDefeated.length}/3 Defeated</p>
            {fighter && (
              <p className="text-sm text-yellow-400 mt-2">
                Fighting with: {fighter.fullName} ({fighter.weapon})
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(enemyNum => {
              const enemy = enemies[enemyNum];
              const isDefeated = enemiesDefeated.includes(enemyNum);
              const isAvailable = enemyNum === 1 || enemiesDefeated.includes(enemyNum - 1);
              const isCurrent = enemyNum === (enemiesDefeated.length + 1);
              
              return (
                <div
                  key={enemyNum}
                  className={`bg-gray-800/50 border-2 rounded-lg p-6 transition ${
                    isDefeated
                      ? 'border-green-600 opacity-50'
                      : isAvailable
                      ? 'border-gray-700 hover:border-red-600 cursor-pointer'
                      : 'border-gray-800 opacity-30 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && !isDefeated && selectEnemy(enemyNum)}
                >
                  <div className="w-full h-64 bg-gray-900 rounded-lg mb-4 overflow-hidden">
                    {isCurrent && !isDefeated ? (
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        poster={enemy.staticImage}
                      >
                        <source src={enemy.characterVideo} type="video/mp4" />
                        <img src={enemy.staticImage} alt={enemy.name} className="w-full h-full object-cover" />
                      </video>
                    ) : (
                      <img src={enemy.staticImage} alt={enemy.name} className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-1">{enemy.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{enemy.title}</p>
                    <p className="text-xs text-gray-500 mb-4">{enemy.description}</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-red-400" />
                      <span className="text-sm">Weapon: {enemy.weapon}</span>
                    </div>

                    {isDefeated ? (
                      <div className="bg-green-900/30 border border-green-600 rounded px-4 py-2">
                        <Trophy className="w-5 h-5 inline mr-2 text-green-400" />
                        <span className="text-green-400 font-bold">DEFEATED</span>
                      </div>
                    ) : isAvailable ? (
                      <button className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition">
                        Fight {enemy.name}
                      </button>
                    ) : (
                      <div className="bg-gray-900/50 border border-gray-700 rounded px-4 py-2">
                        <span className="text-gray-500 font-bold">LOCKED</span>
                        <p className="text-xs text-gray-600 mt-1">Defeat Enemy #{enemyNum - 1} first</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={exitArena}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Exit Arena
            </button>
          </div>
        </div>
      )}

      {/* Pre-Battle Screen */}
      {gameState === 'pre-battle' && currentEnemy && fighter && (
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8">Prepare for Battle</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Fighter Card */}
            <div className="bg-blue-900/20 border-2 border-blue-600 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">{fighter.fullName}</h3>
              <div className="w-48 h-48 bg-gray-900 rounded-lg mx-auto mb-4 overflow-hidden">
                <img 
                  src={fighter.staticImage} 
                  alt={fighter.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = '/images/fighter_placeholder.png';
                  }}
                />
              </div>
              <p className="text-sm text-gray-400 mb-2">Clan: {fighter.clan}</p>
              <p className="text-sm text-gray-400 mb-2">Rarity: {fighter.rarity}</p>
              <p className="text-sm text-gray-400 mb-2">Weapon: {fighter.weapon}</p>
              <p className="text-sm text-yellow-400">
                Hit Chance: {calculateFighterAccuracy(fighter.rarity, currentEnemy)}%
                {fighter.clanId === 5 && <span className="text-green-400"> (+4% home bonus)</span>}
              </p>
            </div>

            {/* Enemy Card */}
            <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">{enemies[currentEnemy].name}</h3>
              <div className="w-48 h-48 bg-gray-900 rounded-lg mx-auto mb-4 overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                  poster={enemies[currentEnemy].staticImage}
                >
                  <source src={enemies[currentEnemy].characterVideo} type="video/mp4" />
                  <img src={enemies[currentEnemy].staticImage} alt={enemies[currentEnemy].name} className="w-full h-full object-cover rounded-lg" />
                </video>
              </div>
              <p className="text-sm text-gray-400 mb-2">{enemies[currentEnemy].title}</p>
              <p className="text-sm text-gray-400 mb-2">Weapon: {enemies[currentEnemy].weapon}</p>
              <p className="text-sm text-red-400">Hit Chance: {calculateEnemyAccuracy(currentEnemy, fighter.rarity)}%</p>
            </div>
          </div>

          <button 
            onClick={() => enterArena(currentEnemy)}
            disabled={txPending}
            className="bg-red-600 hover:bg-red-700 px-12 py-4 rounded-lg font-bold text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Swords className="w-6 h-6 inline mr-2" />
            {txPending ? 'Entering Arena...' : 'BEGIN BATTLE'}
          </button>
        </div>
      )}

      {/* Active Battle */}
      {gameState === 'fighting' && currentEnemy && fighter && (
        <div className="max-w-7xl mx-auto">
          {activeBoosts.length > 0 && (
            <div className="mb-4 p-3 bg-purple-900/20 border border-purple-600 rounded-lg">
              <p className="text-xs text-purple-400 mb-2 text-center font-bold">Battle Boosts (Click to Use):</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {activeBoosts.map(boost => {
                  const isUsed = boost.usedThisBattle;
                  
                  return (
                    <button
                      key={boost.id}
                      onClick={() => useBoost(boost.id)}
                      disabled={isUsed || isAnimating || currentTurn !== 'player'}
                      className={`px-3 py-2 rounded border text-xs transition ${
                        isUsed
                          ? 'bg-gray-900/50 border-gray-700 text-gray-600 cursor-not-allowed'
                          : currentTurn !== 'player'
                          ? 'bg-purple-900/30 border-purple-700 text-purple-400 cursor-wait'
                          : 'bg-purple-900/50 border-purple-500 text-purple-200 hover:bg-purple-800/70 cursor-pointer'
                      }`}
                      title={boost.effect}
                    >
                      <span className="text-lg">{boost.emoji}</span>
                      <span className="ml-1 font-bold">{boost.name}</span>
                      {isUsed && <span className="ml-1 text-green-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold text-gray-400">{arena.name} - Round {round}</h2>
            </div>

            <div className="grid grid-cols-7 gap-3 items-center">
              {/* Fighter Side */}
              <div className="col-span-2 text-center">
                <h3 className="text-lg font-bold mb-1">{fighter.name}</h3>
                <p className="text-xs text-gray-400 mb-2">#{fighter.tokenId}</p>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(3)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${i < fighterHP ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-yellow-400">Hit: </span>
                  <span className="font-bold text-yellow-400">
                    {(() => {
                      let acc = calculateFighterAccuracy(fighter.rarity, currentEnemy);
                      const usedBoosts = activeBoosts.filter(b => b.usedThisBattle);
                      if (usedBoosts.some(b => b.id === 'konfisof_minor')) acc += 15;
                      if (usedBoosts.some(b => b.id === 'konfisof_major')) acc += 40;
                      if (usedBoosts.some(b => b.id === 'witkastle_morale')) acc += 10;
                      if (fighter.clanId === 5) acc += 4; // Home arena bonus
                      return acc;
                    })()}%
                  </span>
                </div>
                <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
                  <img 
                    src={fighter.staticImage} 
                    alt={fighter.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/fighter_placeholder.png';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{fighter.weapon}</p>
              </div>

              {/* Center Battle Area */}
              <div className="col-span-3 flex flex-col justify-center items-center">
                {weaponAnimation ? (
                  <div className="w-full h-32 bg-black rounded-lg overflow-hidden mb-2">
                    {weaponAnimation.endsWith('.gif') ? (
                      <img 
                        src={weaponAnimation} 
                        alt="Boost animation" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      >
                        <source src={weaponAnimation} type="video/mp4" />
                      </video>
                    )}
                  </div>
                ) : outcomeText ? (
                  <div className={`text-2xl font-bold mb-2 p-3 rounded-lg whitespace-pre-line ${
                    outcomeText.includes('FIGHTER') 
                      ? outcomeText.includes('HITS') ? 'bg-green-900/50 text-green-400' : 'bg-gray-900/50 text-gray-400'
                      : outcomeText.includes('TREASURE') 
                      ? 'bg-yellow-900/50 text-yellow-400'
                      : outcomeText.includes('HITS') ? 'bg-red-900/50 text-red-400' : 'bg-gray-900/50 text-gray-400'
                  }`}>
                    {outcomeText}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center">
                    <Swords className="w-12 h-12 text-gray-600" />
                  </div>
                )}

                {currentTurn === 'player' && !isAnimating && (
                  <button
                    onClick={playerAttack}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold transition w-full"
                  >
                    <Swords className="w-5 h-5 inline mr-2" />
                    ATTACK with {fighter.weapon}
                  </button>
                )}

                {currentTurn === 'enemy' && !isAnimating && (
                  <div className="text-center py-2 px-4 bg-red-900/50 rounded-lg w-full">
                    <p className="text-red-400 font-bold">Enemy's Turn...</p>
                  </div>
                )}

                {isAnimating && (
                  <div className="text-center py-2 w-full">
                    <div className="animate-spin w-6 h-6 border-4 border-gray-600 border-t-red-500 rounded-full mx-auto"></div>
                  </div>
                )}
              </div>

              {/* Enemy Side */}
              <div className="col-span-2 text-center">
                <h3 className="text-lg font-bold mb-2">{enemies[currentEnemy].name}</h3>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(3)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${i < enemyHP ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-red-400">Hit: </span>
                  <span className="font-bold text-red-400">
                    {(() => {
                      let acc = calculateEnemyAccuracy(currentEnemy, fighter.rarity);
                      const usedBoosts = activeBoosts.filter(b => b.usedThisBattle);
                      if (usedBoosts.some(b => b.id === 'witkastle_morale')) acc -= 10;
                      if (poisonedAttacksRemaining > 0) acc -= 20;
                      return acc;
                    })()}%
                  </span>
                  {poisonedAttacksRemaining > 0 && (
                    <span className="text-xs text-purple-400 ml-1">🧪</span>
                  )}
                </div>
                <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster={enemies[currentEnemy].staticImage}
                  >
                    <source src={enemies[currentEnemy].characterVideo} type="video/mp4" />
                    <img src={enemies[currentEnemy].staticImage} alt={enemies[currentEnemy].name} className="w-full h-full object-cover" />
                  </video>
                </div>
                <p className="text-xs text-gray-500 mt-1">{enemies[currentEnemy].weapon}</p>
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <h3 className="text-sm font-bold mb-2 text-gray-400">Battle Log:</h3>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {battleLog.slice(0, 5).map((log, idx) => (
                <p key={idx} className="text-xs text-gray-400">{log}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'victory' && currentEnemy && earnedRewards && (
        <div className="text-center">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-5xl font-bold mb-4 text-yellow-400">VICTORY!</h2>
          <p className="text-2xl mb-8">{enemies[currentEnemy].name} has been defeated!</p>

          <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 max-w-md mx-auto mb-8">
            <h3 className="font-bold mb-4">Rewards Earned:</h3>
            <div className="space-y-2">
              {Object.entries(earnedRewards).map(([token, amount]) => (
                <p key={token} className="text-lg">
                  {token === 'FOOD' && '🍖'} 
                  {token === 'GOLD' && '🪙'} 
                  {token === 'WOOD' && '🪵'}
                  {token === 'RKT' && '👑'}
                  {' '}{amount} {token}
                </p>
              ))}
            </div>
          </div>

          {currentEnemy < 3 ? (
            <button
              onClick={continueToNextEnemy}
              className="bg-red-600 hover:bg-red-700 px-12 py-4 rounded-lg font-bold text-xl transition"
            >
              Fight Next Enemy
            </button>
          ) : (
            <div>
              <p className="text-xl text-green-400 mb-6">🏆 All enemies defeated! Arena conquered!</p>
              <button
                onClick={exitArena}
                className="bg-green-600 hover:bg-green-700 px-12 py-4 rounded-lg font-bold text-xl transition"
              >
                Claim Victory & Exit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Defeat Screen */}
      {gameState === 'defeat' && fighter && (
        <div className="text-center">
          <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h2 className="text-5xl font-bold mb-4 text-red-500">DEFEATED</h2>
          <p className="text-2xl mb-8">{fighter.fullName} has fallen in battle...</p>

          <button
            onClick={exitArena}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-bold transition"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* Claiming Victory/Defeat overlays */}
      {(gameState === 'claiming-victory' || gameState === 'claiming-defeat') && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <Loader className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold mb-2">
              {gameState === 'claiming-victory' ? 'Claiming Victory...' : 'Recording Result...'}
            </h3>
            <p className="text-gray-400">Please wait for blockchain confirmation...</p>
          </div>
        </div>
      )}
    </div>
  );
}