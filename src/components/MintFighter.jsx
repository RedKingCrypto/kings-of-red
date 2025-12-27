import React, { useState, useEffect } from 'react';
import { Shield, Swords, Crown, Sparkles, Users, Trophy, Gift, Plus, Minus, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import { FIGHTER_CONTRACT, FIGHTER_ABI } from '../contractConfig';

const CLANS = [
  { id: 0, name: 'Smizfume', fighter: 'Kenshi Champion', color: 'from-purple-600 to-pink-600' },
  { id: 1, name: 'Coalheart', fighter: 'Shinobi', color: 'from-red-600 to-orange-600' },
  { id: 2, name: 'Warmdice', fighter: 'Boarding Bruiser', color: 'from-yellow-600 to-amber-600' },
  { id: 3, name: 'Bervation', fighter: 'Templar Guard', color: 'from-blue-600 to-cyan-600' },
  { id: 4, name: 'Konfisof', fighter: 'Enforcer', color: 'from-green-600 to-emerald-600' },
  { id: 5, name: 'Witkastle', fighter: 'Knight', color: 'from-indigo-600 to-violet-600' },
  { id: 6, name: 'Bowkin', fighter: 'Oakwood Guardian', color: 'from-teal-600 to-cyan-600' }
];

export default function FighterMintingPage({ onNavigate, connected, walletAddress, connectWallet, provider, signer }) {
 
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [quantities, setQuantities] = useState({
    bronze: 1,
    silver: 1,
    gold: 1
  });
  
  // Contract data
  const [supply, setSupply] = useState({
    bronze: { total: 777, genesis: 98, minted: 0, price: '0.00638' },
    silver: { total: 560, genesis: 77, minted: 0, price: '0.00974' },
    gold: { total: 343, genesis: 49, minted: 0, price: '0.01310' }
  });
  const [loading, setLoading] = useState(false);
  const [genesisSale, setGenesisSale] = useState(false);

  // Check URL for referral code on mount AND load stored code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    } else {
      const storedCode = localStorage.getItem('referralCode');
      const expiry = localStorage.getItem('referralExpiry');
      
      if (storedCode && expiry) {
        const expiryTime = parseInt(expiry);
        if (Date.now() < expiryTime) {
          setReferralCode(storedCode);
          console.log(`✅ Using stored referral: ${storedCode}`);
        } else {
          localStorage.removeItem('referralCode');
          localStorage.removeItem('referralExpiry');
          console.log('⏰ Referral code expired');
        }
      }
    }
  }, []);

  }, []);

  // Load contract data on mount
  useEffect(() => {
    loadContractData();
  }, [connected, walletAddress]);

    const loadContractData = async () => {
  try {
    setLoading(true);
    
    // Use provider from props if connected, otherwise create read-only provider
    const contractProvider = connected && provider 
      ? provider 
      : new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, contractProvider);
    
    const [bronzeMinted, silverMinted, goldMinted, bronzePrice, silverPrice, goldPrice, isGenesis] = await Promise.all([
      contract.bronzeMinted(),
      contract.silverMinted(),
      contract.goldMinted(),
      contract.bronzePrice(),
      contract.silverPrice(),
      contract.goldPrice(),
      contract.genesisSaleActive()
    ]);
    
    console.log('Fighter contract data loaded:', {
      bronze: Number(bronzeMinted),
      silver: Number(silverMinted),
      gold: Number(goldMinted),
      genesisSale: isGenesis
    });
    
    setSupply({
      bronze: { 
        total: 777,
        genesis: 98,
        minted: Number(bronzeMinted), 
        price: ethers.formatEther(bronzePrice) 
      },
      silver: { 
        total: 560,
        genesis: 77,
        minted: Number(silverMinted), 
        price: ethers.formatEther(silverPrice) 
      },
      gold: { 
        total: 343,
        genesis: 49,
        minted: Number(goldMinted), 
        price: ethers.formatEther(goldPrice) 
      }
    });
    
    setGenesisSale(isGenesis);
  } catch (error) {
    console.error('Error loading contract data:', error);
  } finally {
    setLoading(false);
  }
};

  const updateQuantity = (rarity, change) => {
    setQuantities(prev => {
      const newQty = prev[rarity] + change;
      const maxSupply = genesisSale ? supply[rarity].genesis : supply[rarity].total;
      const remaining = maxSupply - supply[rarity].minted;
      return {
        ...prev,
        [rarity]: Math.max(1, Math.min(7, Math.min(newQty, remaining)))
      };
    });
  };

  const MintFighter = async (rarity) => {
  if (!connected) {
    alert('Please connect your wallet first!');
    return;
  }

  setMinting(true);

  try {
    // Use signer from props (passed from Application.jsx)
    if (!signer) {
      alert('Please connect your wallet first!');
      setMinting(false);
      return;
    }

    const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, signer);
    
    let pricePerNFT;
    let rarityNum;
    let rarityName;
    const quantity = quantities[rarity];
    
    if (rarity === 'bronze') {
      pricePerNFT = await contract.bronzePrice();
      rarityNum = 0;
      rarityName = 'Bronze';
    } else if (rarity === 'silver') {
      pricePerNFT = await contract.silverPrice();
      rarityNum = 1;
      rarityName = 'Silver';
    } else {
      pricePerNFT = await contract.goldPrice();
      rarityNum = 2;
      rarityName = 'Gold';
    }
    
    const totalPrice = pricePerNFT * BigInt(quantity);
    
    const maxSupply = genesisSale ? supply[rarity].genesis : supply[rarity].total;
    const remaining = maxSupply - supply[rarity].minted;
    
    if (remaining <= 0) {
      alert(`${rarityName} Fighters are sold out!`);
      setMinting(false);
      return;
    }
    
    if (quantity > remaining) {
      alert(`Only ${remaining} ${rarityName} Fighter${remaining > 1 ? 's' : ''} remaining!`);
      setMinting(false);
      return;
    }
    
    console.log('🎯 Minting with:', {
      contract: FIGHTER_CONTRACT,
      rarity: rarityName,
      rarityNum,
      quantity,
      totalPrice: ethers.formatEther(totalPrice)
    });
    
    // The new contract doesn't have referral codes in mintBronze/mintSilver/mintGold
    // Call the appropriate mint function based on rarity
    let tx;
    if (rarity === 'bronze') {
      tx = await contract.mintBronze({ value: totalPrice });
    } else if (rarity === 'silver') {
      tx = await contract.mintSilver({ value: totalPrice });
    } else {
      tx = await contract.mintGold({ value: totalPrice });
    }
    
    alert(`Transaction sent! Minting ${quantity} Fighter${quantity > 1 ? 's' : ''}...\n\nThis may take 10-30 seconds.`);
    
    const receipt = await tx.wait();
    
    setMintSuccess({
      rarity: rarityName,
      quantity: quantity,
      totalPrice: ethers.formatEther(totalPrice),
      pricePerNFT: ethers.formatEther(pricePerNFT),
      txHash: receipt.hash
    });
    
    await loadContractData();
    
  } catch (error) {
    console.error('❌ Minting failed:', error);
    
    if (error.code === 'ACTION_REJECTED') {
      alert('Transaction cancelled by user.');
    } else if (error.message.includes('insufficient funds')) {
      alert('Insufficient funds. Please add more ETH to your wallet on Base network.');
    } else {
      alert('Minting failed: ' + (error.reason || error.message || 'Unknown error'));
    }
  } finally {
    setMinting(false);
  }
};

  const getRarityColor = (rarity) => {
    const r = rarity.toLowerCase();
    switch(r) {
      case 'gold': return 'from-yellow-600 to-amber-500';
      case 'silver': return 'from-gray-400 to-slate-300';
      case 'bronze': return 'from-orange-600 to-amber-700';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {referralCode && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🤝</span>
                <span className="font-bold text-green-400">Referral Active</span>
              </div>
              <p className="text-sm text-gray-300 text-center">
                Code: <strong className="text-white">{referralCode}</strong>
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Your mint will support this referrer (they earn 7% commission)
              </p>
            </div>
          )}
          
          <div className="inline-block mb-4">
            <Sparkles className="w-16 h-16 mx-auto text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-5xl font-bold mb-4">Mint Your Fighter NFT</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Choose your warrior! Fighters battle monsters for rewards. Higher rarity = better hit chance = easier victories!
          </p>
          
          {loading && (
            <p className="text-yellow-400 animate-pulse">Loading contract data...</p>
          )}
        </div>

        {/* Genesis Sale Perks */}
        {genesisSale && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Genesis Sale Exclusive
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Limited supply - Only 1,680 Fighters total</span>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Guaranteed lowest price for First Generation Fighters</span>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Mint up to 7 at once to save gas fees</span>
              </li>
            </ul>
          </div>
        )}

        {/* Minting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {['bronze', 'silver', 'gold'].map(rarity => {
            const rarityData = supply[rarity];
            const maxSupply = genesisSale ? rarityData.genesis : rarityData.total;
            const remaining = maxSupply - rarityData.minted;
            const percentMinted = (rarityData.minted / maxSupply) * 100;
            const quantity = quantities[rarity];
            const pricePerNFT = parseFloat(rarityData.price);
            const totalPrice = (pricePerNFT * quantity).toFixed(5);
            const totalPriceUSD = (pricePerNFT * quantity * 2977).toFixed(2);

            return (
              <div
                key={rarity}
                className={`bg-gradient-to-br ${getRarityColor(rarity)} p-0.5 rounded-xl`}
              >
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold capitalize mb-1">{rarity} Fighter</h3>
                    <p className="text-2xl font-bold">{rarityData.price} ETH</p>
                    <p className="text-sm text-gray-400">≈ ${(pricePerNFT * 2977).toFixed(2)}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">
                        {genesisSale ? 'Genesis Supply' : 'Supply'}
                      </span>
                      <span className="font-bold">{remaining}/{maxSupply}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getRarityColor(rarity)} h-2 rounded-full transition-all`}
                        style={{ width: `${percentMinted}%` }}
                      />
                    </div>
                    {genesisSale && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Genesis: {maxSupply} | Total: {rarityData.total}
                      </p>
                    )}
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-400 mb-2">Base Hit Chance:</div>
                    <div className="text-xl font-bold">
                      {rarity === 'bronze' ? '20%' : rarity === 'silver' ? '30%' : '40%'}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {remaining > 0 && connected && (
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-400 mb-2 text-center">Quantity</div>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => updateQuantity(rarity, -1)}
                          disabled={quantity <= 1}
                          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed p-2 rounded-lg transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(rarity, 1)}
                          disabled={quantity >= 7 || quantity >= remaining}
                          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed p-2 rounded-lg transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {quantity > 1 && (
                        <div className="mt-3 text-center">
                          <div className="text-sm text-gray-400">Total Cost</div>
                          <div className="text-xl font-bold">{totalPrice} ETH</div>
                          <div className="text-xs text-gray-400">≈ ${totalPriceUSD}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => MintFighter(rarity)}
                    disabled={minting || remaining === 0 || !connected}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      remaining === 0
                        ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                        : minting
                        ? 'bg-gray-700 cursor-wait text-gray-300'
                        : !connected
                        ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                        : 'bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700'
                    }`}
                  >
                    {remaining === 0
                      ? 'SOLD OUT'
                      : minting
                      ? 'Minting...'
                      : !connected
                      ? 'Connect Wallet to Mint'
                      : `Mint ${quantity} Fighter${quantity > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Modal */}
        {mintSuccess && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full border border-green-500/50">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {mintSuccess.quantity} Fighter{mintSuccess.quantity > 1 ? 's' : ''} Minted!
                </h3>
                <p className="text-gray-400 mb-6">
                  Your {mintSuccess.rarity} Fighter{mintSuccess.quantity > 1 ? 's' : ''} are ready for battle
                </p>

                <div className="space-y-2 mb-6 bg-black/30 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="font-bold">{mintSuccess.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price Per NFT:</span>
                    <span className="font-bold">{mintSuccess.pricePerNFT} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Paid:</span>
                    <span className="font-bold">{mintSuccess.totalPrice} ETH</span>
                  </div>
                </div>

                <a
                  href={`https://basescan.org/tx/${mintSuccess.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition mb-3 text-center"
                >
                  View on BaseScan
                </a>

                <button
                  onClick={() => {
                    setMintSuccess(null);
                    loadContractData();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Home Arena Bonus */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">Home Arena Bonus</h3>
              <p className="text-gray-300">
                When your Fighter battles in their clan's arena, they receive <strong className="text-yellow-400">+4% hit chance!</strong> Each Fighter is randomly assigned to one of seven clans during minting.
              </p>
            </div>
          </div>
        </div>

        {/* Seven Clans */}
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4">Seven Legendary Fighter Clans</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CLANS.map(clan => (
              <div key={clan.id} className={`bg-gradient-to-br ${clan.color} p-0.5 rounded-lg`}>
                <div className="bg-gray-900 rounded-lg p-3 text-center">
                  <Swords className="w-6 h-6 mx-auto mb-2 opacity-70" />
                  <div className="text-sm font-bold">{clan.name}</div>
                  <div className="text-xs text-gray-400">{clan.fighter}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Fighters */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-center mb-6">About Fighters</h3>
          
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-3 text-yellow-400 flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Battle System
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Stake your Fighter to enable battles</li>
              <li>• Each Fighter starts with 100 energy</li>
              <li>• Each battle costs 20 energy</li>
              <li>• Refuel with FOOD tokens + 3 hours wait</li>
              <li>• Win battles to earn FOOD, GOLD, WOOD, and RKT tokens!</li>
            </ul>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-3 text-yellow-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Forging
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Forge 2 Bronze → 1 Silver</li>
              <li>• Forge 2 Silver → 1 Gold</li>
              <li>• Forged Fighters keep the clan from the first Fighter</li>
              <li>• Increase your Fighter's power through forging!</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">Why mint multiple at once?</h4>
            <p className="text-gray-300 text-sm">
              Minting up to 7 Fighters in one transaction saves you gas fees and gives you more warriors for battle!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}