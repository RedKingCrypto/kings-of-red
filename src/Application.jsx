import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords } from 'lucide-react';
import { ethers } from 'ethers';
import MintPage from './mint.jsx';
import StakingPage from './Staking.jsx';
import ExchangePage from './Exchange.jsx';
import AboutPage from './About.jsx';
import FAQPage from './faq.jsx';
import DashboardPage from './Dashboard.jsx';
import LeaderboardPage from './Leaderboard.jsx';
import BattlePage from './Battle.jsx';
import MintFighter from './components/MintFighter.jsx';
import BattleBoosts from './components/BattleBoosts.jsx';

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
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');

  // Check if wallet is already connected on load and handle referral codes
  useEffect(() => {
    checkIfWalletConnected();
    
    // Store referral code if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Sanitize the code (alphanumeric only)
      const cleanCode = refCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
      
      // Check if we already have a code that hasn't expired
      const existingCode = localStorage.getItem('referralCode');
      const existingExpiry = localStorage.getItem('referralExpiry');
      
      // Only store if no code exists or the existing one has expired (first-click attribution)
      if (!existingCode || !existingExpiry || Date.now() >= parseInt(existingExpiry)) {
        // Store with 7-day expiry
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('referralCode', cleanCode);
        localStorage.setItem('referralExpiry', expiryTime.toString());
        
        console.log(`✅ Referral code stored: ${cleanCode} (expires in 7 days)`);
      } else {
        console.log(`Already have referral code: ${existingCode}`);
      }
    }
  }, []);

  const checkIfWalletConnected = async () => {
    console.log('🔍 checkIfWalletConnected called');
    
    if (!window.ethereum) {
      console.log('❌ No MetaMask detected');
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('Accounts found:', accounts);
      
      if (accounts.length > 0) {
        const account = accounts[0];
        console.log('✅ Wallet already connected:', account);
        
        setWalletAddress(account);
        setConnected(true);
        
        // ETHERS V6 SYNTAX
        console.log('Creating BrowserProvider...');
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        console.log('✅ Provider created');
        
        setProvider(web3Provider);
        
        console.log('Getting signer...');
        const web3Signer = await web3Provider.getSigner();
        console.log('✅ Signer created');
        
        setSigner(web3Signer);
        
        console.log('✅ Wallet connection complete');
      } else {
        console.log('No accounts found - wallet not connected');
      }
    } catch (error) {
      console.error('❌ Error in checkIfWalletConnected:', error);
    }
  };

  const connectWallet = async () => {
    console.log('🔌 connectWallet called');
    
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      console.log('Requesting accounts...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      console.log('✅ Accounts received:', accounts);
      
      // Check if on Base network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', chainId);
      
      const BASE_CHAIN_ID = '0x2105'; // Base Mainnet
      
      if (chainId !== BASE_CHAIN_ID) {
        console.log('Wrong network, switching to Base...');
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
          });
          console.log('✅ Switched to Base');
        } catch (switchError) {
          if (switchError.code === 4902) {
            console.log('Base not added, adding now...');
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
            console.log('✅ Base network added');
          } else {
            throw switchError;
          }
        }
      }
      
      const account = accounts[0];
      console.log('Setting wallet address:', account);
      setWalletAddress(account);
      setConnected(true);
      
      // ETHERS V6 SYNTAX
      console.log('Creating BrowserProvider...');
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      console.log('✅ Provider created');
      
      setProvider(web3Provider);
      
      console.log('Getting signer...');
      const web3Signer = await web3Provider.getSigner();
      console.log('✅ Signer created');
      
      setSigner(web3Signer);
      
      console.log('✅ Wallet connected successfully');
      
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress('');
    setProvider(null);
    setSigner(null);
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, '', `/${page === 'home' ? '' : page}`);
  };

  // Event listeners for wallet changes
  useEffect(() => {
    if (!window.ethereum) return;
    
    console.log('Setting up wallet event listeners...');
    
    const handleAccountsChanged = async (accounts) => {
      console.log('👤 Accounts changed:', accounts);
      
      if (accounts.length > 0) {
        const account = accounts[0];
        setWalletAddress(account);
        setConnected(true);
        
        // ETHERS V6 SYNTAX
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        setSigner(await web3Provider.getSigner());
        
        console.log('✅ Wallet reconnected after account change');
      } else {
        console.log('❌ Wallet disconnected');
        setWalletAddress('');
        setConnected(false);
        setProvider(null);
        setSigner(null);
      }
    };
    
    const handleChainChanged = (chainId) => {
      console.log('🔗 Chain changed to:', chainId);
      window.location.reload();
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    console.log('✅ Event listeners set up');
    
    return () => {
      console.log('Cleaning up event listeners...');
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

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
      {/* Navigation */}
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 
            className="text-2xl font-bold text-red-500 cursor-pointer"
            onClick={() => navigateTo('home')}
          >
            Kings of Red
          </h1>
          
          <div className="flex gap-6 items-center flex-wrap">
            {/* Home */}
            <button
              onClick={() => navigateTo('home')}
              className={`transition ${
                currentPage === 'home' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              Home
            </button>
            
            {/* Mint Heralds */}
            <button
              onClick={() => navigateTo('mint')}
              className={`transition ${
                currentPage === 'mint' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              Mint Heralds
            </button>

            {/* Mint Fighters */}
            <button
              onClick={() => navigateTo('mint-fighter')}
              className={`transition ${
                currentPage === 'mint-fighter' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              {/* Mint Fighters */}
            </button>
            
            {/* Staking */}
            <button
              onClick={() => navigateTo('staking')}
              className={`transition ${
                currentPage === 'staking' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              Staking
            </button>
            
            {/* Exchange */}
            <button
              onClick={() => navigateTo('exchange')}
              className={`transition ${
                currentPage === 'exchange' ? 'text-red-500' : 'hover:text-red-400'
              }`}
              >
              Exchange
            </button>
            
            {/* Dashboard */}
            <button
              onClick={() => navigateTo('dashboard')}
              className={`transition ${
                currentPage === 'dashboard' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              Dashboard
            </button>

            {/* Battle Boosts */}
            <button
              onClick={() => navigateTo('boosts')}
              className={`transition ${
                currentPage === 'boosts' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              Battle Boosts
            </button>
            
            {/* FAQ */}
            <button
              onClick={() => navigateTo('faq')}
              className={`transition ${
                currentPage === 'faq' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              FAQ
            </button>
            
            {/* About */}
            <button
              onClick={() => navigateTo('about')}
              className={`transition ${
                currentPage === 'about' ? 'text-red-500' : 'hover:text-red-400'
              }`}
            >
              About
            </button>

            {/* Wallet Connection */}
            {!connected ? (
              <button
                onClick={connectWallet}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold transition"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={disconnectWallet}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-mono text-sm transition"
                title="Click to disconnect"
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </button>
            )}
          </div>
        </div>
      </nav>

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
        {currentPage === 'mint-fighter' && (
          <MintFighter 
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
        {currentPage === 'boosts' && (
          <BattleBoosts 
            provider={provider}
            signer={signer}
            address={walletAddress}
          />
        )}
        {currentPage === 'about' && (
          <AboutPage onNavigate={navigateTo} />
        )}
        {currentPage === 'faq' && (
          <FAQPage onNavigate={navigateTo} />
        )}
        {currentPage === 'leaderboard' && (
          <LeaderboardPage 
            connected={connected}
            walletAddress={walletAddress}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === 'battle' && (
          <BattlePage 
            connected={connected}
            walletAddress={walletAddress}
            onNavigate={navigateTo}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Kings of Red © 2025 • Built on Base Network</p>
            <p className="mt-2">
              <a 
                href="https://t.me/redkingcrypto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Join the Telegram Discussion Channel
              </a>
            </p>
            <p className="mt-2">
              <a 
                href="https://x.com/RedKingDefi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Follow on X/Twitter
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
            onClick={() => navigateTo('mint-fighter')}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-bold text-lg transition"
          >
            Mint Fighter NFTs
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