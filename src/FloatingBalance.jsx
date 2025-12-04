import React, { useState, useEffect } from 'react';
import { Coins, Droplet } from 'lucide-react';
import { ethers } from 'ethers';

export default function FloatingBalance({ 
  connected, 
  walletAddress, 
  contractAddresses,
  onNavigate 
}) {
  const [balances, setBalances] = useState({
    food: '0',
    gold: '0',
    inGameFood: '0',
    inGameGold: '0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && walletAddress) {
      loadBalances();
      // Refresh balances every 30 seconds
      const interval = setInterval(loadBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, walletAddress]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // ABI for token balance
      const tokenABI = ['function balanceOf(address) view returns (uint256)'];
      
      // ABI for in-game balance
      const gameBalanceABI = [
        'function inGameFood(address) view returns (uint256)',
        'function inGameGold(address) view returns (uint256)'
      ];
      
      // Get wallet balances
      const foodContract = new ethers.Contract(
        contractAddresses.FOOD_TOKEN,
        tokenABI,
        provider
      );
      const goldContract = new ethers.Contract(
        contractAddresses.GOLD_TOKEN,
        tokenABI,
        provider
      );
      
      // Get in-game balances
      const gameBalance = new ethers.Contract(
        contractAddresses.GAME_BALANCE,
        gameBalanceABI,
        provider
      );
      
      const [walletFood, walletGold, gameFood, gameGold] = await Promise.all([
        foodContract.balanceOf(walletAddress),
        goldContract.balanceOf(walletAddress),
        gameBalance.inGameFood(walletAddress),
        gameBalance.inGameGold(walletAddress)
      ]);
      
      setBalances({
        food: parseFloat(ethers.formatEther(walletFood)).toFixed(2),
        gold: parseFloat(ethers.formatEther(walletGold)).toFixed(2),
        inGameFood: parseFloat(ethers.formatEther(gameFood)).toFixed(2),
        inGameGold: parseFloat(ethers.formatEther(gameGold)).toFixed(2)
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading balances:', error);
      setLoading(false);
    }
  };

  if (!connected) return null;

  return (
    <div className="fixed top-20 right-4 z-40 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-3 shadow-xl">
      <div className="space-y-2 text-sm">
        {/* In-Game Balances (Primary) */}
        <div>
          <div className="text-xs text-gray-400 mb-1 font-semibold">In-Game Balance</div>
          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Droplet className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold">{balances.inGameFood}</span>
                <span className="text-gray-400 text-xs">FOOD</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold">{balances.inGameGold}</span>
                <span className="text-gray-400 text-xs">GOLD</span>
              </div>
            </>
          )}
        </div>
        
        {/* Wallet Balances (Secondary) */}
        <div className="border-t border-gray-700 pt-2">
          <div className="text-xs text-gray-500 mb-1">Wallet</div>
          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Droplet className="w-3 h-3" />
                <span>{balances.food} FOOD</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Coins className="w-3 h-3" />
                <span>{balances.gold} GOLD</span>
              </div>
            </>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="border-t border-gray-700 pt-2 flex gap-2">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition flex-1"
          >
            Dashboard
          </button>
          <button 
            onClick={loadBalances}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition"
            disabled={loading}
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}