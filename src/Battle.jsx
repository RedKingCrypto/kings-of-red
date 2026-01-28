import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Swords, Shield, Heart, Zap, Trophy, Skull, Clock, Volume2, VolumeX, Play, Target, Flame, Crown } from 'lucide-react';
import { 
  BATTLE_ADDRESS, 
  FIGHTER_ADDRESS, 
  HERALD_STAKING_ADDRESS,
  GAMEBALANCE_ADDRESS,
  CLAN_NAMES
} from './contractConfig';

// ==================== CONTRACT ABIs ====================

// Fighter ABI - CORRECT struct order: rarity, clan, energy, refuelStartTime, wins, losses, pvpWins, pvpLosses, isStaked, inBattle
const FIGHTER_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function fighters(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint64 energy, uint64 refuelStartTime, uint32 wins, uint32 losses, uint32 pvpWins, uint32 pvpLosses, bool isStaked, bool inBattle)"
];

// Herald Staking ABI
const HERALD_STAKING_ABI = [
  "function hasClanStaked(address user, uint8 clan) view returns (bool)",
  "function getUserStakedHeralds(address user) view returns (uint256[])"
];

// GameBalance ABI - try multiple function signatures
const GAMEBALANCE_ABI = [
  "function getAllBalances(address user) view returns (uint256 food, uint256 gold, uint256 wood, uint256 rkt)",
  "function getBalances(address user) view returns (uint256[] memory)",
  "function getBalance(address user, uint8 tokenId) view returns (uint256)",
  "function inGameBalances(address user, uint8 tokenId) view returns (uint256)"
];

// Battle ABI
const BATTLE_ABI = [
  "function enterArena(uint256 fighterId, uint8 arenaId, uint8 enemyId)",
  "function attack(uint256 fighterId)",
  "function claimVictory(uint256 fighterId)",
  "function claimDefeat(uint256 fighterId)",
  "function getBattleState(uint256 fighterId) view returns (bool inBattle, uint8 arenaId, uint8 enemyId, uint8 enemyHealth, uint8 fighterHealth, uint256 battleStartTime)",
  "function canClaimVictory(uint256 fighterId) view returns (bool)",
  "function canClaimDefeat(uint256 fighterId) view returns (bool)",
  "function entryFee() view returns (uint256)",
  "event AttackPerformed(uint256 indexed fighterId, bool fighterHit, bool enemyHit, uint8 fighterDamage, uint8 enemyDamage)",
  "event RewardsDistributed(address indexed player, uint256 food, uint256 gold, uint256 wood, uint256 rkt)"
];

// ==================== ARENA & ENEMY CONFIGURATION ====================

const ARENAS = [
  { id: 0, name: 'Smizfume Caverns', clan: 'Smizfume', color: 'from-red-900 to-orange-800', active: false },
  { id: 1, name: 'Coalheart Mines', clan: 'Coalheart', color: 'from-gray-800 to-slate-700', active: false },
  { id: 2, name: 'Warmdice Casino', clan: 'Warmdice', color: 'from-purple-900 to-indigo-800', active: false },
  { id: 3, name: 'Bervation Depths', clan: 'Bervation', color: 'from-blue-900 to-cyan-800', active: false },
  { id: 4, name: 'Konfisof Grove', clan: 'Konfisof', color: 'from-green-900 to-emerald-800', active: false },
  { id: 5, name: 'Witkastle Fortress', clan: 'Witkastle', color: 'from-yellow-800 to-amber-700', active: true },
  { id: 6, name: 'Bowkin Hideout', clan: 'Bowkin', color: 'from-rose-900 to-red-800', active: false }
];

const ENEMIES = {
  5: [ // Witkastle enemies
    { id: 1, name: 'Lashon the Weak', health: 8, image: '/images/enemies/witkastle_1.png' },
    { id: 2, name: 'Benji the Brown', health: 12, image: '/images/enemies/witkastle_2.png' },
    { id: 3, name: 'Andrew the Unbreakable', health: 20, image: '/images/enemies/witkastle_3.png' }
  ]
};

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
  // Battle State
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [selectedArena, setSelectedArena] = useState(null);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  
  // Data State
  const [stakedFighters, setStakedFighters] = useState([]);
  const [userBalances, setUserBalances] = useState({ food: 0, gold: 0, wood: 0, rkt: 0 });
  const [hasClanHeraldStaked, setHasClanHeraldStaked] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('select'); // 'select', 'arena', 'battle', 'victory', 'defeat'
  const [debugInfo, setDebugInfo] = useState('');
  
  // Music State
  const [isMuted, setIsMuted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  // ==================== MUSIC FUNCTIONS ====================

  const startBattleMusic = (arenaId, enemyId) => {
    stopBattleMusic();
    const musicPath = BATTLE_MUSIC[arenaId]?.[enemyId];
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
    setDebugInfo('Loading...');
    
    try {
      // Use browser provider (MetaMask) - more reliable than public RPCs
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, provider);
      const gameBalanceContract = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_ABI, provider);
      
      console.log('Loading battle data for:', walletAddress);
      
      // ==================== LOAD STAKED FIGHTERS ====================
      // Use the same method as FighterStaking - get all fighters and filter by isStaked
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
            
            console.log(`Fighter #${tokenId}: ${CLAN_NAMES[clan]}, Staked: ${isStaked}, InBattle: ${inBattle}`);
            
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
                lastRefuelTime: refuelStartTime
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
      try {
        // Try getAllBalances first
        let balances = null;
        
        try {
          const result = await gameBalanceContract.getAllBalances(walletAddress);
          balances = {
            food: Number(ethers.formatEther(result[0] || result.food || 0)),
            gold: Number(ethers.formatEther(result[1] || result.gold || 0)),
            wood: Number(ethers.formatEther(result[2] || result.wood || 0)),
            rkt: Number(ethers.formatEther(result[3] || result.rkt || 0))
          };
          console.log('Loaded balances via getAllBalances:', balances);
        } catch (e) {
          console.log('getAllBalances failed, trying individual getBalance calls:', e.message);
          
          // Try individual balance calls with uint8 token IDs
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
            console.log('Loaded balances via getBalance:', balances);
          } catch (e2) {
            console.log('getBalance also failed:', e2.message);
            
            // Try inGameBalances mapping
            try {
              const food = await gameBalanceContract.inGameBalances(walletAddress, 1);
              const gold = await gameBalanceContract.inGameBalances(walletAddress, 2);
              const wood = await gameBalanceContract.inGameBalances(walletAddress, 3);
              const rkt = await gameBalanceContract.inGameBalances(walletAddress, 4);
              
              balances = {
                food: Number(ethers.formatEther(food)),
                gold: Number(ethers.formatEther(gold)),
                wood: Number(ethers.formatEther(wood)),
                rkt: Number(ethers.formatEther(rkt))
              };
              console.log('Loaded balances via inGameBalances:', balances);
            } catch (e3) {
              console.log('inGameBalances also failed:', e3.message);
            }
          }
        }
        
        if (balances) {
          setUserBalances(balances);
        }
      } catch (e) {
        console.log('Error loading balances:', e.message);
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

  // Check if user has matching clan Herald staked
  const checkClanHeraldStaked = async (clanId) => {
    if (!window.ethereum || !walletAddress) return false;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, provider);
      const hasStaked = await stakingContract.hasClanStaked(walletAddress, clanId);
      setHasClanHeraldStaked(hasStaked);
      return hasStaked;
    } catch (e) {
      console.log('Error checking herald staking:', e.message);
      return false;
    }
  };

  // Check if fighter is already in battle
  const checkBattleState = async (fighterId) => {
    if (!window.ethereum) return null;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, provider);
      const state = await battleContract.getBattleState(fighterId);
      
      if (state[0]) { // inBattle
        return {
          inBattle: true,
          arenaId: Number(state[1]),
          enemyId: Number(state[2]),
          enemyHealth: Number(state[3]),
          fighterHealth: Number(state[4]),
          battleStartTime: Number(state[5])
        };
      }
      return null;
    } catch (e) {
      console.log('Error checking battle state:', e.message);
      return null;
    }
  };

  // ==================== FIGHTER SELECTION ====================

  const handleSelectFighter = async (fighter) => {
    setSelectedFighter(fighter);
    setError(null);
    
    // Check if fighter is in battle
    const existingBattle = await checkBattleState(fighter.tokenId);
    if (existingBattle) {
      setBattleState(existingBattle);
      setSelectedArena(existingBattle.arenaId);
      setSelectedEnemy(existingBattle.enemyId);
      addBattleLog('Resuming existing battle...');
      setView('battle');
      startBattleMusic(existingBattle.arenaId, existingBattle.enemyId);
      return;
    }
    
    // Check if matching clan Herald is staked
    const hasHerald = await checkClanHeraldStaked(fighter.clan);
    if (!hasHerald) {
      setError(`You need a ${CLAN_NAMES[fighter.clan] || 'matching'} Herald staked to battle!`);
    }
    
    setView('arena');
  };

  // ==================== ARENA SELECTION ====================

  const handleSelectArena = (arenaId) => {
    if (!ARENAS[arenaId]?.active) {
      setError('This arena is not yet open!');
      return;
    }
    setSelectedArena(arenaId);
    setSelectedEnemy(null);
  };

  const handleSelectEnemy = (enemyId) => {
    setSelectedEnemy(enemyId);
  };

  // ==================== BATTLE ACTIONS ====================

  const addBattleLog = (message, type = 'info') => {
    setBattleLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
  };

  const handleEnterBattle = async () => {
    if (!selectedFighter || selectedArena === null || !selectedEnemy) {
      setError('Please select a fighter, arena, and enemy');
      return;
    }
    
    if (!hasClanHeraldStaked) {
      setError(`You need a ${CLAN_NAMES[selectedFighter.clan]} Herald staked to battle!`);
      return;
    }
    
    if (selectedFighter.energy < 20) {
      setError('Fighter needs at least 20 energy. Refuel first!');
      return;
    }
    
    if (userBalances.food < 50) {
      setError('You need at least 50 FOOD for the entry fee!');
      return;
    }
    
    setLoading(true);
    setError(null);
    setBattleLog([]);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);
      
      addBattleLog(`Entering ${ARENAS[selectedArena].name}...`);
      
      const tx = await battleContract.enterArena(
        selectedFighter.tokenId,
        selectedArena,
        selectedEnemy
      );
      
      addBattleLog('Transaction submitted, waiting for confirmation...');
      await tx.wait();
      
      addBattleLog('Battle started! Prepare for combat!', 'success');
      
      const state = await checkBattleState(selectedFighter.tokenId);
      setBattleState(state);
      startBattleMusic(selectedArena, selectedEnemy);
      setView('battle');
      
    } catch (e) {
      console.error('Error entering battle:', e);
      if (e.code === 'ACTION_REJECTED') {
        setError('Transaction cancelled');
      } else if (e.message?.includes('insufficient')) {
        setError('Insufficient FOOD balance for entry fee');
      } else if (e.message?.includes('Herald')) {
        setError('Matching clan Herald not staked');
      } else {
        setError('Failed to enter battle: ' + (e.reason || e.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAttack = async () => {
    if (!selectedFighter || !battleState) return;
    
    setAttacking(true);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);
      
      addBattleLog('Attacking...', 'info');
      
      const tx = await battleContract.attack(selectedFighter.tokenId);
      const receipt = await tx.wait();
      
      // Parse attack event
      let fighterHit = false;
      let enemyHit = false;
      let fighterDamage = 0;
      let enemyDamage = 0;
      
      for (const log of receipt.logs) {
        try {
          const parsed = battleContract.interface.parseLog(log);
          if (parsed?.name === 'AttackPerformed') {
            fighterHit = parsed.args.fighterHit;
            enemyHit = parsed.args.enemyHit;
            fighterDamage = Number(parsed.args.fighterDamage);
            enemyDamage = Number(parsed.args.enemyDamage);
          }
        } catch (e) {}
      }
      
      if (fighterHit) {
        addBattleLog(`💥 You hit for ${fighterDamage} damage!`, 'success');
      } else {
        addBattleLog('❌ Your attack missed!', 'warning');
      }
      
      if (enemyHit) {
        addBattleLog(`🔥 Enemy hit you for ${enemyDamage} damage!`, 'danger');
      } else {
        addBattleLog('🛡️ Enemy attack missed!', 'success');
      }
      
      const newState = await checkBattleState(selectedFighter.tokenId);
      
      if (!newState || !newState.inBattle) {
        const canVictory = await battleContract.canClaimVictory(selectedFighter.tokenId);
        if (canVictory) {
          addBattleLog('🏆 VICTORY! Enemy defeated!', 'success');
          setView('victory');
        } else {
          addBattleLog('💀 DEFEAT! You have fallen...', 'danger');
          setView('defeat');
        }
        stopBattleMusic();
      } else {
        setBattleState(newState);
      }
      
    } catch (e) {
      console.error('Attack error:', e);
      if (e.code === 'ACTION_REJECTED') {
        addBattleLog('Attack cancelled', 'warning');
      } else {
        addBattleLog('Attack failed: ' + (e.reason || e.message), 'danger');
      }
    } finally {
      setAttacking(false);
    }
  };

  const handleClaimVictory = async () => {
    if (!selectedFighter) return;
    
    setLoading(true);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);
      
      addBattleLog('Claiming rewards...');
      
      const tx = await battleContract.claimVictory(selectedFighter.tokenId);
      const receipt = await tx.wait();
      
      let rewards = { food: 0, gold: 0, wood: 0, rkt: 0 };
      for (const log of receipt.logs) {
        try {
          const parsed = battleContract.interface.parseLog(log);
          if (parsed?.name === 'RewardsDistributed') {
            rewards = {
              food: Number(ethers.formatEther(parsed.args.food)),
              gold: Number(ethers.formatEther(parsed.args.gold)),
              wood: Number(ethers.formatEther(parsed.args.wood)),
              rkt: Number(ethers.formatEther(parsed.args.rkt))
            };
          }
        } catch (e) {}
      }
      
      addBattleLog(`🎁 Rewards: ${rewards.food} FOOD, ${rewards.gold} GOLD, ${rewards.wood} WOOD, ${rewards.rkt} RKT`, 'success');
      
      stopBattleMusic();
      await loadUserData();
      setBattleState(null);
      setSelectedEnemy(null);
      
    } catch (e) {
      console.error('Claim victory error:', e);
      setError('Failed to claim victory: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDefeat = async () => {
    if (!selectedFighter) return;
    
    setLoading(true);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, BATTLE_ABI, signer);
      
      addBattleLog('Retreating from battle...');
      
      const tx = await battleContract.claimDefeat(selectedFighter.tokenId);
      await tx.wait();
      
      addBattleLog('You live to fight another day...', 'warning');
      
      stopBattleMusic();
      await loadUserData();
      setBattleState(null);
      setSelectedEnemy(null);
      
    } catch (e) {
      console.error('Claim defeat error:', e);
      setError('Failed to claim defeat: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFighter(null);
    setSelectedArena(null);
    setSelectedEnemy(null);
    setBattleState(null);
    setBattleLog([]);
    setError(null);
    setView('select');
    stopBattleMusic();
  };

  // ==================== RENDER HELPERS ====================

  const getRarityName = (rarity) => ['Bronze', 'Silver', 'Gold'][rarity] || 'Unknown';

  const getRarityColor = (rarity) => {
    const colors = ['from-orange-600 to-amber-700', 'from-gray-400 to-slate-300', 'from-yellow-500 to-amber-400'];
    return colors[rarity] || 'from-gray-600 to-gray-500';
  };

  const getEnemyData = () => {
    if (selectedArena === null || !selectedEnemy) return null;
    return ENEMIES[selectedArena]?.find(e => e.id === selectedEnemy);
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
          </div>
        )}

        {/* Music Control Button */}
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
                {stakedFighters.map(fighter => (
                  <div
                    key={fighter.tokenId}
                    onClick={() => handleSelectFighter(fighter)}
                    className={`bg-gradient-to-br ${getRarityColor(fighter.rarity)} p-0.5 rounded-xl cursor-pointer hover:scale-105 transition`}
                  >
                    <div className="bg-gray-900 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm text-gray-400">{getRarityName(fighter.rarity)}</div>
                          <div className="font-bold">{CLAN_NAMES[fighter.clan] || 'Unknown'}</div>
                        </div>
                        <div className="text-xs bg-black/50 px-2 py-1 rounded">
                          #{fighter.tokenId}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Zap className="w-4 h-4" /> Energy
                          </span>
                          <span className={fighter.energy >= 20 ? 'text-green-400' : 'text-red-400'}>
                            {fighter.energy}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Trophy className="w-4 h-4" /> PvE Wins
                          </span>
                          <span className="text-yellow-400">{fighter.wins}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Skull className="w-4 h-4" /> PvE Losses
                          </span>
                          <span className="text-red-400">{fighter.losses}</span>
                        </div>
                      </div>
                      
                      {fighter.inBattle && (
                        <div className="mt-3 bg-red-600/50 text-center py-1 rounded text-sm font-bold">
                          IN BATTLE - Resume
                        </div>
                      )}
                      
                      <button className="w-full mt-4 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold transition">
                        {fighter.inBattle ? 'Resume Battle' : 'Select Fighter'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW: SELECT ARENA & ENEMY ==================== */}
        {view === 'arena' && selectedFighter && (
          <div className="max-w-4xl mx-auto">
            {/* Selected Fighter Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Selected Fighter</div>
                  <div className="font-bold">
                    {getRarityName(selectedFighter.rarity)} {CLAN_NAMES[selectedFighter.clan]} #{selectedFighter.tokenId}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">Energy</div>
                    <div className={selectedFighter.energy >= 20 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {selectedFighter.energy}
                    </div>
                  </div>
                </div>
                <button onClick={handleReset} className="text-gray-400 hover:text-white transition">
                  Change Fighter
                </button>
              </div>
            </div>

            {/* Herald Warning */}
            {!hasClanHeraldStaked && (
              <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 mb-6">
                <p className="text-yellow-300 text-center">
                  ⚠️ You need a {CLAN_NAMES[selectedFighter.clan]} Herald staked to battle with this Fighter!
                </p>
              </div>
            )}

            {/* Arena Selection */}
            <h2 className="text-2xl font-bold mb-4 text-center">Select Arena</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {ARENAS.map(arena => (
                <button
                  key={arena.id}
                  onClick={() => handleSelectArena(arena.id)}
                  disabled={!arena.active}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedArena === arena.id
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : arena.active
                      ? 'border-gray-600 hover:border-gray-400 bg-gray-800/50'
                      : 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`text-sm font-bold ${arena.active ? 'text-white' : 'text-gray-500'}`}>
                    {arena.name}
                  </div>
                  <div className={`text-xs ${arena.active ? 'text-gray-400' : 'text-gray-600'}`}>
                    {arena.active ? 'OPEN' : 'COMING SOON'}
                  </div>
                </button>
              ))}
            </div>

            {/* Enemy Selection */}
            {selectedArena !== null && ENEMIES[selectedArena] && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Select Enemy</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {ENEMIES[selectedArena].map(enemy => (
                    <button
                      key={enemy.id}
                      onClick={() => handleSelectEnemy(enemy.id)}
                      className={`p-6 rounded-lg border-2 transition ${
                        selectedEnemy === enemy.id
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-gray-600 hover:border-gray-400 bg-gray-800/50'
                      }`}
                    >
                      <Target className="w-12 h-12 mx-auto mb-3 text-red-500" />
                      <div className="font-bold text-lg">{enemy.name}</div>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        {enemy.health} HP
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Difficulty: {enemy.id === 1 ? 'Easy' : enemy.id === 2 ? 'Medium' : 'Hard'}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Enter Battle Button */}
            {selectedArena !== null && selectedEnemy && (
              <div className="text-center">
                <button
                  onClick={handleEnterBattle}
                  disabled={loading || !hasClanHeraldStaked || selectedFighter.energy < 20}
                  className={`px-8 py-4 rounded-lg font-bold text-xl transition ${
                    loading || !hasClanHeraldStaked || selectedFighter.energy < 20
                      ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Entering Battle...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Swords className="w-6 h-6" />
                      Enter Battle (50 FOOD)
                    </span>
                  )}
                </button>
                <p className="text-gray-500 text-sm mt-2">Entry fee: 50 FOOD | Uses 20 Energy</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW: ACTIVE BATTLE ==================== */}
        {view === 'battle' && battleState && selectedFighter && (
          <div className="max-w-3xl mx-auto">
            <div className={`bg-gradient-to-br ${ARENAS[selectedArena]?.color || 'from-gray-800 to-gray-900'} rounded-xl p-6 mb-6`}>
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">{ARENAS[selectedArena]?.name || 'Battle Arena'}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="bg-black/50 rounded-lg p-4">
                    <Shield className="w-16 h-16 mx-auto text-blue-400 mb-2" />
                    <div className="font-bold">Your Fighter</div>
                    <div className="text-sm text-gray-400">
                      {getRarityName(selectedFighter.rarity)} {CLAN_NAMES[selectedFighter.clan]}
                    </div>
                    <div className="mt-3">
                      <div className="text-sm text-gray-400 mb-1">Health</div>
                      <div className="w-full bg-gray-700 rounded-full h-4">
                        <div
                          className="bg-green-500 h-4 rounded-full transition-all"
                          style={{ width: `${(battleState.fighterHealth / 100) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm mt-1">{battleState.fighterHealth} HP</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-black/50 rounded-lg p-4">
                    <Skull className="w-16 h-16 mx-auto text-red-500 mb-2" />
                    <div className="font-bold">{getEnemyData()?.name || 'Enemy'}</div>
                    <div className="text-sm text-gray-400">Enemy {selectedEnemy}</div>
                    <div className="mt-3">
                      <div className="text-sm text-gray-400 mb-1">Health</div>
                      <div className="w-full bg-gray-700 rounded-full h-4">
                        <div
                          className="bg-red-500 h-4 rounded-full transition-all"
                          style={{ width: `${(battleState.enemyHealth / (getEnemyData()?.health || 8)) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm mt-1">{battleState.enemyHealth} HP</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 h-48 overflow-y-auto">
              <h3 className="font-bold mb-2 text-gray-400">Battle Log</h3>
              <div className="space-y-1">
                {battleLog.map((log, i) => (
                  <div
                    key={i}
                    className={`text-sm ${
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'danger' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleAttack}
                disabled={attacking}
                className={`px-12 py-4 rounded-lg font-bold text-xl transition ${
                  attacking
                    ? 'bg-gray-700 cursor-wait'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 animate-pulse'
                }`}
              >
                {attacking ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                    Attacking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Swords className="w-6 h-6" />
                    ATTACK!
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================== VIEW: VICTORY ==================== */}
        {view === 'victory' && (
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-gradient-to-br from-yellow-900/50 to-amber-900/50 border border-yellow-500 rounded-xl p-8">
              <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold mb-2">VICTORY!</h2>
              <p className="text-gray-300 mb-6">You have defeated the enemy!</p>
              
              <button
                onClick={handleClaimVictory}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 py-4 rounded-lg font-bold text-xl transition mb-4"
              >
                {loading ? 'Claiming...' : 'Claim Rewards'}
              </button>
              
              <button onClick={handleReset} className="text-gray-400 hover:text-white transition">
                Return to Fighter Select
              </button>
            </div>
          </div>
        )}

        {/* ==================== VIEW: DEFEAT ==================== */}
        {view === 'defeat' && (
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-gradient-to-br from-red-900/50 to-gray-900/50 border border-red-500 rounded-xl p-8">
              <Skull className="w-24 h-24 mx-auto text-red-500 mb-4" />
              <h2 className="text-3xl font-bold mb-2">DEFEAT</h2>
              <p className="text-gray-300 mb-6">Your fighter has fallen in battle...</p>
              
              <button
                onClick={handleClaimDefeat}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 py-4 rounded-lg font-bold text-xl transition mb-4"
              >
                {loading ? 'Processing...' : 'Accept Defeat'}
              </button>
              
              <button onClick={handleReset} className="text-gray-400 hover:text-white transition">
                Return to Fighter Select
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}