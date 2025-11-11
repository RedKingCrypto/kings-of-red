import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords, Sparkles, Users, Trophy, Gift } from 'lucide-react';

// CONFIGURATION - Update these values
const MINT_CONFIG = {
  GENESIS_DROP: {
    name: "Genesis Sale",
    active: true,
    startDate: new Date('2024-12-01T00:00:00Z'), // Update to your launch date
    endDate: new Date('2024-12-14T23:59:59Z'),
    supply: {
      bronze: { total: 40, minted: 0, price: 0.05 }, // Price in ETH
      silver: { total: 40, minted: 0, price: 0.10 },
      gold: { total: 20, minted: 0, price: 0.20 }
    },
    perks: [
      "Lifetime 10% affiliate commission on ALL future sales",
      "Exclusive Genesis Badge NFT",
      "Priority whitelist for Alpha drop",
      "Early access to all future features"
    ]
  },
  EARLY_BIRD: {
    name: "Early Bird Sale",
    active: false,
    startDate: new Date('2024-12-15T00:00:00Z'),
    endDate: new Date('2025-01-15T23:59:59Z'),
    supply: {
      bronze: { total: 80, minted: 0, price: 0.075 },
      silver: { total: 80, minted: 0, price: 0.15 },
      gold: { total: 40, minted: 0, price: 0.30 }
    },
    perks: [
      "5% affiliate commission",
      "Whitelist for Alpha drop",
      "Early access to battles"
    ]
  },
  PUBLIC_SALE: {
    name: "Public Sale",
    active: false,
    startDate: new Date('2025-01-16T00:00:00Z'),
    supply: {
      bronze: { total: 280, minted: 0, price: 0.10 },
      silver: { total: 280, minted: 0, price: 0.20 },
      gold: { total: 140, minted: 0, price: 0.40 }
    },
    perks: [
      "Standard Herald benefits",
      "Mining rewards",
      "Access to battles"
    ]
  }
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

export default function HeraldMintingPage() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedDrop, setSelectedDrop] = useState('GENESIS_DROP');
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [userAffiliateCode, setUserAffiliateCode] = useState('');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const currentDrop = MINT_CONFIG[selectedDrop];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = currentDrop.startDate.getTime();
      const distance = target - now;

      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDrop]);

  const connectWallet = async () => {
    // TODO: Replace with actual Web3 wallet connection
    // For now, mock connection
    const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
    setWalletAddress(mockAddress);
    setConnected(true);
    
    // Check if user has Genesis Herald for affiliate code
    // TODO: Check actual NFT ownership
    const hasGenesisHerald = Math.random() > 0.5;
    if (hasGenesisHerald) {
      const code = 'KOR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setUserAffiliateCode(code);
    }
  };

  const mintHerald = async (rarity) => {
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    setMinting(true);

    try {
      // TODO: Replace with actual smart contract call
      // Simulate minting delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Random clan selection
      const randomClan = CLANS[Math.floor(Math.random() * CLANS.length)];
      const tokenId = Math.floor(Math.random() * 10000);

      setMintSuccess({
        rarity,
        clan: randomClan,
        tokenId,
        price: currentDrop.supply[rarity].price
      });

      // TODO: Update supply counts from blockchain
      // For now, mock increment
      MINT_CONFIG[selectedDrop].supply[rarity].minted += 1;

    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  const copyAffiliateLink = () => {
    const link = `https://kings-of-red-e2b2.vercel.app/mint?ref=${userAffiliateCode}`;
    navigator.clipboard.writeText(link);
    alert('Affiliate link copied to clipboard!');
  };

  const isDropActive = () => {
    const now = new Date();
    return currentDrop.active && now >= currentDrop.startDate && (!currentDrop.endDate || now <= currentDrop.endDate);
  };

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'gold': return 'from-yellow-600 to-amber-500';
      case 'silver': return 'from-gray-400 to-slate-300';
      case 'bronze': return 'from-orange-600 to-amber-700';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-red-800/50 bg-black/40 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold">KINGS OF RED</h1>
                <p className="text-sm text-gray-400">Herald Minting</p>
              </div>
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
                <span className="text-sm text-gray-400">Connected:</span>
                <span className="ml-2 font-mono text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <Sparkles className="w-16 h-16 mx-auto text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-5xl font-bold mb-4">Mint Your Herald NFT</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Begin your journey in Kings of Red. Each Herald produces $KINGSFOOD tokens daily. 
            Clan is randomly assigned to create a vibrant secondary market.
          </p>
        </div>

        {/* Drop Selection */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          {Object.keys(MINT_CONFIG).map(dropKey => (
            <button
              key={dropKey}
              onClick={() => setSelectedDrop(dropKey)}
              disabled={!MINT_CONFIG[dropKey].active}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedDrop === dropKey
                  ? 'bg-red-600 text-white'
                  : MINT_CONFIG[dropKey].active
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              {MINT_CONFIG[dropKey].name}
              {!MINT_CONFIG[dropKey].active && <span className="ml-2 text-xs">(Coming Soon)</span>}
            </button>
          ))}
        </div>

        {/* Countdown Timer */}
        {!isDropActive() && currentDrop.active && (
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-8 mb-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-4">
              {currentDrop.name} Starts In:
            </h3>
            <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
              {Object.entries(countdown).map(([unit, value]) => (
                <div key={unit} className="bg-black/50 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-red-400">{value}</div>
                  <div className="text-sm text-gray-400 uppercase mt-1">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perks */}
        {isDropActive() && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6" />
              {currentDrop.name} Exclusive Perks
            </h3>
            <ul className="space-y-2">
              {currentDrop.perks.map((perk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Minting Cards */}
        {isDropActive() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
            {['bronze', 'silver', 'gold'].map(rarity => {
              const supply = currentDrop.supply[rarity];
              const remaining = supply.total - supply.minted;
              const percentMinted = (supply.minted / supply.total) * 100;

              return (
                <div
                  key={rarity}
                  className={`bg-gradient-to-br ${getRarityColor(rarity)} p-0.5 rounded-xl`}
                >
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold capitalize mb-1">{rarity} Herald</h3>
                      <p className="text-3xl font-bold">{supply.price} ETH</p>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Supply</span>
                        <span className="font-bold">{remaining}/{supply.total}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${getRarityColor(rarity)} h-2 rounded-full transition-all`}
                          style={{ width: `${percentMinted}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-400 mb-2">Daily Mining Rate:</div>
                      <div className="text-xl font-bold">
                        {rarity === 'bronze' ? '50' : rarity === 'silver' ? '100' : '200'} $KINGSFOOD
                      </div>
                    </div>

                    <button
                      onClick={() => mintHerald(rarity)}
                      disabled={minting || remaining === 0 || !connected}
                      className={`w-full py-3 rounded-lg font-bold transition ${
                        remaining === 0
                          ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                          : minting
                          ? 'bg-gray-700 cursor-wait text-gray-300'
                          : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                      }`}
                    >
                      {!connected
                        ? 'Connect Wallet'
                        : remaining === 0
                        ? 'SOLD OUT'
                        : minting
                        ? 'Minting...'
                        : `Mint ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Herald`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mint Success Modal */}
        {mintSuccess && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-green-500/50">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Herald Minted!</h3>
                <p className="text-gray-400 mb-6">Congratulations on your new Herald NFT</p>
                
                <div className={`bg-gradient-to-br ${mintSuccess.clan.color} p-0.5 rounded-xl mb-6`}>
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="text-yellow-400 font-bold text-lg mb-2 capitalize">{mintSuccess.rarity}</div>
                    <div className="text-2xl font-bold mb-1">{mintSuccess.clan.name}</div>
                    <div className="text-sm text-gray-400">Token #{mintSuccess.tokenId}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price Paid:</span>
                    <span className="font-bold">{mintSuccess.price} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily Rewards:</span>
                    <span className="font-bold">
                      {mintSuccess.rarity === 'gold' ? '200' : mintSuccess.rarity === 'silver' ? '100' : '50'} FOOD
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMintSuccess(null)}
                  className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Affiliate System */}
        {connected && userAffiliateCode && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Your Affiliate Code
            </h3>
            <p className="text-gray-300 mb-4">
              Share your unique link and earn {selectedDrop === 'GENESIS_DROP' ? '10%' : '5%'} commission on every Herald minted through your referral!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`https://kings-of-red-e2b2.vercel.app/mint?ref=${userAffiliateCode}`}
                readOnly
                className="flex-1 bg-black/50 border border-green-500/30 rounded-lg px-4 py-2 font-mono text-sm"
              />
              <button
                onClick={copyAffiliateLink}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold transition"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Random Clan Info */}
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4">Seven Legendary Clans</h3>
          <p className="text-gray-300 mb-4">
            Your Herald's clan is randomly assigned during minting. Each clan has unique lore and future utility. Collect them all or trade for your favorites!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CLANS.map(clan => {
              const ClanIcon = clan.icon;
              return (
                <div key={clan.id} className={`bg-gradient-to-br ${clan.color} p-0.5 rounded-lg`}>
                  <div className="bg-gray-900 rounded-lg p-3 text-center">
                    <ClanIcon className="w-6 h-6 mx-auto mb-2 opacity-70" />
                    <div className="text-sm font-bold">{clan.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ / Info */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">What happens after minting?</h4>
            <p className="text-gray-300 text-sm">
              Your Herald NFT will appear in your wallet immediately. Head to the game platform to stake your Herald and start earning $KINGSFOOD tokens every 24 hours!
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">Can I choose my clan?</h4>
            <p className="text-gray-300 text-sm">
              No, clans are randomly assigned to ensure fair distribution and create an active secondary marketplace where players trade to complete their collections.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">What's the difference between rarities?</h4>
            <p className="text-gray-300 text-sm">
              Bronze Heralds produce 50 FOOD/day, Silver produce 100 FOOD/day, and Gold produce 200 FOOD/day. Gold Heralds also provide larger battle boosts in future updates.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">⚠️ TESTNET VERSION - Replace mock wallet connection with real Web3 integration</p>
            <p>Kings of Red © 2024 • Built on Base Network</p>
          </div>
        </div>
      </div>
    </div>
  );
}