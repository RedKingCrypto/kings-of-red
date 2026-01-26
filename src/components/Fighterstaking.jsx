import React, { useState, useEffect, useRef } from 'react';
import { Swords, Clock, AlertCircle, CheckCircle, Loader, Plus, RefreshCw, Fuel } from 'lucide-react';
import { ethers } from 'ethers';
import {
  FIGHTER_ADDRESS,
  GAMEBALANCE_ADDRESS,
  CLAN_NAMES,
  RARITY_NAMES
} from '../contractConfig';

// ============================================
// FIGHTER IMAGE CONFIGURATION
// Images may be .jpg or .png - try both
// ============================================
const FIGHTER_IMAGES_CID = 'bafybeidy2j57ufvelxbahduiht6aud34ufyufgwlp6632fcadwrh3dlr4i';
const PINATA_GATEWAY = 'https://emerald-adequate-eagle-845.mypinata.cloud/ipfs';

// Fighter images use pattern: {rarity}_{clan}.{ext}
const getFighterImageUrl = (rarity, clan) => {
  const rarityName = (RARITY_NAMES[rarity] || 'bronze').toLowerCase();
  const clanName = (CLAN_NAMES[clan] || 'witkastle').toLowerCase();
  // Try JPG first (most likely), fallback handled in component
  return `${PINATA_GATEWAY}/${FIGHTER_IMAGES_CID}/${rarityName}_${clanName}.jpg`;
};

// Fighter image component with automatic fallback to PNG
const FighterImage = ({ rarity, clan, className, alt }) => {
  const [useJpg, setUseJpg] = useState(true);
  const rarityName = (RARITY_NAMES[rarity] || 'bronze').toLowerCase();
  const clanName = (CLAN_NAMES[clan] || 'witkastle').toLowerCase();
  
  const jpgUrl = `${PINATA_GATEWAY}/${FIGHTER_IMAGES_CID}/${rarityName}_${clanName}.jpg`;
  const pngUrl = `${PINATA_GATEWAY}/${FIGHTER_IMAGES_CID}/${rarityName}_${clanName}.png`;
  
  const handleError = () => {
    if (useJpg) {
      console.log(`Fighter image JPG failed, trying PNG: ${rarityName}_${clanName}`);
      setUseJpg(false);
    }
  };
  
  return (
    <img 
      src={useJpg ? jpgUrl : pngUrl} 
      alt={alt || 'Fighter'} 
      className={className}
      onError={handleError}
    />
  );
};

// ============================================
// FIGHTER ABI - V4
// ============================================
const FIGHTER_ABI_COMPLETE = [
  // ERC721Enumerable (Fighter V4 supports this!)
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  
  // Standard ERC721
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  
  // Fighter-specific data
  "function fighters(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, bool isStaked, bool inBattle, uint256 refuelStartTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses)",
  "function getFighterStats(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, bool isStaked, bool inBattle, uint256 refuelStartTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses)",
  
  // Staking functions
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  "function stakeFighter(uint256 tokenId)",
  "function unstakeFighter(uint256 tokenId)",
  
  // Refuel
  "function startRefuel(uint256 tokenId)",
  "function completeRefuel(uint256 tokenId)",
  "function refuel(uint256 tokenId)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event FighterMinted(uint256 indexed tokenId, address indexed minter, uint8 rarity, uint8 clan)"
];

const GAMEBALANCE_ABI = [
  "function getBalance(address user, uint256 tokenId) view returns (uint256)"
];

// Constants
const REFUEL_COST = 50; // FOOD tokens
const REFUEL_DURATION = 10800; // 3 hours in seconds
const MAX_ENERGY = 100;
const TOKEN_IDS = { FOOD: 1, GOLD: 2, WOOD: 3, RKT: 4 };

const CLAN_COLORS = [
  'from-red-600 to-orange-500',
  'from-gray-600 to-slate-400',
  'from-purple-600 to-indigo-500',
  'from-blue-600 to-cyan-500',
  'from-green-600 to-emerald-500',
  'from-yellow-500 to-amber-400',
  'from-rose-600 to-red-700'
];

const RARITY_COLORS = ['text-orange-400', 'text-gray-300', 'text-yellow-400'];
const HIT_CHANCES = [20, 30, 40]; // Bronze, Silver, Gold

export default function FighterStakingPage({ connected, walletAddress, onNavigate }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [fighters, setFighters] = useState([]);
  const [stakedByClans, setStakedByClans] = useState({});
  const [unstakedByClans, setUnstakedByClans] = useState({});
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedClan, setSelectedClan] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [foodBalance, setFoodBalance] = useState(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (connected && walletAddress) {
      loadFighterData(true);
    } else {
      setInitialLoading(false);
    }
  }, [connected, walletAddress]);

  useEffect(() => {
    if (!connected || !walletAddress) return;
    const interval = setInterval(() => loadFighterData(false), 60000);
    return () => clearInterval(interval);
  }, [connected, walletAddress]);

  const loadFighterData = async (showLoading = false) => {
    if (!walletAddress || !window.ethereum) {
      setInitialLoading(false);
      setDebugInfo('No wallet connected');
      return;
    }
    
    try {
      if (showLoading && isFirstLoad.current) {
        setInitialLoading(true);
      }
      
      // ============================================
      // USE BROWSER PROVIDER (MetaMask) - Much more reliable!
      // This is the key fix - same as Herald Staking
      // ============================================
      console.log('Using browser provider (MetaMask) for Fighter loading...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI_COMPLETE, provider);
      const gameBalanceContract = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_ABI, provider);
      
      console.log('Loading Fighter data for:', walletAddress);
      setDebugInfo('Loading via MetaMask...');
      
      // Get FOOD balance
      try {
        const food = await gameBalanceContract.getBalance(walletAddress, TOKEN_IDS.FOOD);
        setFoodBalance(Number(ethers.formatEther(food)));
      } catch (e) {
        console.warn('Could not get FOOD balance:', e.message);
      }
      
      // ============================================
      // Get Fighter balance
      // ============================================
      const balance = await fighterContract.balanceOf(walletAddress);
      const fighterCount = Number(balance);
      console.log(`User owns ${fighterCount} Fighters`);
      setDebugInfo(`Found ${fighterCount} Fighters...`);
      
      if (fighterCount === 0) {
        setFighters([]);
        setStakedByClans({});
        setUnstakedByClans({});
        setLastRefresh(new Date().toLocaleTimeString());
        setDebugInfo('No Fighters found');
        setInitialLoading(false);
        isFirstLoad.current = false;
        return;
      }
      
      // ============================================
      // METHOD 1: Try ERC721Enumerable (Fighter V4 supports this)
      // ============================================
      const userFighters = [];
      let enumerableFailed = false;
      
      try {
        console.log('Trying ERC721Enumerable (tokenOfOwnerByIndex)...');
        
        for (let i = 0; i < fighterCount; i++) {
          setDebugInfo(`Loading Fighter ${i + 1}/${fighterCount}...`);
          
          const tokenId = await fighterContract.tokenOfOwnerByIndex(walletAddress, i);
          const tokenIdStr = tokenId.toString();
          console.log(`Found Fighter #${tokenIdStr} via enumerable`);
          
          // Get fighter details
          const fighterData = await loadFighterDetails(fighterContract, tokenIdStr);
          if (fighterData) {
            userFighters.push(fighterData);
            console.log(`✅ Fighter #${tokenIdStr}: ${RARITY_NAMES[fighterData.rarity]} ${CLAN_NAMES[fighterData.clan]}, Staked: ${fighterData.isStaked}`);
          }
        }
        
        console.log(`ERC721Enumerable found ${userFighters.length} fighters`);
      } catch (enumErr) {
        console.warn('ERC721Enumerable failed:', enumErr.message);
        enumerableFailed = true;
      }
      
      // ============================================
      // METHOD 2: Brute force fallback (same as Herald)
      // ============================================
      if (enumerableFailed || userFighters.length < fighterCount) {
        console.log('Using brute force fallback...');
        setDebugInfo('Searching for Fighters (brute force)...');
        
        try {
          const totalSupply = await fighterContract.totalSupply();
          const total = Number(totalSupply);
          console.log(`Total Fighter supply: ${total}`);
          
          for (let i = 1; i <= total; i++) {
            // Skip if already found
            if (userFighters.some(f => f.tokenId === i.toString())) continue;
            if (userFighters.length >= fighterCount) break;
            
            try {
              const owner = await fighterContract.ownerOf(i);
              if (owner.toLowerCase() === walletAddress.toLowerCase()) {
                const fighterData = await loadFighterDetails(fighterContract, i.toString());
                if (fighterData) {
                  userFighters.push(fighterData);
                  console.log(`✅ Found Fighter #${i} via brute force`);
                  setDebugInfo(`Found ${userFighters.length}/${fighterCount} Fighters...`);
                }
              }
            } catch (e) {
              // Token doesn't exist or error - continue
            }
          }
        } catch (bruteErr) {
          console.error('Brute force also failed:', bruteErr.message);
        }
      }
      
      // ============================================
      // Organize by clan
      // ============================================
      const staked = {};
      const unstaked = {};
      
      for (const fighter of userFighters) {
        if (fighter.isStaked) {
          staked[fighter.clan] = fighter;
        } else {
          if (!unstaked[fighter.clan]) unstaked[fighter.clan] = [];
          unstaked[fighter.clan].push(fighter);
        }
      }
      
      console.log('Final results:', userFighters.length, 'fighters');
      console.log('Staked by clan:', Object.keys(staked).length);
      console.log('Unstaked fighters:', userFighters.filter(f => !f.isStaked).length);
      
      setFighters(userFighters);
      setStakedByClans(staked);
      setUnstakedByClans(unstaked);
      setLastRefresh(new Date().toLocaleTimeString());
      setDebugInfo(`✅ ${userFighters.filter(f => !f.isStaked).length} unstaked, ${Object.keys(staked).length} staked`);
      setMessage({ type: '', text: '' });
      
    } catch (error) {
      console.error('Error loading fighters:', error);
      setDebugInfo(`Error: ${error.message.slice(0, 50)}...`);
      if (isFirstLoad.current) {
        setMessage({ type: 'error', text: 'Failed to load Fighters: ' + error.message });
      }
    } finally {
      setInitialLoading(false);
      isFirstLoad.current = false;
    }
  };

  // Helper function to load fighter details
  const loadFighterDetails = async (contract, tokenIdStr) => {
    try {
      let fighterData = null;
      
      // Try fighters() mapping first
      try {
        fighterData = await contract.fighters(tokenIdStr);
      } catch {
        // Try getFighterStats() as fallback
        try {
          fighterData = await contract.getFighterStats(tokenIdStr);
        } catch (e) {
          console.warn(`Could not get Fighter #${tokenIdStr} data:`, e.message);
          return null;
        }
      }
      
      if (!fighterData) return null;
      
      const rarity = Number(fighterData.rarity ?? fighterData[0]);
      const clan = Number(fighterData.clan ?? fighterData[1]);
      const energy = Number(fighterData.energy ?? fighterData[2]);
      const isStaked = Boolean(fighterData.isStaked ?? fighterData[3]);
      const inBattle = Boolean(fighterData.inBattle ?? fighterData[4]);
      const refuelStartTime = Number(fighterData.refuelStartTime ?? fighterData[5]);
      const wins = Number(fighterData.wins ?? fighterData[6]);
      const losses = Number(fighterData.losses ?? fighterData[7]);
      const pvpWins = Number(fighterData.pvpWins ?? fighterData[8] ?? 0);
      const pvpLosses = Number(fighterData.pvpLosses ?? fighterData[9] ?? 0);
      
      // Calculate refuel status
      let isRefueling = false;
      let refuelTimeRemaining = 0;
      if (refuelStartTime > 0) {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - refuelStartTime;
        if (elapsed < REFUEL_DURATION) {
          isRefueling = true;
          refuelTimeRemaining = REFUEL_DURATION - elapsed;
        }
      }
      
      return {
        tokenId: tokenIdStr,
        rarity,
        clan,
        energy,
        isStaked,
        inBattle,
        wins,
        losses,
        pvpWins,
        pvpLosses,
        isRefueling,
        refuelTimeRemaining,
        refuelStartTime
      };
    } catch (e) {
      console.error(`Error loading fighter #${tokenIdStr}:`, e.message);
      return null;
    }
  };

  const showMessageFunc = (type, text) => {
    setMessage({ type, text });
    if (type !== 'info') setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleStake = async (tokenId, clanId) => {
    // Check if user already has this clan staked
    if (stakedByClans[clanId]) {
      showMessageFunc('error', `❌ You already have a ${CLAN_NAMES[clanId]} Fighter staked! Only one per clan.`);
      return;
    }
    
    try {
      setProcessing(tokenId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI_COMPLETE, signer);
      
      // Check approval - Fighter stakes to itself, so check if approved for FIGHTER_ADDRESS
      const approved = await fighterContract.getApproved(tokenId);
      const isApprovedForAll = await fighterContract.isApprovedForAll(walletAddress, FIGHTER_ADDRESS);
      
      if (approved.toLowerCase() !== FIGHTER_ADDRESS.toLowerCase() && !isApprovedForAll) {
        showMessageFunc('info', 'Approving Fighter...');
        const approveTx = await fighterContract.approve(FIGHTER_ADDRESS, tokenId);
        await approveTx.wait();
      }
      
      showMessageFunc('info', 'Staking Fighter...');
      
      // Try different stake function names
      let tx;
      try {
        tx = await fighterContract.stake(tokenId);
      } catch {
        try {
          tx = await fighterContract.stakeFighter(tokenId);
        } catch (e) {
          throw new Error('Staking function not found: ' + e.message);
        }
      }
      
      await tx.wait();
      showMessageFunc('success', '✅ Fighter staked successfully!');
      setShowStakeModal(false);
      await loadFighterData(false);
    } catch (error) {
      let errorMsg = '❌ Staking failed';
      if (error.message?.includes('clan') || error.message?.includes('already')) {
        errorMsg = '❌ You already have a Fighter from this clan staked!';
      } else if (error.message?.includes('max')) {
        errorMsg = '❌ Maximum 7 Fighters can be staked.';
      } else {
        errorMsg = '❌ ' + (error.reason || error.message || 'Staking failed');
      }
      showMessageFunc('error', errorMsg);
    } finally {
      setProcessing(null);
    }
  };

  const handleUnstake = async (tokenId) => {
    try {
      setProcessing(tokenId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI_COMPLETE, signer);
      
      showMessageFunc('info', 'Unstaking Fighter...');
      
      let tx;
      try {
        tx = await fighterContract.unstake(tokenId);
      } catch {
        try {
          tx = await fighterContract.unstakeFighter(tokenId);
        } catch (e) {
          throw new Error('Unstaking function not found: ' + e.message);
        }
      }
      
      await tx.wait();
      showMessageFunc('success', '✅ Fighter unstaked!');
      await loadFighterData(false);
    } catch (error) {
      showMessageFunc('error', '❌ ' + (error.reason || error.message || 'Unstaking failed'));
    } finally {
      setProcessing(null);
    }
  };

  const handleRefuel = async (tokenId) => {
    const fighter = fighters.find(f => f.tokenId === tokenId);
    if (!fighter) return;
    
    if (foodBalance < REFUEL_COST) {
      showMessageFunc('error', `❌ Need ${REFUEL_COST} FOOD, you have ${foodBalance.toFixed(0)}`);
      return;
    }
    
    try {
      setProcessing(tokenId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fighterContract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI_COMPLETE, signer);
      
      showMessageFunc('info', 'Starting refuel...');
      
      let tx;
      try {
        tx = await fighterContract.startRefuel(tokenId);
      } catch {
        try {
          tx = await fighterContract.refuel(tokenId);
        } catch (e) {
          throw new Error('Refuel function not found: ' + e.message);
        }
      }
      
      await tx.wait();
      showMessageFunc('success', '✅ Refuel started! Ready in 3 hours.');
      await loadFighterData(false);
    } catch (error) {
      showMessageFunc('error', '❌ ' + (error.reason || error.message || 'Refuel failed'));
    } finally {
      setProcessing(null);
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Ready!';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getEnergyColor = (energy) => {
    if (energy > 60) return 'bg-green-500';
    if (energy > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect to stake Fighters and enter battles.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Fighter Staking</h1>
            <p className="text-gray-400">Stake one Fighter per clan to enable battles (max 7 total)</p>
          </div>
          <button
            onClick={() => loadFighterData(true)}
            disabled={initialLoading}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${initialLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Fighters: {fighters.length} | Staked: {Object.keys(stakedByClans).length}
          {lastRefresh && ` | Updated: ${lastRefresh}`}
        </p>
        {debugInfo && <p className="text-xs text-blue-400 mt-1">{debugInfo}</p>}
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-300' :
          message.type === 'error' ? 'bg-red-900/20 border-red-800 text-red-300' :
          'bg-blue-900/20 border-blue-800 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {message.type === 'info' && <Loader className="w-5 h-5 animate-spin" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-16">
          <Loader className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Fighters...</p>
          {debugInfo && <p className="text-xs text-blue-400 mt-2">{debugInfo}</p>}
        </div>
      ) : (
        <>
          {/* Clan-based grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CLAN_NAMES.map((clanName, clanId) => {
              const stakedFighter = stakedByClans[clanId];
              const availableFighters = unstakedByClans[clanId] || [];
              const isStaked = !!stakedFighter;
              
              return (
                <div key={clanId} className={`bg-gradient-to-br ${CLAN_COLORS[clanId]} p-1 rounded-lg`}>
                  <div className="bg-gray-900 rounded-lg overflow-hidden h-full">
                    <div className="p-3 border-b border-gray-800">
                      <h3 className="font-bold text-center">{clanName}</h3>
                      {isStaked && (
                        <p className={`text-center text-sm ${RARITY_COLORS[stakedFighter.rarity]}`}>
                          {RARITY_NAMES[stakedFighter.rarity]} • {HIT_CHANCES[stakedFighter.rarity]}% Hit
                        </p>
                      )}
                    </div>

                    <div className="aspect-square relative bg-gray-800">
                      {isStaked ? (
                        <>
                          <FighterImage 
                            rarity={stakedFighter.rarity} 
                            clan={stakedFighter.clan}
                            className="w-full h-full object-cover"
                            alt={`${clanName} Fighter`}
                          />
                          {/* Energy bar overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Energy</span>
                              <span>{stakedFighter.energy}/{MAX_ENERGY}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getEnergyColor(stakedFighter.energy)}`}
                                style={{ width: `${stakedFighter.energy}%` }}
                              />
                            </div>
                          </div>
                          {stakedFighter.inBattle && (
                            <div className="absolute top-2 left-2 bg-red-600/90 px-2 py-1 rounded text-xs font-bold">
                              In Battle
                            </div>
                          )}
                          {stakedFighter.isRefueling && (
                            <div className="absolute top-2 right-2 bg-blue-600/90 px-2 py-1 rounded text-xs">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTime(stakedFighter.refuelTimeRemaining)}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Plus className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Empty Slot</p>
                            {availableFighters.length > 0 && (
                              <p className="text-xs text-green-400 mt-1">{availableFighters.length} available</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2">
                      {isStaked ? (
                        <>
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-black/30 p-2 rounded text-center">
                              <span className="text-gray-400">PvE</span>
                              <p className="font-bold">{stakedFighter.wins}W-{stakedFighter.losses}L</p>
                            </div>
                            <div className="bg-black/30 p-2 rounded text-center">
                              <span className="text-gray-400">PvP</span>
                              <p className="font-bold">{stakedFighter.pvpWins}W-{stakedFighter.pvpLosses}L</p>
                            </div>
                          </div>

                          {/* Refuel button */}
                          {stakedFighter.energy < MAX_ENERGY && !stakedFighter.isRefueling && (
                            <button
                              onClick={() => handleRefuel(stakedFighter.tokenId)}
                              disabled={processing === stakedFighter.tokenId || foodBalance < REFUEL_COST}
                              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              {processing === stakedFighter.tokenId ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Fuel className="w-4 h-4" />
                                  Refuel ({REFUEL_COST} FOOD)
                                </>
                              )}
                            </button>
                          )}

                          {/* Unstake button */}
                          <button
                            onClick={() => handleUnstake(stakedFighter.tokenId)}
                            disabled={processing === stakedFighter.tokenId || stakedFighter.inBattle}
                            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded text-sm"
                          >
                            {stakedFighter.inBattle ? 'In Battle' : 'Unstake'}
                          </button>
                          <p className="text-xs text-center text-gray-500">Fighter #{stakedFighter.tokenId}</p>
                        </>
                      ) : (
                        <button
                          onClick={() => { setSelectedClan(clanId); setShowStakeModal(true); }}
                          disabled={availableFighters.length === 0}
                          className="block w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded font-semibold text-sm text-center"
                        >
                          {availableFighters.length === 0 ? 'No Fighters Available' : `Stake Fighter (${availableFighters.length})`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unstaked fighters list */}
          {fighters.filter(f => !f.isStaked).length > 0 && (
            <div className="mt-8 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
              <h3 className="font-bold text-green-300 mb-2">
                Your Unstaked Fighters ({fighters.filter(f => !f.isStaked).length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {fighters.filter(f => !f.isStaked).map(f => (
                  <span key={f.tokenId} className="bg-gray-800 px-2 py-1 rounded text-sm">
                    #{f.tokenId} - {RARITY_NAMES[f.rarity]} {CLAN_NAMES[f.clan]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-semibold mb-1">How Fighter Staking Works</p>
                <ul className="list-disc ml-4 space-y-1 text-yellow-400/80">
                  <li>Stake one Fighter per clan (max 7 total)</li>
                  <li>Only staked Fighters can enter battles</li>
                  <li>Battles cost 20 energy per fight</li>
                  <li>Refuel costs {REFUEL_COST} FOOD + 3 hours wait time</li>
                  <li>You need a matching Herald staked to battle with a Fighter</li>
                  <li>Your FOOD balance: <strong>{foodBalance.toFixed(0)}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stake Modal */}
      {showStakeModal && selectedClan !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Stake Fighter in {CLAN_NAMES[selectedClan]}</h2>
                <button onClick={() => setShowStakeModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              {(unstakedByClans[selectedClan] || []).length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">You don't own any {CLAN_NAMES[selectedClan]} Fighters</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {(unstakedByClans[selectedClan] || []).map((fighter) => (
                    <div key={fighter.tokenId} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-red-500">
                      <div className="aspect-square relative">
                        <FighterImage 
                          rarity={fighter.rarity}
                          clan={fighter.clan}
                          className="w-full h-full object-cover"
                          alt={`Fighter #${fighter.tokenId}`}
                        />
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                          <span className={RARITY_COLORS[fighter.rarity]}>{RARITY_NAMES[fighter.rarity]}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-center mb-1">Fighter #{fighter.tokenId}</p>
                        <p className="text-sm text-center text-gray-400 mb-1">{HIT_CHANCES[fighter.rarity]}% Hit Chance</p>
                        <p className="text-xs text-center text-gray-500 mb-3">Energy: {fighter.energy}/{MAX_ENERGY}</p>
                        <button
                          onClick={() => handleStake(fighter.tokenId, selectedClan)}
                          disabled={processing === fighter.tokenId}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
                        >
                          {processing === fighter.tokenId ? (
                            <Loader className="w-5 h-5 animate-spin mx-auto" />
                          ) : (
                            'Stake This Fighter'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}