import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords } from 'lucide-react';
import { ethers } from 'ethers';
import MintPage from './mint.jsx';
import StakingPage from './Staking.jsx';
import ExchangePage from './Exchange.jsx';
import AboutPage from './About.jsx';
import FAQPage from './FAQ.jsx';
import DashboardPage from './Dashboard.jsx';

// Import contract addresses
import { 
  HERALD_CONTRACT_ADDRESS,
  FOOD_TOKEN_ADDRESS,
  GOLD_TOKEN_ADDRESS,
  GAME_BALANCE_ADDRESS
} from './contractConfig';

// PLACEHOLDER VALUES - Customize these
const HERALD_CONFIG = {
  BRONZE_FOOD_PER_DAY: 20,
  SILVER_FOOD_PER_DAY: 65,
  GOLD_FOOD_PER_DAY: 100,
  CLAIM_COOLDOWN_HOURS: 24
};

const CLANS = [
  { id: 1, name: 'Smizfume', color: 'from-red-600 to-orange-500', icon: Flame },
  { id: 2, name: 'Coalheart', color: 'from-gray-600 to-slate-400', icon: Shield },
  { id: 3, name: 'Warmdice', color: 'from-purple-600 to-indigo-500', icon: Crown },
  { id: 4, name: 'Bervation', color: 'from-blue-600 to-cyan-500', icon: Swords },
  { id: 5, name: 'Konfisof', color: 'from-green-600 to-emerald-500', icon: Shield },
  { id: 6, name: 'Witkastle', color: 'from-yellow-500 to-amber-400', icon: Crown },
  { id: 7, name: 'Bowkin', color: 'from-rose-600 to-red-700', icon: Flame }
];

export default function Application() {
  // Wallet state
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');

  // Check if wallet is already connected on load
  useEffect(() => {
    checkIfWalletConnected();
  }, []);

  const checkIfWalletConnected = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Check if on Base network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const BASE_CHAIN_ID = '0x2105'; // Base Mainnet
      
      if (chainId !== BASE_CHAIN_ID) {
        // Prompt to switch to Base
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
          });
        } catch (switchError) {
          // If Base not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: BASE_CHAIN_ID,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }],
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

  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress('');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, '', `/${page === 'home' ? '' : page}`);
  };

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || 'home';
      setCurrentPage(path);
    };
    window.addEventListener('popstate', handlePopState);
    
    // Check initial path
    const initialPath = window.location.pathname.slice(1) || 'home';
    setCurrentPage(initialPath);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header / Navigation */}
      <header className="border-b border-red-800/50 bg-black/40 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
              <Crown className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold">KINGS OF RED</h1>
                <p className="text-xs text-gray-400">NFT Trading Card Game</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex gap-6 items-center flex-wrap">
              <button 
                onClick={() => navigateTo('home')}
                className={`hover:text-red-400 transition ${currentPage === 'home' ? 'text-red-500' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => navigateTo('mint')}
                className={`hover:text-red-400 transition ${currentPage === 'mint' ? 'text-red-500' : ''}`}
              >
                Mint
              </button>
              <button 
                onClick={() => navigateTo('dashboard')}
                className={`hover:text-red-400 transition ${currentPage === 'dashboard' ? 'text-red-500' : ''}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigateTo('staking')}
                className={`hover:text-red-400 transition ${currentPage === 'staking' ? 'text-red-500' : ''}`}
              >
                Staking
              </button>
              <button 
                onClick={() => navigateTo('exchange')}
                className={`hover:text-red-400 transition ${currentPage === 'exchange' ? 'text-red-500' : ''}`}
              >
                Exchange
              </button>
              <button 
                onClick={() => navigateTo('faq')}
                className={`hover:text-red-400 transition ${currentPage === 'faq' ? 'text-red-500' : ''}`}
              >
                FAQ
              </button>
              <button 
                onClick={() => navigateTo('about')}
                className={`hover:text-red-400 transition ${currentPage === 'about' ? 'text-red-500' : ''}`}
              >
                About
              </button>
            </nav>

          {/* Wallet Connection */}
{!connected ? (
  <button
    onClick={connectWallet}
    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
  >
    Connect Wallet
  </button>
) : (
  <div className="flex items-center gap-3 flex-wrap">
    {/* Token Balances */}
    <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
      <span className="text-blue-400 font-semibold">🍖 0 FOOD</span>
      <span className="text-gray-600 mx-2">|</span>
      <span className="text-yellow-400 font-semibold">🪙 0 GOLD</span>
    </div>
    
    {/* Wallet Address */}
    <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
      <span className="text-sm text-gray-400">Connected:</span>
      <span className="ml-2 font-mono text-sm">
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </span>
    </div>
    
    {/* Dashboard Button */}
    <button
      onClick={() => navigateTo('dashboard')}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      Dashboard
    </button>
    
    {/* Disconnect */}
    <button
      onClick={disconnectWallet}
      className="text-sm text-gray-400 hover:text-white transition"
    >
      Disconnect
    </button>
  </div>
)}
          </div>
        </div>
      </header>

    
      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        {currentPage === 'home' && renderHomePage(navigateTo)}
        {currentPage === 'mint' && (
          <MintPage 
            onNavigate={navigateTo}
            connected={connected}
            walletAddress={walletAddress}
            connectWallet={connectWallet}
          />
        )}
        {currentPage === 'dashboard' && (
          <DashboardPage 
            onNavigate={navigateTo}
            connected={connected}
            walletAddress={walletAddress}
          />
        )}
        {currentPage === 'staking' && (
          <StakingPage 
            onNavigate={navigateTo}
            connected={connected}
            walletAddress={walletAddress}
          />
        )}
        {currentPage === 'exchange' && (
          <ExchangePage 
            onNavigate={navigateTo}
            connected={connected}
            walletAddress={walletAddress}
          />
        )}
        {currentPage === 'about' && (
          <AboutPage onNavigate={navigateTo} />
        )}
        {currentPage === 'faq' && (
          <FAQPage onNavigate={navigateTo} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Kings of Red © 2025 • Built on Base Network</p>
            <p className="mt-2">
              <a 
                href="https://basescan.org/address/0xb282DC4c005C88A3E81D513D09a78f48CA404311"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                View Herald Contract on BaseScan
              </a>
            </p>
            <p className="mt-1 text-xs">
              <a 
                href={`https://basescan.org/address/${FOOD_TOKEN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 mr-3"
              >
                FOOD Token
              </a>
              <a 
                href={`https://basescan.org/address/${GOLD_TOKEN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                GOLD Token
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Homepage render function
function renderHomePage(navigateTo) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          Welcome to Kings of Red
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          A collectible trading card game featuring token mining, epic battles, and seven legendary clans.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigateTo('mint')}
            className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-lg transition"
          >
            Mint Herald NFTs
          </button>
          <button
            onClick={() => navigateTo('about')}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-bold text-lg transition"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* The Seven Clans */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">The Seven Clans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {CLANS.map((clan) => {
            const IconComponent = clan.icon;
            return (
              <div
                key={clan.id}
                className={`bg-gradient-to-br ${clan.color} p-6 rounded-lg shadow-lg hover:scale-105 transition`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <IconComponent className="w-8 h-8" />
                  <h3 className="text-xl font-bold">{clan.name}</h3>
                </div>
                <p className="text-sm text-white/80">
                  Collect all {clan.name} NFTs to unlock clan bonuses
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <Crown className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Collect NFTs</h3>
          <p className="text-gray-400">
            Mint unique Herald NFTs across 7 clans and 3 rarity tiers. Each NFT is a key to earning rewards.
          </p>
        </div>
        
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <Coins className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Earn Tokens</h3>
          <p className="text-gray-400">
            Stake your Heralds to produce $KINGSFOOD daily. Use tokens for battles, upgrades, and trading.
          </p>
        </div>
        
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <Swords className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Battle & Win</h3>
          <p className="text-gray-400">
            Deploy Fighters in PvE battles against monsters. Win rewards and climb the leaderboard.
          </p>
        </div>
      </div>

      {/* Genesis Sale CTA */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Genesis Herald Sale Live!</h2>
        <p className="text-xl mb-6">
          Limited supply: 100 Bronze • 77 Silver • 43 Gold
        </p>
        <div className="flex gap-4 justify-center text-lg mb-6">
          <div>
            <span className="font-bold">Bronze:</span> $7
          </div>
          <div>
            <span className="font-bold">Silver:</span> $23
          </div>
          <div>
            <span className="font-bold">Gold:</span> $39
          </div>
        </div>
        <button
          onClick={() => navigateTo('mint')}
          className="bg-white text-red-600 hover:bg-gray-100 px-12 py-4 rounded-lg font-bold text-xl transition"
        >
          Mint Now
        </button>
      </div>
    </div>
  );
}