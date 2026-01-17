import React, { useState, useEffect } from 'react';
import { Zap, Shield, Swords, Clock, Flame, Droplet, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  FIGHTER_V4_ADDRESS, 
  GAME_BALANCE_V4_ADDRESS,
  GAME_BALANCE_V4_ABI,
  CLAN_NAMES,
  RARITY_NAMES
} from '../contractConfig';

// ============================================
// COMPLETE FIGHTER V4 ABI
// ============================================
const FIGHTER_V4_ABI_COMPLETE = [
  // ERC721 Standard
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  
  // ERC721Enumerable
  "function totalSupply() view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  
  // Fighter V4 specific
  "function fighters(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, bool isStaked, bool inBattle, uint256 refuelStartTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses)",
  "function getFighterStats(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, bool isStaked, bool inBattle, bool isRefueling, uint256 refuelCompleteTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses, uint256 points)",
  
  // Staking functions
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  "function stakedFighters(address owner) view returns (uint256[])",
  "function getStakedFighters(address owner) view returns (uint256[])",
  
  // Refuel functions
  "function startRefuel(uint256 tokenId)",
  "function completeRefuel(uint256 tokenId)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event FighterMinted(uint256 indexed tokenId, address indexed minter, uint8 rarity, uint8 clan)"
];

const RARITY_COLORS = {
  0: 'from-orange-600 to-amber-700',
  1: 'from-gray-400 to-slate-300',
  2: 'from-yellow-600 to-amber-500'
};

const CLAN_FIGHTERS = {
  0: 'Kenshi Champion',
  1: 'Shinobi',
  2: 'Boarding Bruiser',
  3: 'Templar Guard',
  4: 'Enforcer',
  5: 'Knight',
  6: 'Oakwood Guardian'
};

const FIGHTER_IMAGE_BASE = 'https://emerald-adequate-eagle-845.mypinata.cloud/ipfs/bafybeia2alwupvq4ffp6pexcc4ekxz5nmtj4fguk7goxaddd7dcp7w2vbm';

const getFighterImageUrl = (rarity, clan) => {
  const rarityName = RARITY_NAMES[rarity]?.toLowerCase() || 'bronze';
  const clanName = CLAN_NAMES[clan]?.toLowerCase() || 'witkastle';
  return `${FIGHTER_IMAGE_BASE}/${rarityName}_${clanName}.jpg`;
};

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
  const [debugInfo, setDebugInfo] = useState('');
  
  const refuelCost = 50;
  const refuelDuration = 10800;
  const maxEnergy = 100;

  useEffect(() => {
    if (connected && walletAddress) {
      loadFighters();
      loadFoodBalance();
    } else {
      setLoading(false);
    }
  }, [connected, walletAddress]);

  useEffect(() => {
    if (!connected || !walletAddress) return;
    const interval = setInterval(loadFighters, 30000);
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

  const loadFighters = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Starting to load fighters...');
      
      const rpcProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI_COMPLETE, rpcProvider);
      
      console.log('Fighter V4 Address:', FIGHTER_V4_ADDRESS);
      console.log('Loading fighters for wallet:', walletAddress);
      
      // Step 1: Get balance
      let balance;
      try {
        balance = await contract.balanceOf(walletAddress);
        console.log('Balance result:', balance.toString());
        setDebugInfo(`Balance: ${balance.toString()}`);
      } catch (balanceErr) {
        console.error('balanceOf failed:', balanceErr);
        setError('Could not read fighter balance: ' + balanceErr.message);
        setLoading(false);
        return;
      }
      
      const fighterCount = Number(balance);
      console.log(`User owns ${fighterCount} fighters`);
      
      if (fighterCount === 0) {
        setFighters([]);
        setDebugInfo('No fighters found for this wallet');
        setLoading(false);
        return;
      }
      
      // Step 2: Try to get token IDs
      const tokenIds = [];
      
      // Method 1: Try tokenOfOwnerByIndex (ERC721Enumerable)
      let enumerable = true;
      try {
        for (let i = 0; i < fighterCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId);
          console.log(`Token at index ${i}: ${tokenId.toString()}`);
        }
        setDebugInfo(`Found ${tokenIds.length} fighters via enumerable`);
      } catch (enumErr) {
        console.warn('tokenOfOwnerByIndex failed:', enumErr.message);
        enumerable = false;
        setDebugInfo('Enumerable failed, trying Transfer events...');
      }
      
      // Method 2: Fallback to Transfer events
      if (!enumerable || tokenIds.length === 0) {
        try {
          console.log('Trying Transfer event fallback...');
          const filter = contract.filters.Transfer(null, walletAddress);
          const events = await contract.queryFilter(filter, 0, 'latest');
          const potentialIds = [...new Set(events.map(e => e.args.tokenId.toString()))];
          console.log('Potential token IDs from events:', potentialIds);
          
          for (const tokenIdStr of potentialIds) {
            try {
              const owner = await contract.ownerOf(tokenIdStr);
              if (owner.toLowerCase() === walletAddress.toLowerCase()) {
                tokenIds.push(BigInt(tokenIdStr));
                console.log(`Confirmed ownership of token ${tokenIdStr}`);
              }
            } catch (e) {
              // Token doesn't exist or was transferred
            }
          }
          setDebugInfo(`Found ${tokenIds.length} fighters via events`);
        } catch (eventErr) {
          console.error('Transfer event fallback failed:', eventErr);
        }
      }
      
      // Method 3: Brute force search if all else fails
      if (tokenIds.length === 0 && fighterCount > 0) {
        console.log('Trying brute force search...');
        setDebugInfo('Trying brute force search...');
        
        try {
          const totalSupply = await contract.totalSupply();
          const total = Number(totalSupply);
          console.log('Total supply:', total);
          
          for (let i = 1; i <= Math.min(total, 100); i++) {
            try {
              const owner = await contract.ownerOf(i);
              if (owner.toLowerCase() === walletAddress.toLowerCase()) {
                tokenIds.push(BigInt(i));
                console.log(`Found token ${i} via brute force`);
                if (tokenIds.length >= fighterCount) break;
              }
            } catch (e) {
              // Token doesn't exist
            }
          }
          setDebugInfo(`Found ${tokenIds.length} fighters via brute force`);
        } catch (bruteErr) {
          console.error('Brute force failed:', bruteErr);
        }
      }
      
      console.log('Final token IDs:', tokenIds.map(t => t.toString()));
      
      if (tokenIds.length === 0) {
        setError(`Found ${fighterCount} fighters in balance but could not enumerate them. The contract may not support ERC721Enumerable.`);
        setFighters([]);
        setLoading(false);
        return;
      }
      
      // Step 3: Load fighter details
      const loadedFighters = [];
      for (const tokenId of tokenIds) {
        try {
          // Try getFighterStats first
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
              points: Number(stats.points || 0)
            };
          } catch {
            // Fallback to fighters mapping
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
                ? Number(fighter.refuelStartTime) + refuelDuration 
                : 0,
              wins: Number(fighter.wins),
              losses: Number(fighter.losses),
              pvpWins: Number(fighter.pvpWins),
              pvpLosses: Number(fighter.pvpLosses),
              points: 0
            };
          }
          
          console.log(`Loaded fighter #${tokenId}:`, fighterData);
          loadedFighters.push(fighterData);
        } catch (err) {
          console.warn(`Error loading fighter ${tokenId}:`, err.message);
        }
      }
      
      console.log('All loaded fighters:', loadedFighters);
      setFighters(loadedFighters);
      setDebugInfo(`Loaded ${loadedFighters.length} fighters successfully`);
      
    } catch (err) {
      console.error('Error loading fighters:', err);
      setError('Failed to load fighters: ' + err.message);
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
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI_COMPLETE, signer);
      const tx = await contract.stake(tokenId);
      await tx.wait();
      setSuccess(`Fighter #${tokenId} staked successfully!`);
      await loadFighters();
    } catch (err) {
      console.error('Staking error:', err);
      setError(err.reason || err.shortMessage || err.message || 'Staking failed');
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
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI_COMPLETE, signer);
      const tx = await contract.unstake(tokenId);
      await tx.wait();
      setSuccess(`Fighter #${tokenId} unstaked successfully!`);
      await loadFighters();
    } catch (err) {
      console.error('Unstaking error:', err);
      setError(err.reason || err.shortMessage || err.message || 'Unstaking failed');
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
      if (foodBalance < refuelCost) {
        setError(`Insufficient FOOD! Need ${refuelCost} FOOD. You have ${foodBalance.toFixed(0)} FOOD.`);
        setActionLoading(null);
        return;
      }

      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI_COMPLETE, signer);
      const tx = await contract.startRefuel(tokenId);
      await tx.wait();
      setSuccess(`Refueling started! Ready in ${refuelDuration / 3600} hours.`);
      await loadFighters();
      await loadFoodBalance();
    } catch (err) {
      console.error('Refuel error:', err);
      setError(err.reason || err.shortMessage || err.message || 'Refuel failed');
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
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI_COMPLETE, signer);
      const tx = await contract.completeRefuel(tokenId);
      await tx.wait();
      setSuccess(`Fighter #${tokenId} refueled! Energy restored.`);
      await loadFighters();
    } catch (err) {
      console.error('Complete refuel error:', err);
      setError(err.reason || err.shortMessage || err.message || 'Complete refuel failed');
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
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getFighterStatus = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    if (refuelStatus.status === 'refueling') return { text: 'REFUELING', color: 'text-yellow-400', icon: Clock };
    if (refuelStatus.status === 'ready') return { text: 'REFUEL READY', color: 'text-green-400', icon: CheckCircle };
    if (fighter.inBattle) return { text: 'IN BATTLE', color: 'text-red-400', icon: Swords };
    if (!fighter.isStaked) return { text: 'UNSTAKED', color: 'text-gray-400', icon: Shield };
    if (fighter.energy === 0) return { text: 'NO ENERGY', color: 'text-orange-400', icon: Zap };
    return { text: 'READY', color: 'text-green-400', icon: CheckCircle };
  };

  const canStake = (fighter) => !fighter.isStaked && !fighter.isRefueling;
  const canUnstake = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    return fighter.isStaked && !fighter.inBattle && fighter.energy === maxEnergy && refuelStatus.status === 'none';
  };
  const canRefuel = (fighter) => {
    const refuelStatus = getRefuelStatus(fighter);
    return fighter.isStaked && !fighter.inBattle && fighter.energy === 0 && refuelStatus.status === 'none';
  };
  const canCompleteRefuel = (fighter) => getRefuelStatus(fighter).status === 'ready';

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
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
          Fighter Staking
        </h1>
        <p className="text-xl text-gray-300 mb-6">Stake your Fighters to enable battles and earn rewards</p>
        
        <div className="inline-flex gap-6 bg-gray-800/50 border border-gray-700 rounded-lg px-8 py-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            <span className="font-bold">{fighters.length} Fighters</span>
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
        
        {/* Debug info */}
        {debugInfo && (
          <p className="text-xs text-gray-600 mt-2">{debugInfo}</p>
        )}
      </div>

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
      </div>

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
              <div key={fighter.tokenId} className={`bg-gradient-to-br ${RARITY_COLORS[fighter.rarity]} p-0.5 rounded-xl`}>
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="w-full h-40 bg-gray-800 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={getFighterImageUrl(fighter.rarity, fighter.clan)} 
                      alt={getFighterDisplayName(fighter.rarity, fighter.clan)}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{getFighterDisplayName(fighter.rarity, fighter.clan)}</h3>
                      <p className="text-sm text-gray-400">#{fighter.tokenId} • {CLAN_NAMES[fighter.clan]}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{status.text}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Energy:</span>
                      <span className="font-bold text-yellow-400">{fighter.energy}/{maxEnergy}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          fighter.energy > 60 ? 'bg-green-500' : fighter.energy > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(fighter.energy / maxEnergy) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{Math.floor(fighter.energy / 20)} battles remaining</p>
                  </div>

                  {refuelStatus.status === 'refueling' && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-yellow-400 font-bold">Refueling...</span>
                        <span className="text-yellow-400">{formatTime(refuelStatus.timeRemaining)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${((refuelDuration - refuelStatus.timeRemaining) / refuelDuration) * 100}%` }} />
                      </div>
                    </div>
                  )}

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

                  <div className="space-y-2">
                    {canStake(fighter) && (
                      <button onClick={() => stakeFighter(fighter.tokenId)} disabled={actionLoading === fighter.tokenId}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition">
                        {actionLoading === fighter.tokenId ? 'Staking...' : 'Stake Fighter'}
                      </button>
                    )}
                    {canUnstake(fighter) && (
                      <button onClick={() => unstakeFighter(fighter.tokenId)} disabled={actionLoading === fighter.tokenId}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition">
                        {actionLoading === fighter.tokenId ? 'Unstaking...' : 'Unstake Fighter'}
                      </button>
                    )}
                    {canRefuel(fighter) && (
                      <button onClick={() => startRefuel(fighter.tokenId)} disabled={actionLoading === fighter.tokenId || foodBalance < refuelCost}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition">
                        {actionLoading === fighter.tokenId ? 'Starting...' : `Refuel (${refuelCost} FOOD)`}
                      </button>
                    )}
                    {canCompleteRefuel(fighter) && (
                      <button onClick={() => completeRefuel(fighter.tokenId)} disabled={actionLoading === fighter.tokenId}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded-lg font-bold transition animate-pulse">
                        {actionLoading === fighter.tokenId ? 'Completing...' : 'Complete Refuel'}
                      </button>
                    )}
                    {fighter.inBattle && (
                      <div className="w-full bg-red-900/30 border border-red-500 py-2 rounded-lg text-center">
                        <p className="text-red-400 font-bold text-sm">In Active Battle</p>
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