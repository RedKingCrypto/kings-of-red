import React, { useState, useEffect } from 'react';
import { Crown, Coins, Droplet, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import {
  HERALD_ADDRESS,
  FOOD_TOKEN_ADDRESS,
  GOLD_TOKEN_ADDRESS,
  WOOD_TOKEN_ADDRESS,
  GAME_BALANCE_ADDRESS,
  HERALD_ABI,
  FOOD_TOKEN_ABI,
  GOLD_TOKEN_ABI,
  WOOD_TOKEN_ABI,
  GAME_BALANCE_ABI,
  CLAN_NAMES,
  RARITY_NAMES,
  getHeraldImageUrl
} from './contractConfig';

export default function DashboardPage({ connected, walletAddress, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState({
    walletFood: '0',
    walletGold: '0',
    walletWood: '0',
    inGameFood: '0',
    inGameGold: '0',
    inGameWood: '0'
  });
  const [heralds, setHeralds] = useState([]);
  const [totalValue, setTotalValue] = useState('0');

  useEffect(() => {
    if (connected && walletAddress) {
      loadDashboardData();
    }
  }, [connected, walletAddress]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBalances(),
        loadHeralds()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Token contracts
      const foodContract = new ethers.Contract(FOOD_TOKEN_ADDRESS, FOOD_TOKEN_ABI, provider);
      const goldContract = new ethers.Contract(GOLD_TOKEN_ADDRESS, GOLD_TOKEN_ABI, provider);
      const woodContract = new ethers.Contract(WOOD_TOKEN_ADDRESS, WOOD_TOKEN_ABI, provider);
      
      // Game balance contract
      const gameBalanceContract = new ethers.Contract(GAME_BALANCE_ADDRESS, GAME_BALANCE_ABI, provider);
      
      // Get all balances
      const [walletFood, walletGold, walletWood, gameFood, gameGold, gameWood] = await Promise.all([
        foodContract.balanceOf(walletAddress),
        goldContract.balanceOf(walletAddress),
        woodContract.balanceOf(walletAddress),
        gameBalanceContract.inGameFood(walletAddress),
        gameBalanceContract.inGameGold(walletAddress),
        gameBalanceContract.inGameWood(walletAddress)
      ]);
      
      setBalances({
        walletFood: parseFloat(ethers.formatEther(walletFood)).toFixed(2),
        walletGold: parseFloat(ethers.formatEther(walletGold)).toFixed(2),
        walletWood: parseFloat(ethers.formatEther(walletWood)).toFixed(2),
        inGameFood: parseFloat(ethers.formatEther(gameFood)).toFixed(2),
        inGameGold: parseFloat(ethers.formatEther(gameGold)).toFixed(2),
        inGameWood: parseFloat(ethers.formatEther(gameWood)).toFixed(2)
      });
      
      // Calculate total value (1 GOLD = 4 FOOD, 1 WOOD = 2 FOOD in value)
      const totalFoodValue = parseFloat(ethers.formatEther(walletFood)) + parseFloat(ethers.formatEther(gameFood));
      const totalGoldValue = parseFloat(ethers.formatEther(walletGold)) + parseFloat(ethers.formatEther(gameGold));
      const totalWoodValue = parseFloat(ethers.formatEther(walletWood)) + parseFloat(ethers.formatEther(gameWood));
      const totalInFood = totalFoodValue + (totalGoldValue * 4) + (totalWoodValue * 2);
      setTotalValue(totalInFood.toFixed(2));
      
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadHeralds = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI, provider);
      
      // Get user's Herald balance
      const balance = await heraldContract.balanceOf(walletAddress);
      const heraldCount = parseInt(balance.toString());
      
      if (heraldCount === 0) {
        setHeralds([]);
        return;
      }
      
      // FAST METHOD: Query Transfer events to find user's Heralds
      // This gets all transfers TO the user's address
      const transferFilter = heraldContract.filters.Transfer(null, walletAddress);
      const transferEvents = await heraldContract.queryFilter(transferFilter, 0, 'latest');
      
      // Extract unique token IDs from events
      const potentialTokenIds = [...new Set(transferEvents.map(event => event.args.tokenId.toString()))];
      
      // Verify ownership (in case some were transferred away)
      const userHeralds = [];
      
      for (const tokenId of potentialTokenIds) {
        try {
          const owner = await heraldContract.ownerOf(tokenId);
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            const [rarity, clan] = await heraldContract.getHerald(tokenId);
            userHeralds.push({
              tokenId: tokenId,
              rarity: parseInt(rarity),
              clan: parseInt(clan),
              imageUrl: getHeraldImageUrl(parseInt(clan), parseInt(rarity))
            });
          }
        } catch (e) {
          // Token was burned or doesn't exist, skip
          continue;
        }
      }
      
      setHeralds(userHeralds);
      
    } catch (error) {
      console.error('Error loading Heralds:', error);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Crown className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-8">
          Connect your wallet to view your dashboard, token balances, and NFT portfolio.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Wallet: {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your portfolio...</p>
        </div>
      ) : (
        <>
          {/* Token Balances Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* FOOD Balance Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Droplet className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold">$KINGSFOOD</h3>
                    <p className="text-xs text-gray-400">FOOD Token</p>
                  </div>
                </div>
                <a
                  href={`https://basescan.org/token/${FOOD_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-400">In-Game Balance</span>
                  <span className="text-xl font-bold text-blue-400">{balances.inGameFood}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="text-xl font-bold">{balances.walletFood}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="font-semibold">Total FOOD</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {(parseFloat(balances.inGameFood) + parseFloat(balances.walletFood)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* GOLD Balance Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-xl font-bold">$KINGSGOLD</h3>
                    <p className="text-xs text-gray-400">GOLD Token</p>
                  </div>
                </div>
                <a
                  href={`https://basescan.org/token/${GOLD_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-400">In-Game Balance</span>
                  <span className="text-xl font-bold text-yellow-400">{balances.inGameGold}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="text-xl font-bold">{balances.walletGold}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="font-semibold">Total GOLD</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {(parseFloat(balances.inGameGold) + parseFloat(balances.walletGold)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* WOOD Balance Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-amber-600" />
                  <div>
                    <h3 className="text-xl font-bold">$KORWOOD</h3>
                    <p className="text-xs text-gray-400">WOOD Token</p>
                  </div>
                </div>
                <a
                  href={`https://basescan.org/token/${WOOD_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-400">In-Game Balance</span>
                  <span className="text-xl font-bold text-amber-600">{balances.inGameWood}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="text-xl font-bold">{balances.walletWood}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="font-semibold">Total WOOD</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {(parseFloat(balances.inGameWood) + parseFloat(balances.walletWood)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('exchange')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                Manage Tokens
              </button>
              <button
                onClick={() => onNavigate('staking')}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                Stake NFTs
              </button>
              <button
                onClick={() => onNavigate('mint')}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                Mint More
              </button>
            </div>
          </div>

          {/* NFT Portfolio */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Your Herald NFTs</h3>
              <Crown className="w-6 h-6 text-red-500" />
            </div>

            {heralds.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You don't own any Herald NFTs yet</p>
                <button
                  onClick={() => onNavigate('mint')}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Mint Your First Herald
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {heralds.map((herald) => (
                    <div
                      key={herald.tokenId}
                      className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-red-500 transition group"
                    >
                      <div className="aspect-[3/4] relative bg-gray-800">
                        <img
                          src={herald.imageUrl}
                          alt={`Herald #${herald.tokenId}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                          <span className={
                            herald.rarity === 2 ? 'text-yellow-400' :
                            herald.rarity === 1 ? 'text-gray-300' :
                            'text-orange-400'
                          }>
                            {RARITY_NAMES[herald.rarity]}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-center">#{herald.tokenId}</p>
                        <p className="text-xs text-gray-400 text-center">{CLAN_NAMES[herald.clan]}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="font-bold">{heralds.length} Herald{heralds.length !== 1 ? 's' : ''} Owned</p>
                    <p className="text-sm text-gray-400">
                      View on{' '}
                      <a
                        href={`https://basescan.org/token/${HERALD_ADDRESS}?a=${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        BaseScan
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('staking')}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Stake Heralds
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-semibold mb-1">Token Management</p>
                <p className="text-yellow-400/80">
                  To deposit tokens from your wallet to in-game balance, or withdraw tokens back to your wallet, visit the{' '}
                  <button
                    onClick={() => onNavigate('exchange')}
                    className="underline hover:text-yellow-300"
                  >
                    Exchange page
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}