import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords } from 'lucide-react';

// PLACEHOLDER VALUES - Customize these
const HERALD_CONFIG = {
  BRONZE_FOOD_PER_DAY: 50,
  SILVER_FOOD_PER_DAY: 100,
  GOLD_FOOD_PER_DAY: 200,
  CLAIM_COOLDOWN_HOURS: 24,
  CLAIMING_FEE_ENABLED: false,
  CLAIMING_FEE_AMOUNT: 0
};

const CLANS = [
  { id: 1, name: 'Smizfume', color: 'from-red-600 to-orange-500', icon: Flame },
  { id: 2, name: 'Genin', color: 'from-gray-600 to-slate-400', icon: Shield },
  { id: 3, name: 'Warmdice', color: 'from-purple-600 to-indigo-500', icon: Crown },
  { id: 4, name: 'Bervation', color: 'from-blue-600 to-cyan-500', icon: Swords },
  { id: 5, name: 'Konfisof', color: 'from-green-600 to-emerald-500', icon: Shield },
  { id: 6, name: 'Witkastle', color: 'from-yellow-500 to-amber-400', icon: Crown },
  { id: 7, name: 'Bowkin', color: 'from-rose-600 to-red-700', icon: Flame }
];

const MOCK_HERALDS = [
  { id: 1, clan: 1, rarity: 'Gold', tokenId: '1001', staked: false },
  { id: 2, clan: 2, rarity: 'Silver', tokenId: '1002', staked: false },
  { id: 3, clan: 3, rarity: 'Bronze', tokenId: '1003', staked: false },
  { id: 4, clan: 4, rarity: 'Silver', tokenId: '1004', staked: false },
  { id: 5, clan: 5, rarity: 'Bronze', tokenId: '1005', staked: false },
  { id: 6, clan: 6, rarity: 'Gold', tokenId: '1006', staked: false },
  { id: 7, clan: 7, rarity: 'Silver', tokenId: '1007', staked: false }
];

export default function App() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [heralds, setHeralds] = useState([]);
  const [foodBalance, setFoodBalance] = useState(0);
  const [selectedTab, setSelectedTab] = useState('unstaked');
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      const heraldsData = await window.storage.get('heralds-state');
      const balanceData = await window.storage.get('food-balance');
      
      if (heraldsData) {
        setHeralds(JSON.parse(heraldsData.value));
      } else {
        setHeralds(MOCK_HERALDS);
      }
      
      if (balanceData) {
        setFoodBalance(parseFloat(balanceData.value));
      }
    } catch (error) {
      setHeralds(MOCK_HERALDS);
      setFoodBalance(0);
    }
  };

  const saveGameData = async (newHeralds, newBalance) => {
    try {
      await window.storage.set('heralds-state', JSON.stringify(newHeralds));
      await window.storage.set('food-balance', newBalance.toString());
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  };

  const connectWallet = () => {
    const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
    setWalletAddress(mockAddress);
    setConnected(true);
  };

  const stakeHerald = (heraldId) => {
    const updatedHeralds = heralds.map(h => {
      if (h.id === heraldId) {
        return {
          ...h,
          staked: true,
          stakedAt: Date.now(),
          lastClaim: Date.now()
        };
      }
      return h;
    });
    setHeralds(updatedHeralds);
    saveGameData(updatedHeralds, foodBalance);
  };

  const unstakeHerald = (heraldId) => {
    const updatedHeralds = heralds.map(h => {
      if (h.id === heraldId) {
        const { stakedAt, lastClaim, ...rest } = h;
        return { ...rest, staked: false };
      }
      return h;
    });
    setHeralds(updatedHeralds);
    saveGameData(updatedHeralds, foodBalance);
  };

  const canClaim = (herald) => {
    if (!herald.staked || !herald.lastClaim) return false;
    const timeSinceLastClaim = Date.now() - herald.lastClaim;
    const cooldownMs = HERALD_CONFIG.CLAIM_COOLDOWN_HOURS * 60 * 60 * 1000;
    return timeSinceLastClaim >= cooldownMs;
  };

  const getTimeUntilClaim = (herald) => {
    if (!herald.staked || !herald.lastClaim) return null;
    const cooldownMs = HERALD_CONFIG.CLAIM_COOLDOWN_HOURS * 60 * 60 * 1000;
    const timeSinceLastClaim = Date.now() - herald.lastClaim;
    const timeRemaining = cooldownMs - timeSinceLastClaim;
    
    if (timeRemaining <= 0) return 'Ready to claim!';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const claimRewards = (herald) => {
    if (!canClaim(herald)) return;
    
    const foodAmount = 
      herald.rarity === 'Gold' ? HERALD_CONFIG.GOLD_FOOD_PER_DAY :
      herald.rarity === 'Silver' ? HERALD_CONFIG.SILVER_FOOD_PER_DAY :
      HERALD_CONFIG.BRONZE_FOOD_PER_DAY;
    
    const updatedHeralds = heralds.map(h => {
      if (h.id === herald.id) {
        return { ...h, lastClaim: Date.now() };
      }
      return h;
    });
    
    const newBalance = foodBalance + foodAmount;
    setHeralds(updatedHeralds);
    setFoodBalance(newBalance);
    saveGameData(updatedHeralds, newBalance);
  };

  const getClan = (clanId) => CLANS.find(c => c.id === clanId);

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'Gold': return 'text-yellow-400 border-yellow-400';
      case 'Silver': return 'text-gray-300 border-gray-300';
      case 'Bronze': return 'text-orange-400 border-orange-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const stakedHeralds = heralds.filter(h => h.staked);
  const unstakedHeralds = heralds.filter(h => !h.staked);

  const renderHomePage = () => (
    <div className="text-center py-12">
      <Crown className="w-24 h-24 mx-auto mb-6 text-red-500" />
      <h2 className="text-4xl font-bold mb-4">Welcome to Kings of Red</h2>
      <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
        A collectible trading card game featuring token mining, epic battles, and seven legendary clans.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
        {CLANS.map(clan => {
          const ClanIcon = clan.icon;
          return (
            <div
              key={clan.id}
              className={`bg-gradient-to-br ${clan.color} p-0.5 rounded-xl`}
            >
              <div className="bg-gray-900 rounded-xl p-6 h-full">
                <ClanIcon className="w-12 h-12 mx-auto mb-3 opacity-70" />
                <h3 className="text-xl font-bold text-center">{clan.name}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-8 max-w-3xl mx-auto mb-8">
        <h3 className="text-2xl font-bold mb-4">Phase 1: Herald Launch</h3>
        <p className="text-gray-300 mb-4">
          Begin your journey by collecting Herald NFTs. Each Herald acts as a miner, producing $KINGSFOOD tokens every 24 hours.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <div className="bg-black/50 px-6 py-3 rounded-lg">
            <div className="text-sm text-gray-400">Bronze Herald</div>
            <div className="text-xl font-bold text-orange-400">{HERALD_CONFIG.BRONZE_FOOD_PER_DAY} FOOD/day</div>
          </div>
          <div className="bg-black/50 px-6 py-3 rounded-lg">
            <div className="text-sm text-gray-400">Silver Herald</div>
            <div className="text-xl font-bold text-gray-300">{HERALD_CONFIG.SILVER_FOOD_PER_DAY} FOOD/day</div>
          </div>
          <div className="bg-black/50 px-6 py-3 rounded-lg">
            <div className="text-sm text-gray-400">Gold Herald</div>
            <div className="text-xl font-bold text-yellow-400">{HERALD_CONFIG.GOLD_FOOD_PER_DAY} FOOD/day</div>
          </div>
        </div>
      </div>

      {!connected ? (
        <button
          onClick={connectWallet}
          className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold transition text-lg"
        >
          Connect Wallet to Start
        </button>
      ) : (
        <button
          onClick={() => setCurrentPage('game')}
          className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold transition text-lg"
        >
          Enter Herald Platform
        </button>
      )}
    </div>
  );

  const renderGamePage = () => {
    if (!connected) {
      return (
        <div className="text-center py-20">
          <Crown className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Welcome to Kings of Red</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to start playing</p>
          <button
            onClick={connectWallet}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition text-lg"
          >
            Connect Wallet
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Herald Mining
          </h3>
          <p className="text-gray-300 mb-4">
            Stake your Herald NFTs to produce $KINGSFOOD every 24 hours. Herald rewards vary by rarity:
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 p-4 rounded border border-orange-400/30">
              <div className="text-orange-400 font-bold mb-1">Bronze Herald</div>
              <div className="text-2xl font-bold">{HERALD_CONFIG.BRONZE_FOOD_PER_DAY}</div>
              <div className="text-sm text-gray-400">FOOD/day</div>
            </div>
            <div className="bg-black/30 p-4 rounded border border-gray-300/30">
              <div className="text-gray-300 font-bold mb-1">Silver Herald</div>
              <div className="text-2xl font-bold">{HERALD_CONFIG.SILVER_FOOD_PER_DAY}</div>
              <div className="text-sm text-gray-400">FOOD/day</div>
            </div>
            <div className="bg-black/30 p-4 rounded border border-yellow-400/30">
              <div className="text-yellow-400 font-bold mb-1">Gold Herald</div>
              <div className="text-2xl font-bold">{HERALD_CONFIG.GOLD_FOOD_PER_DAY}</div>
              <div className="text-sm text-gray-400">FOOD/day</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedTab('unstaked')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              selectedTab === 'unstaked'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Unstaked Heralds ({unstakedHeralds.length})
          </button>
          <button
            onClick={() => setSelectedTab('staked')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              selectedTab === 'staked'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Staked Heralds ({stakedHeralds.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(selectedTab === 'unstaked' ? unstakedHeralds : stakedHeralds).map(herald => {
            const clan = getClan(herald.clan);
            const ClanIcon = clan.icon;
            const claimable = canClaim(herald);
            const timeUntilClaim = getTimeUntilClaim(herald);
            
            return (
              <div
                key={herald.id}
                className={`bg-gradient-to-br ${clan.color} p-0.5 rounded-xl`}
              >
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{clan.name}</h3>
                      <p className="text-sm text-gray-400">Token #{herald.tokenId}</p>
                    </div>
                    <ClanIcon className="w-8 h-8 opacity-50" />
                  </div>
                  
                  <div className={`inline-block px-3 py-1 rounded border ${getRarityColor(herald.rarity)} mb-4`}>
                    <span className="font-bold text-sm">{herald.rarity}</span>
                  </div>
                  
                  {herald.staked && (
                    <div className="bg-black/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Next claim:</span>
                      </div>
                      <div className={`text-lg font-bold ${claimable ? 'text-green-400' : 'text-yellow-400'}`}>
                        {timeUntilClaim}
                      </div>
                      {claimable && (
                        <div className="text-sm text-gray-400 mt-1">
                          +{herald.rarity === 'Gold' ? HERALD_CONFIG.GOLD_FOOD_PER_DAY :
                            herald.rarity === 'Silver' ? HERALD_CONFIG.SILVER_FOOD_PER_DAY :
                            HERALD_CONFIG.BRONZE_FOOD_PER_DAY} FOOD
                        </div>
                      )}