import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords } from 'lucide-react';
import MintPage from './mint.jsx';
import StakingPage from './Staking.jsx';
import ExchangePage from './Exchange.jsx';
import AboutPage from './About.jsx';
import FAQPage from './faq.jsx'; 

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
  // Game state
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [foodBalance, setFoodBalance] = useState(0);

  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');

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

  // Real wallet connection - replace with actual Web3 later
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setConnected(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask to use this application!');
    }
  };

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

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigateTo('mint')}
          className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold transition text-lg"
        >
          Mint Herald NFTs
        </button>
        <button
          onClick={() => navigateTo('about')}
          className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-semibold transition text-lg"
        >
          Learn More
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Navigation Header */}
      <div className="border-b border-red-800/50 bg-black/40 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo/Title */}
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <Crown className="w-8 h-8 text-red-500" />
              <div className="text-left">
                <h1 className="text-2xl font-bold">KINGS OF RED</h1>
                <p className="text-sm text-gray-400">NFT Trading Card Game</p>
              </div>
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigateTo('home')}
                className={`transition px-3 py-2 rounded ${
                  currentPage === 'home' ? 'text-red-500 font-semibold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo('mint')}
                className={`transition px-3 py-2 rounded ${
                  currentPage === 'mint' ? 'text-red-500 font-semibold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Mint
              </button>
              <button
                onClick={() => navigateTo('about')}
                className={`transition px-3 py-2 rounded ${
                  currentPage === 'about' ? 'text-red-500 font-semibold' : 'text-gray-300 hover:text-white'
                }`}
              >
                About
              </button>
              <button
                onClick={() => navigateTo('faq')}
                className={`transition px-3 py-2 rounded ${
                  currentPage === 'faq' ? 'text-red-500 font-semibold' : 'text-gray-300 hover:text-white'
                }`}
              >
                FAQ
              </button>
              <a
                href="https://medium.com/@Red-King"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition px-3 py-2"
              >
                Medium
              </a>
            </div>

            {/* Wallet Connection & FOOD Balance */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/30">
                <Coins className="w-5 h-5 text-green-400" />
                <span className="font-bold">{foodBalance.toFixed(0)} FOOD</span>
              </div>

              {!connected ? (
                <button
                  onClick={connectWallet}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                  <span className="text-sm text-gray-400">Connected</span>
                  <div className="font-mono text-sm">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => navigateTo('home')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition ${
                currentPage === 'home' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('mint')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition ${
                currentPage === 'mint' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Mint
            </button>
            <button
              onClick={() => navigateTo('about')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition ${
                currentPage === 'about' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              About
            </button>
            <a
              href="https://medium.com/@Red-King"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap px-4 py-2 rounded-lg bg-gray-800 text-gray-300"
            >
              Medium
            </a>
          </div>
        </div>
      </div>

      {/* Page Content */}
<div className="container mx-auto px-4 py-8">
  {currentPage === 'home' && renderHomePage()}
  {currentPage === 'mint' && (
    <MintPage 
      onNavigate={setCurrentPage}
      connected={connected}
      walletAddress={walletAddress}
      connectWallet={connectWallet}
    />
  )}
  {currentPage === 'staking' && <StakingPage />}
  {currentPage === 'exchange' && <ExchangePage />}
  {currentPage === 'about' && <AboutPage />}
  {currentPage === 'faq' && <FAQPage onNavigate={setCurrentPage} />}
</div>

      {/* Footer */}
      <div className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Kings of Red © <a href= "https://redkingcrypto.com">Red King Crypto</a> 2025 • Built on Base Network</p>
            <div className="mt-2">
              <button
                onClick={() => navigateTo('about')}
                className="hover:text-gray-300 transition"
              >
                About
              </button>
              {' • '}
              <a href="#" className="hover:text-gray-300 transition">Discord</a>
              {' • '}
              <a href="#" className="hover:text-gray-300 transition">Twitter</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}