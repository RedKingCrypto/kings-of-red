import React, { useState, useEffect, useRef } from 'react';
import { Zap, Shield, Swords, Clock, Flame, Droplet, AlertCircle, CheckCircle, Loader, Plus } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  FIGHTER_V4_ADDRESS, 
  GAME_BALANCE_V4_ADDRESS,
  GAME_BALANCE_V4_ABI,
  CLAN_NAMES,
  RARITY_NAMES
} from '../contractConfig';

// ============================================
// FIGHTER V4 ABI
// ============================================
const FIGHTER_V4_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function fighters(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, bool isStaked, bool inBattle, uint256 refuelStartTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses)",
  "function getFighterStats(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, bool isStaked, bool inBattle, bool isRefueling, uint256 refuelCompleteTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses, uint256 points)",
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  "function startRefuel(uint256 tokenId)",
  "function completeRefuel(uint256 tokenId)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

const CLAN_COLORS = [
  'from-red-600 to-orange-500',      // Smizfume
  'from-gray-600 to-slate-400',      // Coalheart
  'from-purple-600 to-indigo-500',   // Warmdice
  'from-blue-600 to-cyan-500',       // Bervation
  'from-green-600 to-emerald-500',   // Konfisof
  'from-yellow-500 to-amber-400',    // Witkastle
  'from-rose-600 to-red-700'         // Bowkin
];

const RARITY_COLORS = ['text-orange-400', 'text-gray-300', 'text-yellow-400'];

const CLAN_FIGHTERS = {
  0: 'Kenshi Champion', 1: 'Shinobi', 2: 'Boarding Bruiser', 3: 'Templar Guard',
  4: 'Enforcer', 5: 'Knight', 6: 'Oakwood Guardian'
};

// Image URLs - using the IMAGES CID (not metadata CID)
const FIGHTER_IMAGE_BASE = 'https://emerald-adequate-eagle-845.mypinata.cloud/ipfs/bafybeidy2j57ufvelxbahduiht6aud34ufyufgwlp6632fcadwrh3dlr4i';

// Build image URL - trying multiple extensions
const getFighterImageUrl = (rarity, clan) => {
  const rarityName = (RARITY_NAMES[rarity] || 'bronze').toLowerCase();
  const clanName = (CLAN_NAMES[clan] || 'witkastle').toLowerCase();
  // Try .png extension (most common for NFT images)
  return `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.png`;
};

// Fallback image URLs to try
const getFighterImageUrls = (rarity, clan) => {
  const rarityName = (RARITY_NAMES[rarity] || 'bronze').toLowerCase();
  const clanName = (CLAN_NAMES[clan] || 'witkastle').toLowerCase();
  return [
    `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.png`,
    `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.jpg`,
    `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.webp`,
    `${FIGHTER_IMAGE_BASE}/${rarityName}-${clanName}.png`,
    `${FIGHTER_IMAGE_BASE}/${clanName}_${rarityName}.png`,
  ];
};

const HIT_CHANCES = { 0: '20%', 1: '30%', 2: '40%' };

export default function FighterStaking({ connected, walletAddress, provider, signer, onNavigate }) {
  const [fighters, setFighters] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [foodBalance, setFoodBalance] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedClan, setSelectedClan] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const isFirstLoad = useRef(true);
  
  const refuelCost = 50;
  const refuelDuration = 10800;
  const maxEnergy = 100;

  // Organize fighters by clan
  const stakedByClans = {};
  const unstakedByClans = {};
  
  fighters.forEach(f => {
    if (f.isStaked) {
      stakedByClans[f.clan] = f;
    } else {
      if (!unstakedByClans[f.clan]) unstakedByClans[f.clan] = [];
      unstakedByClans[f.clan].push(f);
    }
  });

  useEffect(() => {
    if (connected && walletAddress) {
      loadFighters(true);
      loadFoodBalance();
    } else {
      setInitialLoading(false);
    }
  }, [connected, walletAddress]);

  useEffect(() => {
    if (!connected || !walletAddress) return;
    const interval = setInterval(() => loadFighters(false), 30000);
    return () => clearInterval(interval);
  }, [connected, walletAddress]);

  const loadFoodBalance = async () => {
    if (!walletAddress) return;
    try {
      const rpcProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const gameBalance = new ethers.Contract(GAME_BALANCE_V4_ADDRESS, GAME_BALANCE_V4_ABI, rpcProvider);
      const balance = await gameBalance.getBalance(walletAddress, 1);
      setFoodBalance(Number(ethers.formatEther(balance)));
    } catch (err) {
      console.warn('Error loading FOOD balance:', err.message);
    }
  };

  const loadFighters = async (showLoading = false) => {
    if (!walletAddress) { setInitialLoading(false); return; }
    
    try {
      if (showLoading && isFirstLoad.current) setInitialLoading(true);
      
      const rpcProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, rpcProvider);
      
      const balance = await contract.balanceOf(walletAddress);
      const fighterCount = Number(balance);
      
      if (fighterCount === 0) {
        setFighters([]);
        setInitialLoading(false);
        isFirstLoad.current = false;
        return;
      }
      
      const tokenIds = [];
      try {
        for (let i = 0; i < fighterCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId);
        }
      } catch (enumErr) {
        const filter = contract.filters.Transfer(null, walletAddress);
        const events = await contract.queryFilter(filter, 0, 'latest');
        const potentialIds = [...new Set(events.map(e => e.args.tokenId.toString()))];
        for (const tokenIdStr of potentialIds) {
          try {
            const owner = await contract.ownerOf(tokenIdStr);
            if (owner.toLowerCase() === walletAddress.toLowerCase()) {
              tokenIds.push(BigInt(tokenIdStr));
            }
          } catch (e) {}
        }
      }
      
      const loadedFighters = [];
      for (const tokenId of tokenIds) {
        try {
          let fighterData;
          try {
            const stats = await contract.getFighterStats(tokenId);
            fighterData = {
              tokenId: Number(tokenId),
              rarity: Number(stats.rarity),
              clan: Number(stats.clan),
              energy: Number(stats.energy),
              isStaked: stats.isStaked,
              inBattle: stats.inBattle,
              isRefueling: stats.isRefueling,
              refuelCompleteTime: Number(stats.refuelCompleteTime),
              wins: Number(stats.wins),
              losses: Number(stats.losses),
              pvpWins: Number(stats.pvpWins),
              pvpLosses: Number(stats.pvpLosses),
            };
          } catch {
            const fighter = await contract.fighters(tokenId);
            fighterData = {
              tokenId: Number(tokenId),
              rarity: Number(fighter.rarity),
              clan: Number(fighter.clan),
              energy: Number(fighter.energy),
              isStaked: fighter.isStaked,
              inBattle: fighter.inBattle,
              isRefueling: Number(fighter.refuelStartTime) > 0,
              refuelCompleteTime: Number(fighter.refuelStartTime) > 0 
                ? Number(fighter.refuelStartTime) + refuelDuration : 0,
              wins: Number(fighter.wins),
              losses: Number(fighter.losses),
              pvpWins: Number(fighter.pvpWins),
              pvpLosses: Number(fighter.pvpLosses),
            };
          }
          
          // Try to get tokenURI for image
          try {
            const uri = await contract.tokenURI(tokenId);
            // If it's an IPFS URI, we might be able to extract the image
            console.log(`Token ${tokenId} URI:`, uri);
            fighterData.tokenURI = uri;
          } catch (e) {
            console.warn(`Could not get tokenURI for ${tokenId}`);
          }
          
          loadedFighters.push(fighterData);
        } catch (err) {
          console.warn(`Error loading fighter ${tokenId}:`, err.message);
        }
      }
      
      setFighters(loadedFighters);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error loading fighters:', err);
      if (isFirstLoad.current) setError('Failed to load fighters');
    } finally {
      setInitialLoading(false);
      isFirstLoad.current = false;
    }
  };

  const stakeFighter = async (tokenId) => {
    if (!signer) { setError('Please connect your wallet'); return; }
    
    // Check if clan already has a staked fighter (prevent in UI)
    const fighter = fighters.find(f => f.tokenId === tokenId);
    if (fighter && stakedByClans[fighter.clan]) {
      setError(`❌ You already have a ${CLAN_NAMES[fighter.clan]} Fighter staked! Only one Fighter per clan is allowed.`);
      return;
    }
    
    setActionLoading(tokenId);
    setError(''); setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      const tx = await contract.stake(tokenId);
      await tx.wait();
      setSuccess(`✅ Fighter #${tokenId} staked successfully!`);
      setShowStakeModal(false);
      await loadFighters(false);
    } catch (err) {
      console.error('Staking error:', err);
      let errorMsg = 'Staking failed';
      
      if (err.message?.includes('CALL_EXCEPTION') || err.message?.includes('revert')) {
        // Parse common staking errors
        if (err.message?.includes('clan') || err.message?.includes('C')) {
          errorMsg = '❌ You already have a Fighter from this clan staked. Only one per clan allowed!';
        } else if (err.message?.includes('max') || err.message?.includes('M')) {
          errorMsg = '❌ Maximum 7 Fighters can be staked at once.';
        } else if (err.message?.includes('paused') || err.message?.includes('S')) {
          errorMsg = '❌ Staking is currently paused.';
        } else {
          errorMsg = '❌ Cannot stake this Fighter. You may already have one from this clan staked.';
        }
      } else {
        errorMsg = err.reason || err.message || 'Staking failed';
      }
      
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const unstakeFighter = async (tokenId) => {
    if (!signer) { setError('Please connect your wallet'); return; }
    setActionLoading(tokenId);
    setError(''); setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      const tx = await contract.unstake(tokenId);
      await tx.wait();
      setSuccess(`✅ Fighter #${tokenId} unstaked!`);
      await loadFighters(false);
    } catch (err) {
      let errorMsg = 'Unstaking failed';
      if (err.message?.includes('CALL_EXCEPTION')) {
        errorMsg = '❌ Cannot unstake: Fighter must have full energy (100) to unstake.';
      } else {
        errorMsg = err.reason || err.message || 'Unstaking failed';
      }
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const startRefuel = async (tokenId) => {
    if (!signer) { setError('Please connect your wallet'); return; }
    if (foodBalance < refuelCost) {
      setError(`❌ Insufficient FOOD! Need ${refuelCost} FOOD, you have ${foodBalance.toFixed(0)}`);
      return;
    }
    setActionLoading(tokenId);
    setError(''); setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      const tx = await contract.startRefuel(tokenId);
      await tx.wait();
      setSuccess(`✅ Refueling started! Will be ready in ${refuelDuration / 3600} hours.`);
      await loadFighters(false);
      await loadFoodBalance();
    } catch (err) {
      let errorMsg = 'Refuel failed';
      if (err.message?.includes('CALL_EXCEPTION')) {
        errorMsg = '❌ Cannot refuel: Fighter must have 0 energy and be staked.';
      } else {
        errorMsg = err.reason || err.message || 'Refuel failed';
      }
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const completeRefuel = async (tokenId) => {
    if (!signer) { setError('Please connect your wallet'); return; }
    setActionLoading(tokenId);
    setError(''); setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      const tx = await contract.completeRefuel(tokenId);
      await tx.wait();
      setSuccess(`✅ Fighter #${tokenId} refueled to full energy!`);
      await loadFighters(false);
    } catch (err) {
      let errorMsg = 'Complete refuel failed';
      if (err.message?.includes('CALL_EXCEPTION')) {
        errorMsg = '❌ Refuel not ready yet. Please wait for the timer to complete.';
      } else {
        errorMsg = err.reason || err.message || 'Complete refuel failed';
      }
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const getRefuelStatus = (fighter) => {
    if (!fighter.isRefueling && fighter.refuelCompleteTime === 0) return { status: 'none', timeRemaining: 0 };
    const now = Math.floor(Date.now() / 1000);
    if (fighter.refuelCompleteTime <= now) return { status: 'ready', timeRemaining: 0 };
    return { status: 'refueling', timeRemaining: fighter.refuelCompleteTime - now };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const canUnstake = (fighter) => fighter.isStaked && !fighter.inBattle && fighter.energy === maxEnergy && getRefuelStatus(fighter).status === 'none';
  const canRefuel = (fighter) => fighter.isStaked && !fighter.inBattle && fighter.energy === 0 && getRefuelStatus(fighter).status === 'none';
  const canCompleteRefuel = (fighter) => getRefuelStatus(fighter).status === 'ready';

  // Image component with fallback
  const FighterImage = ({ fighter, className }) => {
    const [imgIndex, setImgIndex] = useState(0);
    const urls = getFighterImageUrls(fighter.rarity, fighter.clan);
    
    const handleError = () => {
      if (imgIndex < urls.length - 1) {
        setImgIndex(imgIndex + 1);
      }
    };
    
    return (
      <div className={`${className} bg-gradient-to-br ${CLAN_COLORS[fighter.clan]} flex items-center justify-center`}>
        <img 
          src={urls[imgIndex]}
          alt={`${RARITY_NAMES[fighter.rarity]} ${CLAN_NAMES[fighter.clan]} Fighter`}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      </div>
    );
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Fighter Staking</h2>
        <p className="text-gray-400">Connect your wallet to stake your Fighters</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
          Fighter Staking
        </h1>
        <p className="text-xl text-gray-300 mb-2">Stake one Fighter per clan to enable battles (max 7)</p>
        
        <div className="inline-flex gap-6 bg-gray-800/50 border border-gray-700 rounded-lg px-8 py-4 mt-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            <span className="font-bold">{fighters.length} Owned</span>
          </div>
          <div className="w-px bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="font-bold">{Object.keys(stakedByClans).length}/7 Staked</span>
          </div>
          <div className="w-px bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">{foodBalance.toFixed(0)} FOOD</span>
          </div>
        </div>
        {lastRefresh && <p className="text-xs text-gray-600 mt-2">Updated: {lastRefresh}</p>}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Refuel Info */}
      <div className="mb-8 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Flame className="w-6 h-6 text-yellow-400" /> Refuel System
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-gray-400">Cost:</p><p className="text-lg font-bold text-yellow-400">{refuelCost} FOOD</p></div>
          <div><p className="text-gray-400">Duration:</p><p className="text-lg font-bold text-yellow-400">{refuelDuration / 3600} Hours</p></div>
          <div><p className="text-gray-400">Restores:</p><p className="text-lg font-bold text-yellow-400">0 → {maxEnergy} Energy</p></div>
        </div>
        <p className="text-xs text-gray-400 mt-4">⚡ Each battle costs 20 energy • Cannot unstake until full energy • Cannot refuel until 0 energy</p>
      </div>

      {/* Main Content */}
      {initialLoading ? (
        <div className="text-center py-16">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your Fighters...</p>
        </div>
      ) : fighters.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-lg border border-gray-700">
          <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">No Fighters Yet</h3>
          <p className="text-gray-400 mb-6">Mint your first Fighter to start!</p>
          <button onClick={() => onNavigate?.('mint-fighter')} className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-bold">
            Mint Fighters
          </button>
        </div>
      ) : (
        <>
          {/* Clan-based Grid - similar to Herald staking */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CLAN_NAMES.map((clanName, clanId) => {
              const stakedFighter = stakedByClans[clanId];
              const availableFighters = unstakedByClans[clanId] || [];
              const isStaked = !!stakedFighter;
              
              return (
                <div key={clanId} className={`bg-gradient-to-br ${CLAN_COLORS[clanId]} p-1 rounded-lg`}>
                  <div className="bg-gray-900 rounded-lg overflow-hidden h-full">
                    {/* Header */}
                    <div className="p-3 border-b border-gray-800">
                      <h3 className="font-bold text-center">{clanName}</h3>
                      <p className="text-xs text-center text-gray-400">{CLAN_FIGHTERS[clanId]}</p>
                      {isStaked && (
                        <p className={`text-center text-sm font-bold ${RARITY_COLORS[stakedFighter.rarity]}`}>
                          {RARITY_NAMES[stakedFighter.rarity]}
                        </p>
                      )}
                    </div>

                    {/* Image Area */}
                    <div className="aspect-[3/4] relative bg-gray-800">
                      {isStaked ? (
                        <>
                          <FighterImage fighter={stakedFighter} className="w-full h-full" />
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                            <span className="text-green-400 font-bold">{HIT_CHANCES[stakedFighter.rarity]} Hit</span>
                          </div>
                          {/* Energy bar overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-300">Energy</span>
                              <span className="text-yellow-400">{stakedFighter.energy}/{maxEnergy}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className={`h-2 rounded-full ${stakedFighter.energy > 60 ? 'bg-green-500' : stakedFighter.energy > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${(stakedFighter.energy / maxEnergy) * 100}%` }} />
                            </div>
                          </div>
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

                    {/* Actions */}
                    <div className="p-3 space-y-2">
                      {isStaked ? (
                        <>
                          {/* Refuel Progress */}
                          {getRefuelStatus(stakedFighter).status === 'refueling' && (
                            <div className="p-2 bg-yellow-900/30 border border-yellow-500/30 rounded text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400 text-sm font-bold">
                                  {formatTime(getRefuelStatus(stakedFighter).timeRemaining)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-black/30 rounded p-2 text-center">
                              <p className="text-gray-400">PvE</p>
                              <p className="font-bold">{stakedFighter.wins}W-{stakedFighter.losses}L</p>
                            </div>
                            <div className="bg-black/30 rounded p-2 text-center">
                              <p className="text-gray-400">PvP</p>
                              <p className="font-bold">{stakedFighter.pvpWins}W-{stakedFighter.pvpLosses}L</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {canRefuel(stakedFighter) && (
                            <button onClick={() => startRefuel(stakedFighter.tokenId)}
                              disabled={actionLoading === stakedFighter.tokenId || foodBalance < refuelCost}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2 rounded text-sm font-bold">
                              {actionLoading === stakedFighter.tokenId ? 'Starting...' : `Refuel (${refuelCost} FOOD)`}
                            </button>
                          )}

                          {canCompleteRefuel(stakedFighter) && (
                            <button onClick={() => completeRefuel(stakedFighter.tokenId)}
                              disabled={actionLoading === stakedFighter.tokenId}
                              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded text-sm font-bold animate-pulse">
                              {actionLoading === stakedFighter.tokenId ? 'Completing...' : '✅ Complete Refuel'}
                            </button>
                          )}

                          {canUnstake(stakedFighter) && (
                            <button onClick={() => unstakeFighter(stakedFighter.tokenId)}
                              disabled={actionLoading === stakedFighter.tokenId}
                              className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 py-2 rounded text-sm">
                              {actionLoading === stakedFighter.tokenId ? 'Unstaking...' : 'Unstake'}
                            </button>
                          )}

                          {stakedFighter.inBattle && (
                            <div className="w-full bg-red-900/30 border border-red-500 py-2 rounded text-center">
                              <span className="text-red-400 text-sm font-bold">⚔️ In Battle</span>
                            </div>
                          )}

                          {!canUnstake(stakedFighter) && !canRefuel(stakedFighter) && !canCompleteRefuel(stakedFighter) && !stakedFighter.inBattle && stakedFighter.energy > 0 && stakedFighter.energy < maxEnergy && (
                            <p className="text-xs text-gray-500 text-center">{Math.floor(stakedFighter.energy / 20)} battles remaining</p>
                          )}

                          <p className="text-xs text-center text-gray-500">Fighter #{stakedFighter.tokenId}</p>
                        </>
                      ) : (
                        <button
                          onClick={() => { setSelectedClan(clanId); setShowStakeModal(true); }}
                          disabled={availableFighters.length === 0}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded text-sm font-bold">
                          {availableFighters.length === 0 ? 'No Fighters' : `Stake Fighter (${availableFighters.length})`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unstaked Fighters Summary */}
          {Object.values(unstakedByClans).flat().length > 0 && (
            <div className="mt-8 p-4 bg-purple-900/20 border border-purple-800/50 rounded-lg">
              <h3 className="font-bold text-purple-300 mb-2">
                Your Unstaked Fighters ({Object.values(unstakedByClans).flat().length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(unstakedByClans).flat().map(f => (
                  <span key={f.tokenId} className={`px-3 py-1 rounded text-sm ${CLAN_COLORS[f.clan].replace('from-', 'bg-').split(' ')[0]}`}>
                    #{f.tokenId} - {RARITY_NAMES[f.rarity]} {CLAN_NAMES[f.clan]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Stake Modal */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Stake {CLAN_NAMES[selectedClan]} Fighter
                </h2>
                <button onClick={() => setShowStakeModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              {(unstakedByClans[selectedClan] || []).length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">You don't have any {CLAN_NAMES[selectedClan]} Fighters to stake</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(unstakedByClans[selectedClan] || []).map((fighter) => (
                    <div key={fighter.tokenId} className={`bg-gradient-to-br ${CLAN_COLORS[fighter.clan]} p-0.5 rounded-lg`}>
                      <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="aspect-square relative">
                          <FighterImage fighter={fighter} className="w-full h-full" />
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                            <span className={RARITY_COLORS[fighter.rarity]}>{RARITY_NAMES[fighter.rarity]}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-center mb-1">Fighter #{fighter.tokenId}</p>
                          <p className="text-sm text-center text-gray-400 mb-1">{HIT_CHANCES[fighter.rarity]} Hit Chance</p>
                          <p className="text-xs text-center text-gray-500 mb-3">Energy: {fighter.energy}/{maxEnergy}</p>
                          <button onClick={() => stakeFighter(fighter.tokenId)} 
                            disabled={actionLoading === fighter.tokenId}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold">
                            {actionLoading === fighter.tokenId ? (
                              <Loader className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                              'Stake This Fighter'
                            )}
                          </button>
                        </div>
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