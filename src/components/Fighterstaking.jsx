import React, { useState, useEffect } from 'react';
import { Zap, Shield, Swords, Clock, Flame, Droplet, Heart, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  FIGHTER_V4_ADDRESS, 
  FIGHTER_V4_ABI, 
  GAME_BALANCE_V4_ADDRESS,
  GAME_BALANCE_V4_ABI,
  CLAN_NAMES,
  RARITY_NAMES
} from '../contractConfig';

const RARITY_COLORS = {
  0: 'from-orange-600 to-amber-700',
  1: 'from-gray-400 to-slate-300',
  2: 'from-yellow-600 to-amber-500'
};

// Fighter types per clan
const CLAN_FIGHTERS = {
  0: 'Kenshi Champion',
  1: 'Shinobi',
  2: 'Boarding Bruiser',
  3: 'Templar Guard',
  4: 'Enforcer',
  5: 'Knight',
  6: 'Oakwood Guardian'
};

// Base IPFS URL for fighter images
const FIGHTER_IMAGE_BASE = 'https://emerald-adequate-eagle-845.mypinata.cloud/ipfs/bafybeia2alwupvq4ffp6pexcc4ekxz5nmtj4fguk7goxaddd7dcp7w2vbm';

// Get fighter image URL based on rarity and clan
const getFighterImageUrl = (rarity, clan) => {
  const rarityName = RARITY_NAMES[rarity]?.toLowerCase() || 'bronze';
  const clanName = CLAN_NAMES[clan]?.toLowerCase() || 'witkastle';
  return `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.png`;
};

// Get fighter display name
const getFighterDisplayName = (rarity, clan) => {
  const rarityName = RARITY_NAMES[rarity] || 'Bronze';
  const fighterType = CLAN_FIGHTERS[clan] || 'Fighter';
  return `${rarityName} ${fighterType}`;
};

export default function FighterStaking({ connected, walletAddress, provider, signer, onNavigate }) {
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [foodBalance, setFoodBalance] = useState(0);
  const [refuelCost, setRefuelCost] = useState(50);
  const [refuelDuration, setRefuelDuration] = useState(10800); // 3 hours in seconds
  const [maxEnergy, setMaxEnergy] = useState(100);

  useEffect(() => {
    if (connected && provider) {
      loadFighters();
      loadFoodBalance();
      loadRefuelSettings();
    }
  }, [connected, provider, walletAddress]);

  // Auto-refresh every 30 seconds to update refuel timers
  useEffect(() => {
    const interval = setInterval(() => {
      if (connected && provider) {
        loadFighters();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [connected, provider, walletAddress]);

  const loadRefuelSettings = async () => {
    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, provider);
      
      const [cost, duration, energy] = await Promise.all([
        contract.refuelCost(),
        contract.refuelDuration(),
        contract.maxEnergy()
      ]);
      
      setRefuelCost(Number(ethers.formatEther(cost)));
      setRefuelDuration(Number(duration));
      setMaxEnergy(Number(energy));
    } catch (err) {
      console.error('Error loading refuel settings:', err);
    }
  };

  const loadFoodBalance = async () => {
    try {
      // Load from GameBalance V4 (in-game balance)
      const gameBalance = new ethers.Contract(GAME_BALANCE_V4_ADDRESS, GAME_BALANCE_V4_ABI, provider);
      const balance = await gameBalance.getBalance(walletAddress, 1); // Token ID 1 = FOOD
      setFoodBalance(Number(ethers.formatEther(balance)));
    } catch (err) {
      console.error('Error loading FOOD balance:', err);
    }
  };

  const loadFighters = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, provider);
      
      // Get user's fighter count
      const balance = await contract.balanceOf(walletAddress);
      const fighterCount = Number(balance);
      
      console.log(`Loading ${fighterCount} fighters for ${walletAddress}`);
      
      if (fighterCount === 0) {
        setFighters([]);
        setLoading(false);
        return;
      }
      
      // Load all token IDs
      const fighterPromises = [];
      for (let i = 0; i < fighterCount; i++) {
        fighterPromises.push(contract.tokenOfOwnerByIndex(walletAddress, i));
      }
      
      const tokenIds = await Promise.all(fighterPromises);
      console.log('Token IDs:', tokenIds.map(t => Number(t)));
      
      // Load fighter details using getFighterStats for complete data
      const detailPromises = tokenIds.map(async (tokenId) => {
        try {
          // getFighterStats returns all the data we need
          const stats = await contract.getFighterStats(tokenId);
          
          return {
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
            points: Number(stats.points)
          };
        } catch (err) {
          console.error(`Error loading fighter ${tokenId}:`, err);
          // Fallback to basic fighters() call
          const fighter = await contract.fighters(tokenId);
          return {
            tokenId: Number(tokenId),
            rarity: Number(fighter.rarity),
            clan: Number(fighter.clan),
            energy: Number(fighter.energy),
            isStaked: fighter.isStaked,
            inBattle: fighter.inBattle,
            isRefueling: Number(fighter.refuelStartTime) > 0,
            refuelCompleteTime: Number(fighter.refuelStartTime) > 0 
              ? Number(fighter.refuelStartTime) + refuelDuration 
              : 0,
            wins: Number(fighter.wins),
            losses: Number(fighter.losses),
            pvpWins: Number(fighter.pvpWins),
            pvpLosses: Number(fighter.pvpLosses),
            points: 0
          };
        }
      });
      
      const loadedFighters = await Promise.all(detailPromises);
      console.log('Loaded fighters:', loadedFighters);
      setFighters(loadedFighters);
      setError('');
      
    } catch (err) {
      console.error('Error loading fighters:', err);
      setError('Failed to load fighters: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const stakeFighter = async (tokenId) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setActionLoading(tokenId);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      
      const tx = await contract.stake(tokenId);
      await tx.wait();
      
      setSuccess(`Fighter #${tokenId} staked successfully!`);
      await loadFighters();
      
    } catch (err) {
      console.error('Staking error:', err);
      if (err.message?.includes('C') || err.message?.includes('clan')) {
        setError('You already have a fighter from this clan staked. Only one per clan allowed.');
      } else if (err.message?.includes('M') || err.message?.includes('max')) {
        setError('Maximum 7 fighters can be staked at once.');
      } else if (err.message?.includes('S') || err.message?.includes('Staking')) {
        setError('Staking is currently paused.');
      } else {
        setError(err.reason || err.shortMessage || err.message || 'Staking failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const unstakeFighter = async (tokenId) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setActionLoading(tokenId);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      
      const tx = await contract.unstake(tokenId);
      await tx.wait();
      
      setSuccess(`Fighter #${tokenId} unstaked successfully!`);
      await loadFighters();
      
    } catch (err) {
      console.error('Unstaking error:', err);
      if (err.message?.includes('F') || err.message?.includes('energy')) {
        setError('Fighter must have full energy (100) to unstake.');
      } else {
        setError(err.reason || err.shortMessage || err.message || 'Unstaking failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const startRefuel = async (tokenId) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setActionLoading(tokenId);
    setError('');
    setSuccess('');

    try {
      // Check FOOD balance
      if (foodBalance < refuelCost) {
        setError(`Insufficient FOOD! Need ${refuelCost} FOOD to refuel. You have ${foodBalance.toFixed(0)} FOOD.`);
        setActionLoading(null);
        return;
      }

      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      
      // Start refuel - this spends tokens from GameBalance automatically
      const tx = await contract.startRefuel(tokenId);
      await tx.wait();
      
      setSuccess(`Refueling started! Fighter will be ready in ${refuelDuration / 3600} hours.`);
      await loadFighters();
      await loadFoodBalance();
      
    } catch (err) {
      console.error('Refuel error:', err);
      if (err.message?.includes('E') || err.message?.includes('energy')) {
        setError('Fighter must have 0 energy to start refueling.');
      } else {
        setError(err.reason || err.shortMessage || err.message || 'Refuel failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const completeRefuel = async (tokenId) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setActionLoading(tokenId);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      
      const tx = await contract.completeRefuel(tokenId);
      await tx.wait();
      
      setSuccess(`Fighter #${tokenId} refueled! Energy restored to ${maxEnergy}.`);
      await loadFighters();
      
    } catch (err) {
      console.error('Complete refuel error:', err);
      if (err.message?.includes('W') || err.message?.includes('wait')) {
        setError('Refuel is not complete yet. Please wait.');
      } else {
        setError(err.reason || err.shortMessage || err.message || 'Complete refuel failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getRefuelStatus = (fighter) => {
    if (!fighter.isRefueling && fighter.refuelCompleteTime === 0) {
      return { status: 'none', timeRemaining: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    
    if (fighter.refuelCompleteTime <= now) {
      return { status: 'ready', timeRemaining: 0 };
    }

    return { status: 'refueling', timeRemaining: fighter.refuelCompleteTime - now };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getFighterStatus = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    
    if (refuelStatus.status === 'refueling') {
      return { text: 'REFUELING', color: 'text-yellow-400', icon: Clock };
    }
    
    if (refuelStatus.status === 'ready') {
      return { text: 'REFUEL READY', color: 'text-green-400', icon: CheckCircle };
    }
    
    if (fighter.inBattle) {
      return { text: 'IN BATTLE', color: 'text-red-400', icon: Swords };
    }
    
    if (!fighter.isStaked) {
      return { text: 'UNSTAKED', color: 'text-gray-400', icon: Shield };
    }
    
    if (fighter.energy === 0) {
      return { text: 'NO ENERGY', color: 'text-orange-400', icon: Zap };
    }
    
    return { text: 'READY', color: 'text-green-400', icon: CheckCircle };
  };

  const canStake = (fighter) => {
    return !fighter.isStaked && !fighter.isRefueling;
  };

  const canUnstake = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    return fighter.isStaked && 
           !fighter.inBattle && 
           fighter.energy === maxEnergy && 
           refuelStatus.status === 'none';
  };

  const canRefuel = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    return fighter.isStaked && 
           !fighter.inBattle && 
           fighter.energy === 0 && 
           refuelStatus.status === 'none';
  };

  const canCompleteRefuel = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    return refuelStatus.status === 'ready';
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Fighter Staking</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to stake your Fighters</p>
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
        <p className="text-xl text-gray-300 mb-6">
          Stake your Fighters to enable battles and earn rewards
        </p>
        
        {/* User Stats */}
        <div className="inline-flex gap-6 bg-gray-800/50 border border-gray-700 rounded-lg px-8 py-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            <span className="font-bold">{fighters.length} Fighters Owned</span>
          </div>
          <div className="w-px bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="font-bold">{fighters.filter(f => f.isStaked).length} Staked</span>
          </div>
          <div className="w-px bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">{foodBalance.toFixed(0)} FOOD</span>
          </div>
        </div>
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
          <Flame className="w-6 h-6 text-yellow-400" />
          Refuel System
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Cost per Refuel:</p>
            <p className="text-lg font-bold text-yellow-400">{refuelCost} FOOD</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Refuel Duration:</p>
            <p className="text-lg font-bold text-yellow-400">{refuelDuration / 3600} Hours</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Energy Restored:</p>
            <p className="text-lg font-bold text-yellow-400">0 → {maxEnergy}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          ⚡ Each battle costs 20 energy • Cannot unstake until {maxEnergy} energy • Cannot refuel until 0 energy
        </p>
      </div>

      {/* Fighters Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your Fighters...</p>
        </div>
      ) : fighters.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-lg border border-gray-700">
          <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">No Fighters Yet</h3>
          <p className="text-gray-400 mb-6">Mint your first Fighter to start your journey!</p>
          <button
            onClick={() => onNavigate && onNavigate('mint-fighter')}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-bold transition"
          >
            Mint Fighters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fighters.map((fighter) => {
            const status = getFighterStatus(fighter);
            const StatusIcon = status.icon;
            const refuelStatus = getRefuelStatus(fighter);
            
            return (
              <div
                key={fighter.tokenId}
                className={`bg-gradient-to-br ${RARITY_COLORS[fighter.rarity]} p-0.5 rounded-xl`}
              >
                <div className="bg-gray-900 rounded-xl p-6">
                  {/* Fighter Image */}
                  <div className="w-full h-40 bg-gray-800 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={getFighterImageUrl(fighter.rarity, fighter.clan)} 
                      alt={getFighterDisplayName(fighter.rarity, fighter.clan)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/fighter_placeholder.png';
                      }}
                    />
                  </div>
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{getFighterDisplayName(fighter.rarity, fighter.clan)}</h3>
                      <p className="text-sm text-gray-400">
                        #{fighter.tokenId} • {CLAN_NAMES[fighter.clan]}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{status.text}</span>
                    </div>
                  </div>

                  {/* Energy Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Energy:</span>
                      <span className="font-bold text-yellow-400">{fighter.energy}/{maxEnergy}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          fighter.energy > 60 ? 'bg-green-500' :
                          fighter.energy > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(fighter.energy / maxEnergy) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor(fighter.energy / 20)} battles remaining
                    </p>
                  </div>

                  {/* Refuel Progress */}
                  {refuelStatus.status === 'refueling' && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-yellow-400 font-bold">Refueling...</span>
                        <span className="text-yellow-400">{formatTime(refuelStatus.timeRemaining)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${((refuelDuration - refuelStatus.timeRemaining) / refuelDuration) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-xs text-gray-400">PvE Record</p>
                      <p className="text-sm font-bold">{fighter.wins}W - {fighter.losses}L</p>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-xs text-gray-400">PvP Record</p>
                      <p className="text-sm font-bold">{fighter.pvpWins}W - {fighter.pvpLosses}L</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {!fighter.isStaked && canStake(fighter) && (
                      <button
                        onClick={() => stakeFighter(fighter.tokenId)}
                        disabled={actionLoading === fighter.tokenId}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition"
                      >
                        {actionLoading === fighter.tokenId ? 'Staking...' : 'Stake Fighter'}
                      </button>
                    )}

                    {fighter.isStaked && canUnstake(fighter) && (
                      <button
                        onClick={() => unstakeFighter(fighter.tokenId)}
                        disabled={actionLoading === fighter.tokenId}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition"
                      >
                        {actionLoading === fighter.tokenId ? 'Unstaking...' : 'Unstake Fighter'}
                      </button>
                    )}

                    {canRefuel(fighter) && (
                      <button
                        onClick={() => startRefuel(fighter.tokenId)}
                        disabled={actionLoading === fighter.tokenId || foodBalance < refuelCost}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition"
                      >
                        {actionLoading === fighter.tokenId ? 'Starting...' : `Refuel (${refuelCost} FOOD)`}
                      </button>
                    )}

                    {canCompleteRefuel(fighter) && (
                      <button
                        onClick={() => completeRefuel(fighter.tokenId)}
                        disabled={actionLoading === fighter.tokenId}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition animate-pulse"
                      >
                        {actionLoading === fighter.tokenId ? 'Completing...' : 'Complete Refuel'}
                      </button>
                    )}

                    {fighter.inBattle && (
                      <div className="w-full bg-red-900/30 border border-red-500 py-2 rounded-lg text-center">
                        <p className="text-red-400 font-bold text-sm">In Active Battle</p>
                      </div>
                    )}

                    {!canStake(fighter) && !canUnstake(fighter) && !canRefuel(fighter) && !canCompleteRefuel(fighter) && !fighter.inBattle && fighter.energy < maxEnergy && fighter.energy > 0 && (
                      <div className="w-full bg-gray-800/50 border border-gray-600 py-2 rounded-lg text-center">
                        <p className="text-gray-400 text-sm">Energy must reach 0 to refuel</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}