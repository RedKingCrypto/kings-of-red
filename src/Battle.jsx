import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Swords, Shield, Heart, Zap, Trophy, Skull, Clock, Volume2, VolumeX, Play, Target, Flame, Crown, ArrowLeft, Loader } from 'lucide-react';
import { 
  BATTLE_ADDRESS, 
  FIGHTER_ADDRESS, 
  HERALD_ADDRESS,
  HERALD_STAKING_ADDRESS,
  GAMEBALANCE_ADDRESS,
  CLAN_NAMES
} from './contractConfig';

// ==================== CONTRACT ABIs ====================

// Fighter ABI - CORRECT struct order: rarity, clan, energy, refuelStartTime, wins, losses, pvpWins, pvpLosses, isStaked, inBattle
// When a fighter is staked, the NFT is owned by the Fighter contract. Enter battle via Fighter contract so msg.sender at Battle is the Fighter (authorized).
const FIGHTER_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function fighters(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint64 energy, uint64 refuelStartTime, uint32 wins, uint32 losses, uint32 pvpWins, uint32 pvpLosses, bool isStaked, bool inBattle)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function enterBattle(uint256 fighterId, uint8 arenaId, uint8 enemyId)",
  "function enterArena(uint256 fighterId, uint8 arenaId, uint8 enemyId)"
];

// Herald Contract ABI - to check rarity
const HERALD_ABI = [
  "function getHerald(uint256 tokenId) view returns (uint8 rarity, uint8 clan)"
];

// Herald Staking ABI - includes getStakeInfo for rarity check
const HERALD_STAKING_ABI = [
  "function hasClanStaked(address user, uint8 clan) view returns (bool)",
  "function getUserStakedHeralds(address user) view returns (uint256[])",
  "function getStakeInfo(uint256 tokenId) view returns (address owner, uint256 stakedAt, uint256 lastClaim, uint8 clan, uint8 rarity, bool canClaim)"
];

// GameBalance ABI
const GAMEBALANCE_ABI = [
  "function getAllBalances(address user) view returns (uint256 food, uint256 gold, uint256 wood, uint256 rkt)",
  "function getBalances(address user) view returns (uint256[] memory)",
  "function getBalance(address user, uint8 tokenId) view returns (uint256)",
  "function inGameBalances(address user, uint8 tokenId) view returns (uint256)"
];

// Battle ABI (include common custom errors so we can decode revert reasons)
const BATTLE_ABI = [
  "function enterArena(uint256 fighterId, uint8 arenaId, uint8 enemyId)",
  "function attack(uint256 fighterId)",
  "function claimVictory(uint256 fighterId, uint8 enemyNum)",
  "function claimDefeat(uint256 fighterId)",
  "function getBattleState(uint256 fighterId) view returns (bool inBattle, uint8 arenaId, uint8 currentEnemy, uint8 enemyHealth, uint8 fighterHealth, uint256 battleStartTime)",
  "function canClaimVictory(uint256 fighterId) view returns (bool)",
  "function canClaimDefeat(uint256 fighterId) view returns (bool)",
  "function entryFee() view returns (uint256)",
  "event AttackPerformed(uint256 indexed fighterId, bool fighterHit, bool enemyHit, uint8 fighterDamage, uint8 enemyDamage)",
  "event RewardDistributed(address indexed player, uint256 tokenId, uint256 amount)",
  "error NotAuthorized()",
  "error NotStaked()",
  "error AlreadyInBattle()",
  "error InsufficientBalance()",
  "error InsufficientAllowance()",
  "error InsufficientEnergy()",
  "error InvalidArena()",
  "error InvalidEnemy()"
];

// ==================== GAME CONSTANTS ====================

// Rarity names
const RARITY_NAMES = ['Bronze', 'Silver', 'Gold'];

// Fighter → Enemy Hit Chances (from documentation)
// fighterRarity: [enemy1, enemy2, enemy3]
const FIGHTER_HIT_CHANCES = {
  0: [20, 10, 3],   // Bronze: 20% vs E1, 10% vs E2, 3% vs E3
  1: [30, 20, 10],  // Silver: 30% vs E1, 20% vs E2, 10% vs E3
  2: [40, 30, 20]   // Gold: 40% vs E1, 30% vs E2, 20% vs E3
};

// Enemy → Fighter Hit Chances (from documentation)
// enemyNum: { fighterRarity: hitChance }
const ENEMY_HIT_CHANCES = {
  1: { 0: 85, 1: 75, 2: 70 },  // Enemy 1 vs Bronze: 85%, Silver: 75%, Gold: 70%
  2: { 0: 90, 1: 80, 2: 72 },  // Enemy 2 vs Bronze: 90%, Silver: 80%, Gold: 72%
  3: { 0: 95, 1: 85, 2: 75 }   // Enemy 3 vs Bronze: 95%, Silver: 85%, Gold: 75%
};

// Herald Rarity Bonus to Fighter Hit Chance
const HERALD_RARITY_BONUS = {
  0: 2,   // Bronze Herald: +2%
  1: 5,   // Silver Herald: +5%
  2: 10   // Gold Herald: +10%
};

// ==================== ARENA CONFIGURATION ====================
// All 7 clan arenas - only some are active for now

const ARENAS = [
  { id: 0, name: 'Smizfume Caverns', clan: 'Smizfume', clanId: 0, color: 'from-red-900 to-orange-800', active: false, video: '/videos/smizfume_arena.mp4', image: '/images/smizfume_arena.png' },
  { id: 1, name: 'Coalheart Mines', clan: 'Coalheart', clanId: 1, color: 'from-gray-800 to-slate-700', active: false, video: '/videos/coalheart_arena.mp4', image: '/images/coalheart_arena.png' },
  { id: 2, name: 'Warmdice Casino', clan: 'Warmdice', clanId: 2, color: 'from-purple-900 to-indigo-800', active: false, video: '/videos/warmdice_arena.mp4', image: '/images/warmdice_arena.png' },
  { id: 3, name: 'Bervation Depths', clan: 'Bervation', clanId: 3, color: 'from-blue-900 to-cyan-800', active: false, video: '/videos/bervation_arena.mp4', image: '/images/bervation_arena.png' },
  { id: 4, name: 'Konfisof Grove', clan: 'Konfisof', clanId: 4, color: 'from-green-900 to-emerald-800', active: false, video: '/videos/konfisof_arena.mp4', image: '/images/konfisof_arena.png' },
  { id: 5, name: 'The Castle Grounds', clan: 'Witkastle', clanId: 5, color: 'from-yellow-800 to-amber-700', active: true, video: '/videos/castle_grounds_arena.mp4', image: '/images/castle_grounds_arena.png' },
  { id: 6, name: 'Bowkin Hideout', clan: 'Bowkin', clanId: 6, color: 'from-rose-900 to-red-800', active: false, video: '/videos/bowkin_arena.mp4', image: '/images/bowkin_arena.png' }
];

// ==================== ENEMY CONFIGURATION ====================
// From documentation: Zimrek, Lord Jeroboam, Nebchud Baddon
// Each enemy has 3 HP (hearts)

const ENEMIES = {
  1: {
    name: 'Zimrek',
    title: 'Professional Assassin',
    description: 'Discreet, lethal, not noble-born but trusted for dirty work',
    weapon: 'Blunderbuss',
    hp: 3,
    weaponVideo: '/videos/blunderbuss_fire.mp4',
    characterVideo: '/videos/zimrek.mp4',
    staticImage: '/images/zimrek.png'
  },
  2: {
    name: 'Lord Jeroboam',
    title: 'Elite Conspirator',
    description: 'Wealthy, calculated antagonist — educated, dangerous and elite',
    weapon: 'Flintlock Pistol',
    hp: 3,
    weaponVideo: '/videos/flintlock_fire.mp4',
    characterVideo: '/videos/lord_jeroboam.mp4',
    staticImage: '/images/lord_jeroboam.png'
  },
  3: {
    name: 'Nebchud Baddon',
    title: 'Corrupted Ruler',
    description: 'Intimidating, mythical — a corrupted ruler, not a common brute',
    weapon: 'Gilded Sceptre',
    hp: 3,
    weaponVideo: '/videos/gilded_sceptre_strike.mp4',
    characterVideo: '/videos/nebchud_baddon.mp4',
    staticImage: '/images/nebchud_baddon.png'
  }
};

// ==================== BATTLE BOOSTS CONFIGURATION ====================

const ALL_BOOSTS = [
  { id: 'konfisof_minor', name: 'Battle Boost (+15%)', emoji: '🎯', clan: 'Konfisof', effect: '+15% Fighter hit chance', type: 'passive', animation: '/animations/battle_boost_minor.gif' },
  { id: 'konfisof_major', name: 'Battle Boost (+40%)', emoji: '🎯', clan: 'Konfisof', effect: '+40% Fighter hit chance', type: 'passive', animation: '/animations/battle_boost_major.gif' },
  { id: 'bervation_prayer', name: 'Holy Prayer', emoji: '🙏', clan: 'Bervation', effect: 'Restore 1 HP', type: 'active', animation: '/animations/holy_prayer.gif' },
  { id: 'witkastle_morale', name: 'Morale Boost', emoji: '💪', clan: 'Witkastle', effect: '+10% hit, -10% enemy hit', type: 'passive', animation: '/animations/morale_boost.gif' },
  { id: 'smizfume_poison', name: 'Poison Potion', emoji: '🧪', clan: 'Smizfume', effect: 'Enemy -20% hit (2 attacks)', type: 'active', animation: '/animations/poison_potion.gif' },
  { id: 'coalheart_freeze', name: 'Freeze', emoji: '❄️', clan: 'Coalheart', effect: 'Enemy skips next turn', type: 'active', animation: '/animations/freeze.gif' },
  { id: 'warmdice_treasure', name: 'Treasure Chest', emoji: '💰', clan: 'Warmdice', effect: 'Random bonus reward', type: 'instant', animation: '/animations/treasure_chest.gif' },
  { id: 'bowkin_trap', name: 'Trap', emoji: '🪤', clan: 'Bowkin', effect: 'Enemy loses 1 HP', type: 'active', animation: '/animations/trap.gif' }
];

// ==================== BATTLE MUSIC CONFIGURATION ====================

const BATTLE_MUSIC = {
  5: { // Witkastle arena
    1: '/audio/witkastle_enemy1.mp3',
    2: '/audio/witkastle_enemy2.mp3',
    3: '/audio/witkastle_enemy3.mp3'
  }
};

// ==================== MAIN COMPONENT ====================

export default function Battle({ connected, walletAddress, connectWallet, onNavigate }) {
  // ==================== STATE ====================
  
  // Fighter & Battle State
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [currentArena, setCurrentArena] = useState(null);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [enemiesDefeated, setEnemiesDefeated] = useState([]);
  
  // HP State (3 hearts each)
  const [fighterHP, setFighterHP] = useState(3);
  const [enemyHP, setEnemyHP] = useState(3);
  
  // Combat State
  const [currentTurn, setCurrentTurn] = useState('player');
  const [isAnimating, setIsAnimating] = useState(false);
  const [weaponAnimation, setWeaponAnimation] = useState(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [round, setRound] = useState(1);
  
  // Battle Boosts State
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [poisonedAttacksRemaining, setPoisonedAttacksRemaining] = useState(0);
  const [enemyFrozen, setEnemyFrozen] = useState(false);
  
  // Herald Bonus State
  const [heraldRarityBonus, setHeraldRarityBonus] = useState(0);
  const [hasClanHeraldStaked, setHasClanHeraldStaked] = useState(false);
  
  // Data State
  const [stakedFighters, setStakedFighters] = useState([]);
  const [userBalances, setUserBalances] = useState({ food: 0, gold: 0, wood: 0, rkt: 0 });
  const [battleLog, setBattleLog] = useState([]);
  const [earnedRewards, setEarnedRewards] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('select'); // 'select', 'pre-battle', 'fighting', 'victory', 'defeat', 'arena-complete'
  const [debugInfo, setDebugInfo] = useState('');
  
  // Music State
  const [isMuted, setIsMuted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  // ==================== MUSIC FUNCTIONS ====================

  const startBattleMusic = (arenaId, enemyNum) => {
    stopBattleMusic();
    const musicPath = BATTLE_MUSIC[arenaId]?.[enemyNum];
    if (!musicPath) return;
    
    try {
      const audio = new Audio(musicPath);
      audio.loop = true;
      audio.volume = 0.4;
      audio.muted = isMuted;
      audio.onerror = () => setMusicPlaying(false);
      audio.oncanplaythrough = () => {
        audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
      };
      audioRef.current = audio;
      audio.load();
    } catch (e) {
      console.log('Error initializing audio:', e.message);
    }
  };

  const stopBattleMusic = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }
    setMusicPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) audioRef.current.muted = newMuted;
      return newMuted;
    });
  };

  useEffect(() => {
    return () => stopBattleMusic();
  }, []);

  // ==================== DATA LOADING ====================

  useEffect(() => {
    if (connected && walletAddress) {
      loadUserData();
    }
  }, [connected, walletAddress]);

  const loadUserData = async () => {
    if (!window.ethereum || !walletAddress) return;
    
    setLoading(true);
    setDebugInfo('Loading battle data...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, provider);
      const gameBalanceContract = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_ABI, provider);
      
      console.log('Loading battle data for:', walletAddress);
      
      // ==================== LOAD STAKED FIGHTERS ====================
      const staked = [];
      
      try {
        const balance = await fighterContract.balanceOf(walletAddress);
        const fighterCount = Number(balance);
        console.log(`User owns ${fighterCount} fighters`);
        setDebugInfo(`Found ${fighterCount} fighters...`);
        
        for (let i = 0; i < fighterCount; i++) {
          try {
            const tokenId = await fighterContract.tokenOfOwnerByIndex(walletAddress, i);
            const fighterData = await fighterContract.fighters(tokenId);
            
            // CORRECT struct order: rarity, clan, energy, refuelStartTime, wins, losses, pvpWins, pvpLosses, isStaked, inBattle
            const rarity = Number(fighterData[0]);
            const clan = Number(fighterData[1]);
            const energy = Number(fighterData[2]);
            const refuelStartTime = Number(fighterData[3]);
            const wins = Number(fighterData[4]);
            const losses = Number(fighterData[5]);
            const pvpWins = Number(fighterData[6]);
            const pvpLosses = Number(fighterData[7]);
            const isStaked = Boolean(fighterData[8]);
            const inBattle = Boolean(fighterData[9]);
            
            if (isStaked) {
              staked.push({
                tokenId: tokenId.toString(),
                rarity,
                clan,
                energy,
                wins,
                losses,
                pvpWins,
                pvpLosses,
                isStaked,
                inBattle,
                refuelStartTime
              });
            }
          } catch (e) {
            console.log('Error loading fighter at index', i, e.message);
          }
        }
      } catch (e) {
        console.error('Error loading fighters:', e.message);
      }
      
      console.log(`Found ${staked.length} staked fighters`);
      setStakedFighters(staked);
      
      // ==================== LOAD GAME BALANCES ====================
      // Use getBalance per token first to avoid getAllBalances revert (e.g. "execution reverted") on some contracts
      try {
        let balances = null;
        try {
          const food = await gameBalanceContract.getBalance(walletAddress, 1);
          const gold = await gameBalanceContract.getBalance(walletAddress, 2);
          const wood = await gameBalanceContract.getBalance(walletAddress, 3);
          const rkt = await gameBalanceContract.getBalance(walletAddress, 4);
          balances = {
            food: Number(ethers.formatEther(food)),
            gold: Number(ethers.formatEther(gold)),
            wood: Number(ethers.formatEther(wood)),
            rkt: Number(ethers.formatEther(rkt))
          };
        } catch (e) {
          try {
            const result = await gameBalanceContract.getAllBalances(walletAddress);
            balances = {
              food: Number(ethers.formatEther(result[0] || result.food || 0)),
              gold: Number(ethers.formatEther(result[1] || result.gold || 0)),
              wood: Number(ethers.formatEther(result[2] || result.wood || 0)),
              rkt: Number(ethers.formatEther(result[3] || result.rkt || 0))
            };
          } catch (e2) {
            console.log('Balance load failed:', e2?.message || e?.message);
          }
        }
        if (balances) {
          setUserBalances(balances);
        }
      } catch (e) {
        console.log('Error loading balances:', e?.message);
      }
      
      setDebugInfo(`✅ ${staked.length} staked fighters ready for battle`);
      
    } catch (e) {
      console.error('Error loading user data:', e);
      setError('Failed to load data. Please refresh.');
      setDebugInfo(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HERALD CLAN CHECK WITH RARITY BONUS ====================

  const checkClanHeraldStaked = async (clanId) => {
    if (!window.ethereum || !walletAddress) return { hasHerald: false, rarityBonus: 0 };
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, provider);
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI, provider);
      
      // First check if clan Herald is staked
      const hasStaked = await stakingContract.hasClanStaked(walletAddress, clanId);
      
      if (!hasStaked) {
        setHasClanHeraldStaked(false);
        setHeraldRarityBonus(0);
        return { hasHerald: false, rarityBonus: 0 };
      }
      
      setHasClanHeraldStaked(true);
      
      // Get staked Heralds to find the one matching the clan and get its rarity
      let rarityBonus = 2; // Default to Bronze bonus
      
      try {
        const stakedHeralds = await stakingContract.getUserStakedHeralds(walletAddress);
        
        for (const tokenId of stakedHeralds) {
          try {
            const stakeInfo = await stakingContract.getStakeInfo(tokenId);
            const heraldClan = Number(stakeInfo[3]); // clan is at index 3
            const heraldRarity = Number(stakeInfo[4]); // rarity is at index 4
            
            if (heraldClan === clanId) {
              rarityBonus = HERALD_RARITY_BONUS[heraldRarity] || 2;
              console.log(`Found ${RARITY_NAMES[heraldRarity]} Herald of clan ${CLAN_NAMES[clanId]}, bonus: +${rarityBonus}%`);
              break;
            }
          } catch (e) {
            // If getStakeInfo fails, try getting rarity from Herald contract
            try {
              const heraldData = await heraldContract.getHerald(tokenId);
              const heraldRarity = Number(heraldData[0]);
              const heraldClan = Number(heraldData[1]);
              
              if (heraldClan === clanId) {
                rarityBonus = HERALD_RARITY_BONUS[heraldRarity] || 2;
                break;
              }
            } catch (e2) {
              console.log('Error getting herald data:', e2.message);
            }
          }
        }
      } catch (e) {
        console.log('Error getting staked heralds:', e.message);
      }
      
      setHeraldRarityBonus(rarityBonus);
      return { hasHerald: true, rarityBonus };
      
    } catch (e) {
      console.log('Error checking herald staking:', e.message);
      return { hasHerald: false, rarityBonus: 0 };
    }
  };

  // ==================== HIT CHANCE CALCULATIONS ====================

  const calculateFighterAccuracy = (fighterRarity, enemyNum) => {
    let baseAccuracy = FIGHTER_HIT_CHANCES[fighterRarity]?.[enemyNum - 1] || 10;
    
    // Add Herald rarity bonus
    baseAccuracy += heraldRarityBonus;
    
    // Add boost bonuses
    const usedBoosts = activeBoosts.filter(b => b.usedThisBattle);
    if (usedBoosts.some(b => b.id === 'konfisof_minor')) baseAccuracy += 15;
    if (usedBoosts.some(b => b.id === 'konfisof_major')) baseAccuracy += 40;
    if (usedBoosts.some(b => b.id === 'witkastle_morale')) baseAccuracy += 10;
    
    return Math.min(baseAccuracy, 95); // Cap at 95%
  };

  const calculateEnemyAccuracy = (enemyNum, fighterRarity) => {
    let baseAccuracy = ENEMY_HIT_CHANCES[enemyNum]?.[fighterRarity] || 80;
    
    // Apply boost debuffs
    const usedBoosts = activeBoosts.filter(b => b.usedThisBattle);
    if (usedBoosts.some(b => b.id === 'witkastle_morale')) baseAccuracy -= 10;
    
    // Apply poison debuff
    if (poisonedAttacksRemaining > 0) baseAccuracy -= 20;
    
    return Math.max(baseAccuracy, 5); // Minimum 5%
  };

  // ==================== FIGHTER SELECTION ====================

  const handleSelectFighter = async (fighter) => {
    setSelectedFighter(fighter);
    setError(null);
    
    // Check if fighter is already in battle (resume)
    if (fighter.inBattle) {
      addLog('Resuming existing battle...');
      // TODO: Load existing battle state from contract
      return;
    }
    
    // Check if matching clan Herald is staked and get rarity bonus
    const { hasHerald, rarityBonus } = await checkClanHeraldStaked(fighter.clan);
    
    if (!hasHerald) {
      setError(`You need a ${CLAN_NAMES[fighter.clan]} Herald staked to battle with this Fighter!`);
      return;
    }
    
    // Check energy
    if (fighter.energy < 20) {
      setError('Fighter needs at least 20 energy to enter battle. Refuel first!');
      return;
    }
    
    // Check FOOD balance
    if (userBalances.food < 50) {
      setError('You need at least 50 FOOD for the battle entry fee!');
      return;
    }
    
    addLog(`Selected ${RARITY_NAMES[fighter.rarity]} ${CLAN_NAMES[fighter.clan]} Fighter #${fighter.tokenId}`);
    addLog(`${RARITY_NAMES[rarityBonus === 10 ? 2 : rarityBonus === 5 ? 1 : 0]} Herald bonus: +${rarityBonus}% hit chance`);
    
    setView('pre-battle');
  };

  // ==================== BATTLE ENTRY ====================

  const enterBattle = async () => {
    if (!selectedFighter) {
      setError('No Fighter selected');
      return;
    }

    setTxPending(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, signer);

      // RANDOMIZE ARENA from active arenas
      const activeArenas = ARENAS.filter(a => a.active);
      const randomArena = activeArenas[Math.floor(Math.random() * activeArenas.length)];
      const arenaId = randomArena.id;
      const enemyId = 1;

      addLog(`⏳ Entering battle... (50 FOOD entry fee, -20 energy)`);

      // Staked fighters are owned by the Fighter contract. Battle.enterArena checks "authorized to use fighter"
      // (owner or approved). So we must call via the Fighter contract, which then calls Battle.enterArena;
      // that way msg.sender at Battle is the Fighter contract (the owner of the token).
      let tx;
      try {
        tx = await fighterContract.enterBattle(selectedFighter.tokenId, arenaId, enemyId);
      } catch (e1) {
        if (e1?.message?.includes('enterBattle') || e1?.code === 'CALL_EXCEPTION') {
          try {
            tx = await fighterContract.enterArena(selectedFighter.tokenId, arenaId, enemyId);
          } catch (e2) {
            throw e2?.reason ? new Error(e2.reason) : e2;
          }
        } else {
          throw e1?.reason ? new Error(e1.reason) : e1;
        }
      }
      await tx.wait();
      
      addLog(`✅ Entered ${randomArena.name}!`);
      addLog(`⚔️ Prepare to face Zimrek, the Professional Assassin!`);
      
      // Set battle state
      setCurrentArena(randomArena);
      setCurrentEnemy(1);
      setEnemiesDefeated([]);
      setFighterHP(3);
      setEnemyHP(3);
      setRound(1);
      setCurrentTurn('player');
      
      // Grant test boosts for first enemy (will be NFT-based later)
      setActiveBoosts(ALL_BOOSTS.map(b => ({ ...b, usedThisBattle: false })));
      
      // Start battle music
      startBattleMusic(randomArena.id, 1);
      
      setView('fighting');
      setTxPending(false);
      
    } catch (err) {
      console.error('Error entering battle:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction cancelled');
      } else {
        let userMsg = err?.reason || err?.message || 'Failed to enter battle';
        const s = typeof userMsg === 'string' ? userMsg : '';
        let data = err?.data ?? err?.error?.data ?? null;
        // When estimateGas fails, RPC often returns data=null. Try a read-only call to fetch revert data.
        if ((!data || data === '0x') && (s.includes('missing revert data') || s.includes('CALL_EXCEPTION')) && window.ethereum) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const activeArenas = ARENAS.filter(a => a.active);
            const randomArena = activeArenas[Math.floor(Math.random() * activeArenas.length)];
            const iface = new ethers.Interface(BATTLE_ABI);
            const calldata = iface.encodeFunctionData('enterArena', [selectedFighter.tokenId, randomArena.id, 1]);
            await provider.call({ to: BATTLE_ADDRESS, data: calldata });
          } catch (callErr) {
            data = callErr?.data ?? callErr?.error?.data ?? null;
            if (data && typeof data === 'string') console.log('Revert data from eth_call:', data);
          }
        }
        if (data && typeof data === 'string' && data.length >= 10) {
          try {
            const iface = new ethers.Interface(BATTLE_ABI);
            const decoded = iface.parseError(data);
            if (decoded) {
              const name = decoded.name || decoded.signature?.split('(')[0];
              console.log('Battle revert reason:', name, decoded.args);
              if (name === 'NotAuthorized') userMsg = 'Fighter not authorized for battle. The Battle contract must be approved for this Fighter (sign the approval tx if prompted).';
              else if (name === 'NotStaked') userMsg = 'Only staked Fighters can enter battle. This Fighter is not staked.';
              else if (name === 'AlreadyInBattle') userMsg = 'This Fighter is already in a battle. Finish or claim it first.';
              else if (name === 'InsufficientBalance' || name === 'InsufficientAllowance') userMsg = 'Insufficient FOOD (50 required) or the game balance contract may need to allow the Battle contract to deduct your entry fee.';
              else if (name === 'InsufficientEnergy') userMsg = 'Not enough energy. Fighter needs at least 20 energy.';
              else if (name === 'InvalidArena' || name === 'InvalidEnemy') userMsg = 'Arena or enemy not available on-chain. Try again or check contract config.';
              else userMsg = `Contract reverted: ${name}.`;
            }
          } catch (_) {
            if (s.includes('missing revert data') || s.includes('CALL_EXCEPTION')) userMsg = 'Contract reverted (reason not decoded). Check: Fighter staked, 20+ energy, 50+ FOOD, and not already in a battle.';
          }
        } else {
          if (s.includes('Not authorized') || s.includes('authorized to use fighter')) userMsg = 'Fighter not authorized. For staked fighters, battle entry goes through the Fighter contract—if this persists, the Fighter contract may not expose enterBattle/enterArena.';
          else if (s.includes('already in battle') || s.includes('in battle')) userMsg = 'This Fighter is already in a battle. Finish or claim it first.';
          else if (s.includes('energy') || s.includes('Energy')) userMsg = 'Not enough energy. Fighter needs at least 20 energy.';
          else if (s.includes('balance') || s.includes('fee') || s.includes('FOOD')) userMsg = 'Insufficient FOOD (50 required) or allowance for the Battle contract.';
          else if (s.includes('staked') || s.includes('Staked')) userMsg = 'Only staked Fighters can enter battle.';
          else if (s.includes('missing revert data') || s.includes('CALL_EXCEPTION')) userMsg = 'Contract reverted. Check: Fighter staked, 20+ energy, 50+ FOOD, and not already in a battle.';
        }
        setError(userMsg);
      }
      setTxPending(false);
    }
  };

  // ==================== BATTLE LOG ====================

  const addLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 10));
  };

  // ==================== BOOST USAGE ====================

  const useBoost = (boostId) => {
    if (isAnimating || currentTurn !== 'player') return;
    
    const boost = activeBoosts.find(b => b.id === boostId);
    if (!boost || boost.usedThisBattle) return;
    
    switch(boostId) {
      case 'konfisof_minor':
        addLog('🎯 Battle Boost (+15%): Fighter accuracy increased!');
        playBoostAnimation(boost.animation);
        markBoostUsed(boostId);
        break;
        
      case 'konfisof_major':
        addLog('🎯 Battle Boost (+40%): Fighter accuracy greatly increased!');
        playBoostAnimation(boost.animation);
        markBoostUsed(boostId);
        break;
        
      case 'bervation_prayer':
        if (fighterHP >= 3) {
          addLog('🙏 Already at full health!');
          return;
        }
        setFighterHP(hp => Math.min(hp + 1, 3));
        addLog('🙏 Holy Prayer: Restored 1 HP!');
        playBoostAnimation(boost.animation);
        removeBoost(boostId);
        break;
        
      case 'witkastle_morale':
        addLog('💪 Morale Boost: +10% hit chance, enemy -10% hit chance!');
        playBoostAnimation(boost.animation);
        markBoostUsed(boostId);
        break;
        
      case 'smizfume_poison':
        setPoisonedAttacksRemaining(2);
        addLog('🧪 Poison Potion: Enemy accuracy reduced by 20% for 2 attacks!');
        playBoostAnimation(boost.animation);
        removeBoost(boostId);
        break;
        
      case 'coalheart_freeze':
        setEnemyFrozen(true);
        addLog('❄️ Freeze: Enemy will skip their next turn!');
        playBoostAnimation(boost.animation);
        removeBoost(boostId);
        break;
        
      case 'warmdice_treasure':
        const goldAmount = Math.floor(Math.random() * 8) + 10;
        const woodAmount = Math.floor(Math.random() * 6) + 5;
        setOutcomeText(`💰 TREASURE!\n${goldAmount} GOLD + ${woodAmount} WOOD`);
        addLog(`💰 Treasure Chest: Found ${goldAmount} GOLD + ${woodAmount} WOOD!`);
        playBoostAnimation(boost.animation);
        setTimeout(() => setOutcomeText(''), 3000);
        removeBoost(boostId);
        break;
        
      case 'bowkin_trap':
        setEnemyHP(hp => Math.max(hp - 1, 0));
        addLog('🪤 Trap: Enemy loses 1 HP!');
        playBoostAnimation(boost.animation);
        removeBoost(boostId);
        
        // Check if enemy defeated by trap
        if (enemyHP <= 1) {
          setTimeout(() => handleEnemyDefeated(), 1500);
        }
        break;
    }
  };

  const playBoostAnimation = (animation) => {
    if (animation) {
      setWeaponAnimation(animation);
      setTimeout(() => setWeaponAnimation(null), 2000);
    }
  };

  const markBoostUsed = (boostId) => {
    setActiveBoosts(boosts => boosts.map(b => 
      b.id === boostId ? { ...b, usedThisBattle: true } : b
    ));
  };

  const removeBoost = (boostId) => {
    setActiveBoosts(boosts => boosts.filter(b => b.id !== boostId));
  };

  // ==================== COMBAT FUNCTIONS ====================

  const playerAttack = () => {
    if (isAnimating || currentTurn !== 'player') return;
    
    setIsAnimating(true);
    setOutcomeText('');
    
    const accuracy = calculateFighterAccuracy(selectedFighter.rarity, currentEnemy);
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= accuracy;
    
    // Play weapon animation
    setWeaponAnimation('/videos/sailors_dirk.mp4');
    
    setTimeout(() => {
      setWeaponAnimation(null);
      
      if (didHit) {
        setOutcomeText('FIGHTER HITS!');
        const newHP = enemyHP - 1;
        setEnemyHP(newHP);
        addLog(`⚔️ Fighter strikes! HIT! (${ENEMIES[currentEnemy].name}: ${newHP} HP)`);
        
        if (newHP <= 0) {
          setTimeout(() => handleEnemyDefeated(), 1500);
        } else {
          setTimeout(() => startEnemyTurn(), 2000);
        }
      } else {
        setOutcomeText('FIGHTER MISSES!');
        addLog(`⚔️ Fighter attacks... MISS!`);
        setTimeout(() => startEnemyTurn(), 2000);
      }
      
      setIsAnimating(false);
    }, 1500);
  };

  const startEnemyTurn = () => {
    setCurrentTurn('enemy');
    setOutcomeText('');
    
    // Check if enemy is frozen
    if (enemyFrozen) {
      setEnemyFrozen(false);
      addLog(`❄️ ${ENEMIES[currentEnemy].name} is frozen! Skips turn!`);
      setTimeout(() => {
        setRound(r => r + 1);
        setCurrentTurn('player');
      }, 1500);
      return;
    }
    
    setTimeout(() => enemyAttack(), 1000);
  };

  const enemyAttack = () => {
    setIsAnimating(true);
    
    let accuracy = calculateEnemyAccuracy(currentEnemy, selectedFighter.rarity);
    
    // Decrement poison counter
    if (poisonedAttacksRemaining > 0) {
      setPoisonedAttacksRemaining(p => p - 1);
      addLog(`🧪 ${ENEMIES[currentEnemy].name} is poisoned! (${poisonedAttacksRemaining - 1} attacks remaining)`);
    }
    
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= accuracy;
    
    // Play enemy weapon animation
    setWeaponAnimation(ENEMIES[currentEnemy].weaponVideo);
    
    setTimeout(() => {
      setWeaponAnimation(null);
      
      if (didHit) {
        setOutcomeText('ENEMY HITS!');
        const newHP = fighterHP - 1;
        setFighterHP(newHP);
        addLog(`🔥 ${ENEMIES[currentEnemy].name} attacks with ${ENEMIES[currentEnemy].weapon}! HIT! (Fighter: ${newHP} HP)`);
        
        if (newHP <= 0) {
          setTimeout(() => handleFighterDefeated(), 1500);
        } else {
          setTimeout(() => {
            setRound(r => r + 1);
            setCurrentTurn('player');
            setOutcomeText('');
          }, 2000);
        }
      } else {
        setOutcomeText('ENEMY MISSES!');
        addLog(`🛡️ ${ENEMIES[currentEnemy].name} attacks... MISS!`);
        setTimeout(() => {
          setRound(r => r + 1);
          setCurrentTurn('player');
          setOutcomeText('');
        }, 2000);
      }
      
      setIsAnimating(false);
    }, 1500);
  };

  // ==================== BATTLE OUTCOME HANDLERS ====================

  const handleEnemyDefeated = async () => {
    stopBattleMusic();
    addLog(`🏆 ${ENEMIES[currentEnemy].name} has been defeated!`);
    
    // Claim victory on-chain for this enemy
    try {
      setTxPending(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);
      
      addLog('⏳ Claiming rewards...');
      const tx = await battleContract.claimVictory(selectedFighter.tokenId, currentEnemy);
      const receipt = await tx.wait();
      
      // Parse rewards from event
      const rewards = {};
      for (const log of receipt.logs) {
        try {
          const parsed = battleContract.interface.parseLog(log);
          if (parsed?.name === 'RewardDistributed') {
            const tokenId = Number(parsed.args.tokenId);
            const amount = ethers.formatEther(parsed.args.amount);
            const tokenNames = { 1: 'FOOD', 2: 'GOLD', 3: 'WOOD', 4: 'RKT' };
            const tokenName = tokenNames[tokenId];
            if (tokenName) {
              rewards[tokenName] = parseFloat(amount).toFixed(2);
            }
          }
        } catch (e) {}
      }
      
      setEarnedRewards(rewards);
      addLog(`✅ Rewards claimed!`);
      
      // Update enemies defeated
      setEnemiesDefeated(prev => [...prev, currentEnemy]);
      
      // Check if more enemies to fight
      if (currentEnemy < 3) {
        setView('victory');
      } else {
        // All 3 enemies defeated - arena complete!
        setView('arena-complete');
      }
      
      setTxPending(false);
      
    } catch (err) {
      console.error('Error claiming victory:', err);
      addLog(`❌ Error claiming rewards: ${err.message}`);
      setView('victory'); // Still show victory screen
      setTxPending(false);
    }
  };

  const handleFighterDefeated = async () => {
    stopBattleMusic();
    addLog(`💀 Fighter #${selectedFighter.tokenId} has fallen...`);
    
    // Claim defeat on-chain
    try {
      setTxPending(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);
      
      addLog('⏳ Recording defeat...');
      const tx = await battleContract.claimDefeat(selectedFighter.tokenId);
      await tx.wait();
      
      addLog('Defeat recorded.');
      setView('defeat');
      setTxPending(false);
      
    } catch (err) {
      console.error('Error claiming defeat:', err);
      setView('defeat');
      setTxPending(false);
    }
  };

  // ==================== CONTINUE TO NEXT ENEMY ====================

  const continueToNextEnemy = () => {
    const nextEnemy = currentEnemy + 1;
    
    // Reset battle state for next enemy (NO extra payment, NO extra energy cost)
    setCurrentEnemy(nextEnemy);
    setEnemyHP(3);
    setFighterHP(fighterHP); // Keep current fighter HP
    setRound(1);
    setCurrentTurn('player');
    setOutcomeText('');
    setEarnedRewards(null);
    
    // Reset poison and freeze
    setPoisonedAttacksRemaining(0);
    setEnemyFrozen(false);
    
    // Clear used passive boosts for new enemy, remove consumed active boosts
    setActiveBoosts(boosts => boosts.filter(b => {
      // Remove passive boosts that were used
      if (b.usedThisBattle && (b.id === 'konfisof_minor' || b.id === 'konfisof_major' || b.id === 'witkastle_morale')) {
        return false;
      }
      return true;
    }).map(b => ({ ...b, usedThisBattle: false })));
    
    addLog(`⚔️ Advancing to ${ENEMIES[nextEnemy].name}, the ${ENEMIES[nextEnemy].title}!`);
    
    // Start music for next enemy
    startBattleMusic(currentArena.id, nextEnemy);
    
    setView('fighting');
  };

  // ==================== EXIT BATTLE ====================

  const exitBattle = async () => {
    stopBattleMusic();
    await loadUserData();
    
    // Reset all state
    setSelectedFighter(null);
    setCurrentArena(null);
    setCurrentEnemy(null);
    setEnemiesDefeated([]);
    setFighterHP(3);
    setEnemyHP(3);
    setBattleLog([]);
    setActiveBoosts([]);
    setPoisonedAttacksRemaining(0);
    setEnemyFrozen(false);
    setHeraldRarityBonus(0);
    setEarnedRewards(null);
    setError(null);
    setView('select');
  };

  // ==================== RENDER HELPERS ====================

  const getRarityColor = (rarity) => {
    const colors = ['from-orange-600 to-amber-700', 'from-gray-400 to-slate-300', 'from-yellow-500 to-amber-400'];
    return colors[rarity] || 'from-gray-600 to-gray-500';
  };

  const getRarityBorderColor = (rarity) => {
    const colors = ['#CD7F32', '#C0C0C0', '#FFD700'];
    return colors[rarity] || '#666';
  };

  // ==================== RENDER ====================

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Swords className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet to Battle</h2>
          <button
            onClick={connectWallet}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-white transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Swords className="w-10 h-10 text-red-500" />
            Battle Arena
            <Swords className="w-10 h-10 text-red-500" />
          </h1>
          <p className="text-gray-400">Send your Fighters into battle against arena enemies</p>
          {debugInfo && <p className="text-xs text-blue-400 mt-1">{debugInfo}</p>}
        </div>

        {/* Balances Display */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-400">FOOD</div>
              <div className="font-bold text-green-400">{userBalances.food.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">GOLD</div>
              <div className="font-bold text-yellow-400">{userBalances.gold.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">WOOD</div>
              <div className="font-bold text-amber-600">{userBalances.wood.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">RKT</div>
              <div className="font-bold text-purple-400">{userBalances.rkt.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-red-300 text-center">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-400 underline mt-2 block mx-auto">
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

        {/* Music Control */}
        {musicPlaying && (
          <button
            onClick={toggleMute}
            className="fixed bottom-6 right-6 bg-gray-800/90 hover:bg-gray-700 p-4 rounded-full z-50 border border-gray-600 shadow-lg transition"
            title={isMuted ? "Unmute Music" : "Mute Music"}
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-gray-400" /> : <Volume2 className="w-6 h-6 text-green-400" />}
          </button>
        )}

        {/* ==================== VIEW: SELECT FIGHTER ==================== */}
        {view === 'select' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Select Your Fighter</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading fighters...</p>
              </div>
            ) : stakedFighters.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                <Shield className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">No Staked Fighters</h3>
                <p className="text-gray-400 mb-4">You need to stake a Fighter before battling.</p>
                <button
                  onClick={() => onNavigate && onNavigate('stake-fighters')}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Go to Fighter Staking
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stakedFighters.map(fighter => {
                  const canFight = fighter.energy >= 20 && !fighter.inBattle && fighter.refuelStartTime === 0;
                  
                  return (
                    <div
                      key={fighter.tokenId}
                      onClick={() => canFight && handleSelectFighter(fighter)}
                      className={`bg-gray-800/50 border-2 rounded-xl p-4 transition ${
                        canFight ? 'cursor-pointer hover:scale-105 hover:border-red-500' : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{ borderColor: canFight ? getRarityBorderColor(fighter.rarity) : '#374151' }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm" style={{ color: getRarityBorderColor(fighter.rarity) }}>
                            {RARITY_NAMES[fighter.rarity]}
                          </div>
                          <div className="font-bold">{CLAN_NAMES[fighter.clan]}</div>
                        </div>
                        <div className="text-xs bg-black/50 px-2 py-1 rounded">
                          #{fighter.tokenId}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Zap className="w-4 h-4" /> Energy
                          </span>
                          <span className={fighter.energy >= 20 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                            {fighter.energy}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Trophy className="w-4 h-4" /> Record
                          </span>
                          <span className="font-bold">{fighter.wins}W - {fighter.losses}L</span>
                        </div>
                      </div>
                      
                      {fighter.inBattle ? (
                        <div className="mt-3 bg-red-600/50 text-center py-2 rounded text-sm font-bold">
                          IN BATTLE - Resume
                        </div>
                      ) : fighter.refuelStartTime > 0 ? (
                        <div className="mt-3 bg-yellow-600/50 text-center py-2 rounded text-sm font-bold">
                          REFUELING
                        </div>
                      ) : fighter.energy < 20 ? (
                        <div className="mt-3 bg-gray-700 text-center py-2 rounded text-sm text-gray-400">
                          LOW ENERGY
                        </div>
                      ) : (
                        <button className="w-full mt-3 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold transition">
                          Select Fighter
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW: PRE-BATTLE ==================== */}
        {view === 'pre-battle' && selectedFighter && (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Prepare for Battle</h2>
            
            {/* Selected Fighter Card */}
            <div className="bg-gray-800/50 border-2 rounded-xl p-6 mb-6" style={{ borderColor: getRarityBorderColor(selectedFighter.rarity) }}>
              <h3 className="text-xl font-bold mb-2">
                {RARITY_NAMES[selectedFighter.rarity]} {CLAN_NAMES[selectedFighter.clan]} Fighter #{selectedFighter.tokenId}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                <div>
                  <div className="text-gray-400">Energy</div>
                  <div className="font-bold text-green-400">{selectedFighter.energy}/100</div>
                </div>
                <div>
                  <div className="text-gray-400">Herald Bonus</div>
                  <div className="font-bold text-yellow-400">+{heraldRarityBonus}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Entry Cost</div>
                  <div className="font-bold text-orange-400">50 FOOD</div>
                </div>
              </div>
            </div>
            
            {/* Battle Info */}
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-bold text-gray-300 mb-2">Battle Rules:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• You will be sent to a <span className="text-yellow-400">random arena</span></li>
                <li>• Face 3 enemies: <span className="text-red-400">Zimrek → Lord Jeroboam → Nebchud Baddon</span></li>
                <li>• Each fighter and enemy has <span className="text-red-400">3 hearts (HP)</span></li>
                <li>• Defeat an enemy to progress (no extra cost)</li>
                <li>• Lose to any enemy and you return home</li>
                <li>• Entry costs <span className="text-orange-400">50 FOOD</span> and <span className="text-yellow-400">20 Energy</span> (once)</li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => { setSelectedFighter(null); setView('select'); }}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Back
                </button>
                <button
                  onClick={enterBattle}
                  disabled={txPending}
                  className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-bold text-xl transition disabled:opacity-50"
                >
                  <Swords className="w-5 h-5 inline mr-2" />
                  {txPending ? 'Entering...' : 'ENTER BATTLE'}
                </button>
              </div>
              <p className="text-xs text-gray-500 max-w-md">
                Entering battle requires one wallet signature: the contract records your 50 FOOD entry fee and battle state on-chain so rewards and stats are secure.
              </p>
            </div>
          </div>
        )}

        {/* ==================== VIEW: FIGHTING ==================== */}
        {view === 'fighting' && currentEnemy && selectedFighter && currentArena && (
          <div className="max-w-4xl mx-auto">
            
            {/* Battle Boosts Bar */}
            {activeBoosts.length > 0 && (
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-600 rounded-lg">
                <p className="text-xs text-purple-400 mb-2 text-center font-bold">Battle Boosts (Click to Use):</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {activeBoosts.map(boost => {
                    const isUsed = boost.usedThisBattle;
                    const canUse = currentTurn === 'player' && !isAnimating && !isUsed;
                    
                    return (
                      <button
                        key={boost.id}
                        onClick={() => canUse && useBoost(boost.id)}
                        disabled={!canUse}
                        className={`px-3 py-2 rounded border text-xs transition ${
                          isUsed
                            ? 'bg-gray-900/50 border-gray-700 text-gray-600 cursor-not-allowed'
                            : canUse
                            ? 'bg-purple-900/50 border-purple-500 text-purple-200 hover:bg-purple-800/70 cursor-pointer'
                            : 'bg-purple-900/30 border-purple-700 text-purple-400 cursor-wait'
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

            {/* Arena Header */}
            <div className={`bg-gradient-to-br ${currentArena.color} rounded-xl p-4 mb-4`}>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{currentArena.name}</h2>
                <p className="text-sm text-gray-300">Round {round} • Enemy {currentEnemy}/3</p>
              </div>
            </div>

            {/* Battle Area */}
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-7 gap-3 items-center">
                
                {/* Fighter Side */}
                <div className="col-span-2 text-center">
                  <h3 className="text-lg font-bold mb-2">Fighter #{selectedFighter.tokenId}</h3>
                  <p className="text-xs text-gray-400 mb-2">{RARITY_NAMES[selectedFighter.rarity]} {CLAN_NAMES[selectedFighter.clan]}</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(3)].map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-6 h-6 ${i < fighterHP ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm mb-2">
                    <span className="text-yellow-400">Hit: </span>
                    <span className="font-bold text-yellow-400">
                      {calculateFighterAccuracy(selectedFighter.rarity, currentEnemy)}%
                    </span>
                    {heraldRarityBonus > 0 && (
                      <span className="text-xs text-green-400 ml-1">(+{heraldRarityBonus}%)</span>
                    )}
                  </div>
                  <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
                    <img 
                      src="/images/pirate_fighter.png" 
                      alt="Fighter" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Center - Actions/Animation */}
                <div className="col-span-3 flex flex-col justify-center items-center">
                  {weaponAnimation ? (
                    <div className="w-full h-32 bg-black rounded-lg overflow-hidden mb-2">
                      {weaponAnimation.endsWith('.gif') ? (
                        <img src={weaponAnimation} alt="Animation" className="w-full h-full object-contain" />
                      ) : (
                        <video autoPlay muted playsInline className="w-full h-full object-contain">
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
                      ATTACK
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
                  <h3 className="text-lg font-bold mb-2">{ENEMIES[currentEnemy].name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{ENEMIES[currentEnemy].title}</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(3)].map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-6 h-6 ${i < enemyHP ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm mb-2">
                    <span className="text-red-400">Hit: </span>
                    <span className="font-bold text-red-400">
                      {calculateEnemyAccuracy(currentEnemy, selectedFighter.rarity)}%
                    </span>
                    {poisonedAttacksRemaining > 0 && (
                      <span className="text-xs text-purple-400 ml-1">🧪</span>
                    )}
                    {enemyFrozen && (
                      <span className="text-xs text-blue-400 ml-1">❄️</span>
                    )}
                  </div>
                  <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
                    <img 
                      src={ENEMIES[currentEnemy].staticImage} 
                      alt={ENEMIES[currentEnemy].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Battle Log */}
            <div className="bg-gray-900/50 rounded-lg p-3">
              <h3 className="text-sm font-bold mb-2 text-gray-400">Battle Log:</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {battleLog.map((log, idx) => (
                  <p key={idx} className="text-xs text-gray-400">{log}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW: VICTORY (Enemy Defeated) ==================== */}
        {view === 'victory' && currentEnemy && earnedRewards && (
          <div className="max-w-lg mx-auto text-center">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-4xl font-bold mb-2 text-yellow-400">VICTORY!</h2>
            <p className="text-xl mb-6">{ENEMIES[currentEnemy].name} has been defeated!</p>

            {/* Rewards */}
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 mb-6">
              <h3 className="font-bold mb-4">Rewards Earned:</h3>
              <div className="flex justify-center gap-4">
                {Object.entries(earnedRewards).map(([token, amount]) => (
                  <div key={token} className="text-center">
                    <div className="text-2xl">
                      {token === 'FOOD' && '🍖'}
                      {token === 'GOLD' && '🪙'}
                      {token === 'WOOD' && '🪵'}
                      {token === 'RKT' && '👑'}
                    </div>
                    <div className="font-bold">{amount}</div>
                    <div className="text-xs text-gray-400">{token}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue or Exit */}
            {currentEnemy < 3 ? (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Next: <span className="text-red-400 font-bold">{ENEMIES[currentEnemy + 1].name}</span>
                  <span className="text-gray-500"> - {ENEMIES[currentEnemy + 1].title}</span>
                </p>
                <p className="text-sm text-gray-500">
                  (No extra cost to continue - same battle session)
                </p>
                <button
                  onClick={continueToNextEnemy}
                  className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-xl transition"
                >
                  <Swords className="w-5 h-5 inline mr-2" />
                  Fight Next Enemy
                </button>
                <button
                  onClick={exitBattle}
                  className="block mx-auto text-gray-400 hover:text-white text-sm transition"
                >
                  Exit with current rewards
                </button>
              </div>
            ) : (
              <button
                onClick={exitBattle}
                className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-xl transition"
              >
                Claim Victory & Exit
              </button>
            )}
          </div>
        )}

        {/* ==================== VIEW: ARENA COMPLETE ==================== */}
        {view === 'arena-complete' && (
          <div className="max-w-lg mx-auto text-center">
            <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-4xl font-bold mb-2 text-yellow-400">ARENA CONQUERED!</h2>
            <p className="text-xl mb-6">You have defeated all three enemies!</p>

            {earnedRewards && (
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-4">Final Rewards:</h3>
                <div className="flex justify-center gap-4">
                  {Object.entries(earnedRewards).map(([token, amount]) => (
                    <div key={token} className="text-center">
                      <div className="text-2xl">
                        {token === 'FOOD' && '🍖'}
                        {token === 'GOLD' && '🪙'}
                        {token === 'WOOD' && '🪵'}
                        {token === 'RKT' && '👑'}
                      </div>
                      <div className="font-bold">{amount}</div>
                      <div className="text-xs text-gray-400">{token}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={exitBattle}
              className="bg-green-600 hover:bg-green-700 px-12 py-4 rounded-lg font-bold text-xl transition"
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Return Victorious
            </button>
          </div>
        )}

        {/* ==================== VIEW: DEFEAT ==================== */}
        {view === 'defeat' && (
          <div className="max-w-lg mx-auto text-center">
            <Skull className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-2 text-red-500">DEFEATED</h2>
            <p className="text-xl mb-6">Your Fighter has fallen in battle...</p>

            {enemiesDefeated.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <p className="text-gray-400">
                  Enemies defeated before falling: <span className="text-yellow-400 font-bold">{enemiesDefeated.length}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You kept rewards from enemies {enemiesDefeated.join(', ')}
                </p>
              </div>
            )}

            <button
              onClick={exitBattle}
              className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-bold text-xl transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}