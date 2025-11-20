import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords, Lock, Unlock, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { HERALD_CONTRACT_ADDRESS, HERALD_ABI, BASE_MAINNET_CONFIG } from './contractConfig';

const CLANS = [
  { id: 0, name: 'Smizfume', color: 'from-red-600 to-orange-500', icon: Flame },
  { id: 1, name: 'Coalheart', color: 'from-gray-600 to-slate-400', icon: Shield },
  { id: 2, name: 'Warmdice', color: 'from-purple-600 to-indigo-500', icon: Crown },
  { id: 3, name: 'Bervation', color: 'from-blue-600 to-cyan-500', icon: Swords },
  { id: 4, name: 'Konfisof', color: 'from-green-600 to-emerald-500', icon: Shield },
  { id: 5, name: 'Witkastle', color: 'from-yellow-500 to-amber-400', icon: Crown },
  { id: 6, name: 'Bowkin', color: 'from-rose-600 to-red-700', icon: Flame }
];

const FOOD_PRODUCTION = {
  'Bronze': 20,
  'Silver': 65,
  'Gold': 100
};

export default function StakingPage({ onNavigate }) {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownedHeralds, setOwnedHeralds] = useState([]);
  const [stakedSlots, setStakedSlots] = useState({
    0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null
  });
  const [foodBalance, setFoodBalance] = useState(0);
  const [goldBalance, setGoldBalance] = useState(1000); // Placeholder
  const [selectedHerald, setSelectedHerald] = useState(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [targetClan, setTargetClan] = useState(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (connected) {
      loadUserHeralds();
      loadStakedHeralds();
    }
  }, [connected]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setConnected(true);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== BASE_MAINNET_CONFIG.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_MAINNET_CONFIG.chainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BASE_MAINNET_CONFIG],
            });
          }
        }
      }
      
      setWalletAddress(accounts[0]);
      setConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const loadUserHeralds = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, provider);
      
      // Get user's balance
      const balance = await contract.balanceOf(walletAddress);
      const totalHeralds = Number(balance);
      
      // Load each Herald's data
      const heralds = [];
      for (let i = 0; i < totalHeralds; i++) {
        try {
          // This would need tokenOfOwnerByIndex function in contract
          // For now, we'll use a simpler approach checking token IDs
          const totalSupply = await contract.totalSupply();
          
          for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
            try {
              const owner = await contract.ownerOf(tokenId);
              if (owner.toLowerCase() === walletAddress.toLowerCase()) {
                const heraldData = await contract.getHerald(tokenId);
                heralds.push({
                  tokenId: tokenId,
                  rarity: ['Bronze', 'Silver', 'Gold'][heraldData[0]],
                  clan: Number(heraldData[1]),
                  mintedAt: Number(heraldData[2])
                });
              }
            } catch (e) {
              // Token doesn't exist or error, skip
            }
          }
        } catch (error) {
          console.error('Error loading herald:', error);
        }
      }
      
      setOwnedHeralds(heralds);
    } catch (error) {
      console.error('Error loading user Heralds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStakedHeralds = () => {
    // Load staked data from localStorage or contract
    // For now, using localStorage
    try {
      const saved = localStorage.getItem(`staked-${walletAddress}`);
      if (saved) {
        setStakedSlots(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading staked Heralds:', error);
    }
  };

  const saveStakedHeralds = (newSlots) => {
    try {
      localStorage.setItem(`staked-${walletAddress}`, JSON.stringify(newSlots));
    } catch (error) {
      console.error('Error saving staked Heralds:', error);
    }
  };

  const openStakeModal = (clanId) => {
    // Find unstaked Heralds from this clan
    const availableHeralds = ownedHeralds.filter(h => {
      const alreadyStaked = Object.values(stakedSlots).some(s => s && s.tokenId === h.tokenId);
      return h.clan === clanId && !alreadyStaked;
    });
    
    if (availableHeralds.length === 0) {
      alert(`You don't have any unstaked ${CLANS[clanId].name} Heralds!`);
      return;
    }
    
    setTargetClan(clanId);
    setShowStakeModal(true);
  };

  const stakeHerald = (herald) => {
    const newSlots = { ...stakedSlots };
    newSlots[herald.clan] = {
      ...herald,
      stakedAt: Date.now(),
      lastClaim: Date.now()
    };
    
    setStakedSlots(newSlots);
    saveStakedHeralds(newSlots);
    setShowStakeModal(false);
    setSelectedHerald(null);
  };

  const unstakeHerald = (clanId) => {
    if (!window.confirm('Are you sure you want to unstake this Herald? You will lose any unclaimed rewards!')) {
      return;
    }
    
    const newSlots = { ...stakedSlots };
    newSlots[clanId] = null;
    
    setStakedSlots(newSlots);
    saveStakedHeralds(newSlots);
  };

  const canClaim = (stakedHerald) => {
    if (!stakedHerald || !stakedHerald.lastClaim) return false;
    const hoursSinceClaim = (Date.now() - stakedHerald.lastClaim) / (1000 * 60 * 60);
    return hoursSinceClaim >= 24;
  };

  const getTimeUntilClaim = (stakedHerald) => {
    if (!stakedHerald || !stakedHerald.lastClaim) return '--:--';
    
    const nextClaimTime = stakedHerald.lastClaim + (24 * 60 * 60 * 1000);
    const timeRemaining = nextClaimTime - Date.now();
    
    if (timeRemaining <= 0) return 'Ready!';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const claimRewards = (clanId) => {
    const stakedHerald = stakedSlots[clanId];
    if (!canClaim(stakedHerald)) {
      alert('Not ready to claim yet!');
      return;
    }
    
    // Check if user has enough GOLD (5 GOLD to claim)
    if (goldBalance < 5) {
      alert('Not enough $KINGSGOLD! You need 5 GOLD to claim rewards.');
      return;
    }
    
    const foodReward = FOOD_PRODUCTION[stakedHerald.rarity];
    
    // Update balances
    setFoodBalance(prev => prev + foodReward);
    setGoldBalance(prev => prev - 5);
    
    // Update last claim time
    const newSlots = { ...stakedSlots };
    newSlots[clanId] = { ...stakedHerald, lastClaim: Date.now() };
    setStakedSlots(newSlots);
    saveStakedHeralds(newSlots);
    
    alert(`Claimed ${foodReward} $KINGSFOOD! (-5 $KINGSGOLD fee)`);
  };

  const getTotalDailyProduction = () => {
    return Object.values(stakedSlots).reduce((total, slot) => {
      if (slot && slot.rarity) {
        return total + FOOD_PRODUCTION[slot.rarity];
      }
      return total;
    }, 0);
  };

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'Gold': return 'text-yellow-400 border-yellow-400';
      case 'Silver': return 'text-gray-300 border-gray-300';
      case 'Bronze': return 'text-orange-400 border-orange-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet to Stake</h2>
          <p className="text-gray-400 mb-6">Stake your Heralds to earn $KINGSFOOD</p>
          <button
            onClick={connectWallet}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition text-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-red-800/50 bg-black/40 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-red-500" />
              <button 
                onClick={() => onNavigate && onNavigate('home')}
                className="hover:opacity-80 transition text-left"
              >
                <h1 className="text-2xl font-bold">KINGS OF RED</h1>
                <p className="text-sm text-gray-400">Herald Staking</p>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/30">
                <Coins className="w-5 h-5 text-green-400" />
                <span className="font-bold">{foodBalance.toFixed(0)}</span>
                <span className="text-sm text-gray-400">FOOD</span>
              </div>
              
              <div className="flex items-center gap-2 bg-yellow-900/30 px-4 py-2 rounded-lg border border-yellow-500/30">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-bold">{goldBalance.toFixed(0)}</span>
                <span className="text-sm text-gray-400">GOLD</span>
              </div>
              
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <span className="text-sm text-gray-400">Connected:</span>
                <span className="ml-2 font-mono text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-bold">Heralds Owned</h3>
            </div>
            <p className="text-3xl font-bold">{ownedHeralds.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold">Currently Staked</h3>
            </div>
            <p className="text-3xl font-bold">{Object.values(stakedSlots).filter(s => s !== null).length} / 7</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold">Daily Production</h3>
            </div>
            <p className="text-3xl font-bold">{getTotalDailyProduction()} FOOD</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold mb-1">Herald Staking Rules:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>You can stake ONE Herald per clan (max 7 total)</li>
              <li>Claiming rewards requires 5 $KINGSGOLD per claim</li>
              <li>Rewards are claimable every 24 hours</li>
              <li>Unstaking forfeits any unclaimed rewards</li>
            </ul>
          </div>
        </div>

        {/* Staking Slots - 7 Clans */}
        <h2 className="text-2xl font-bold mb-6">Staking Slots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CLANS.map(clan => {
            const ClanIcon = clan.icon;
            const stakedHerald = stakedSlots[clan.id];
            const isStaked = stakedHerald !== null;
            const claimable = canClaim(stakedHerald);
            const timeUntilClaim = getTimeUntilClaim(stakedHerald);
            
            return (
              <div
                key={clan.id}
                className={`bg-gradient-to-br ${clan.color} p-0.5 rounded-xl`}
              >
                <div className="bg-gray-900 rounded-xl p-6 h-full">
                  {/* Clan Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ClanIcon className="w-6 h-6" />
                      <h3 className="text-lg font-bold">{clan.name}</h3>
                    </div>
                    {isStaked ? (
                      <Lock className="w-5 h-5 text-green-400" />
                    ) : (
                      <Unlock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  
                  {isStaked ? (
                    <>
                      {/* Staked Herald Info */}
                      <div className="bg-black/30 rounded-lg p-4 mb-4">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getRarityColor(stakedHerald.rarity)}`}>
                          {stakedHerald.rarity}
                        </div>
                        <p className="text-sm text-gray-400">Token #{stakedHerald.tokenId}</p>
                        <p className="text-lg font-bold mt-2">
                          +{FOOD_PRODUCTION[stakedHerald.rarity]} FOOD/day
                        </p>
                      </div>
                      
                      {/* Claim Timer */}
                      <div className="bg-black/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                          <Clock className="w-4 h-4" />
                          <span>Next claim:</span>
                        </div>
                        <p className={`font-bold ${claimable ? 'text-green-400' : 'text-yellow-400'}`}>
                          {timeUntilClaim}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => claimRewards(clan.id)}
                          disabled={!claimable}
                          className={`flex-1 py-2 rounded-lg font-semibold transition text-sm ${
                            claimable
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-gray-700 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Claim
                        </button>
                        <button
                          onClick={() => unstakeHerald(clan.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold transition text-sm"
                        >
                          Unstake
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Empty Slot */}
                      <div className="bg-black/30 rounded-lg p-8 mb-4 flex items-center justify-center border-2 border-dashed border-gray-600">
                        <p className="text-gray-500 text-center">
                          No Herald<br />Staked
                        </p>
                      </div>
                      
                      <button
                        onClick={() => openStakeModal(clan.id)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-2 rounded-lg font-semibold transition"
                      >
                        Stake Herald
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stake Selection Modal */}
      {showStakeModal && targetClan !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full border border-green-500/50 max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Select {CLANS[targetClan].name} Herald to Stake</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {ownedHeralds
                .filter(h => h.clan === targetClan && !Object.values(stakedSlots).some(s => s && s.tokenId === h.tokenId))
                .map(herald => (
                  <div
                    key={herald.tokenId}
                    onClick={() => stakeHerald(herald)}
                    className={`bg-gradient-to-br ${CLANS[herald.clan].color} p-0.5 rounded-lg cursor-pointer hover:scale-105 transition`}
                  >
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getRarityColor(herald.rarity)}`}>
                        {herald.rarity}
                      </div>
                      <p className="text-sm text-gray-400">Token #{herald.tokenId}</p>
                      <p className="text-lg font-bold mt-2">
                        +{FOOD_PRODUCTION[herald.rarity]} FOOD/day
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            
            <button
              onClick={() => {
                setShowStakeModal(false);
                setTargetClan(null);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Kings of Red © 2025 • Built on Base Network</p>
          </div>
        </div>
      </div>
    </div>
  );
}