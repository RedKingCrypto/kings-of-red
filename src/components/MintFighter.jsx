import React, { useState, useEffect } from 'react';
import { Shield, Swords, Crown, Sparkles, Users, Trophy, Gift, Plus, Minus, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  FIGHTER_V4_ADDRESS, 
  FIGHTER_V4_ABI, 
  PHASE_LIMITS,
  MAX_BRONZE,
  MAX_SILVER,
  MAX_GOLD
} from '../contractConfig';

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
    bronze: { total: MAX_BRONZE, genesisLimit: 98, genesisRemaining: 98, minted: 0, price: '0.00638' },
    silver: { total: MAX_SILVER, genesisLimit: 77, genesisRemaining: 77, minted: 0, price: '0.00974' },
    gold: { total: MAX_GOLD, genesisLimit: 49, genesisRemaining: 49, minted: 0, price: '0.01310' }
  });
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [contractReady, setContractReady] = useState(false);

  // Check URL for referral code on mount
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

  // Load contract data on mount
  useEffect(() => {
    loadContractData();
  }, [connected, walletAddress]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      
      const contractProvider = connected && provider 
        ? provider 
        : new ethers.JsonRpcProvider('https://mainnet.base.org');
      
      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, contractProvider);
      
      // Read current phase
      const phase = await contract.currentPhase();
      setCurrentPhase(Number(phase));
      
      // Check if contract is ready (clan arrays initialized, minting not paused)
      const [clanArraysReady, mintingPaused] = await Promise.all([
        contract.clanArraysInitialized(),
        contract.mintingPaused()
      ]);
      setContractReady(clanArraysReady && !mintingPaused && Number(phase) > 0);
      
      // Get phase supply (returns remaining, not limits)
      // getPhaseSupply() returns (phase, bronzeRemaining, silverRemaining, goldRemaining)
      const phaseSupply = await contract.getPhaseSupply();
      
      // Get prices and total minted
      const [bronzeMinted, silverMinted, goldMinted, bronzePrice, silverPrice, goldPrice] = await Promise.all([
        contract.bronzeMinted(),
        contract.silverMinted(),
        contract.goldMinted(),
        contract.bronzePrice(),
        contract.silverPrice(),
        contract.goldPrice()
      ]);
      
      // Get phase limits from constants
      const phaseLimits = PHASE_LIMITS[Number(phase)] || { bronze: 0, silver: 0, gold: 0 };
      
      setSupply({
        bronze: { 
          total: MAX_BRONZE,
          genesisLimit: phaseLimits.bronze,
          genesisRemaining: Number(phaseSupply[1]), // bronzeRemaining from contract
          minted: Number(bronzeMinted), 
          price: ethers.formatEther(bronzePrice) 
        },
        silver: { 
          total: MAX_SILVER,
          genesisLimit: phaseLimits.silver,
          genesisRemaining: Number(phaseSupply[2]), // silverRemaining
          minted: Number(silverMinted), 
          price: ethers.formatEther(silverPrice) 
        },
        gold: { 
          total: MAX_GOLD,
          genesisLimit: phaseLimits.gold,
          genesisRemaining: Number(phaseSupply[3]), // goldRemaining
          minted: Number(goldMinted), 
          price: ethers.formatEther(goldPrice) 
        }
      });
      
      console.log('✅ Contract data loaded:', {
        phase: Number(phase),
        contractReady: clanArraysReady && !mintingPaused,
        bronzeRemaining: Number(phaseSupply[1]),
        silverRemaining: Number(phaseSupply[2]),
        goldRemaining: Number(phaseSupply[3])
      });
      
    } catch (error) {
      console.error('Error loading contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (rarity, change) => {
    setQuantities(prev => {
      const newQty = prev[rarity] + change;
      const remaining = supply[rarity].genesisRemaining;
      return {
        ...prev,
        [rarity]: Math.max(1, Math.min(7, Math.min(newQty, remaining)))
      };
    });
  };

  const mintFighter = async (rarity) => {
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!contractReady) {
      alert('Minting is not currently active. Please check back later.');
      return;
    }

    setMinting(true);

    try {
      if (!signer) {
        alert('Please connect your wallet first!');
        setMinting(false);
        return;
      }

      const contract = new ethers.Contract(FIGHTER_V4_ADDRESS, FIGHTER_V4_ABI, signer);
      const quantity = quantities[rarity];
      
      let pricePerNFT;
      let mintFunction;
      let rarityName;
      
      // Fighter V4 uses separate mint functions with quantity parameter
      if (rarity === 'bronze') {
        pricePerNFT = await contract.bronzePrice();
        mintFunction = 'mintBronze';
        rarityName = 'Bronze';
      } else if (rarity === 'silver') {
        pricePerNFT = await contract.silverPrice();
        mintFunction = 'mintSilver';
        rarityName = 'Silver';
      } else {
        pricePerNFT = await contract.goldPrice();
        mintFunction = 'mintGold';
        rarityName = 'Gold';
      }
      
      const totalPrice = pricePerNFT * BigInt(quantity);
      const remaining = supply[rarity].genesisRemaining;
      
      if (remaining <= 0) {
        alert(`${rarityName} Fighters are sold out for this phase!`);
        setMinting(false);
        return;
      }
      
      if (quantity > remaining) {
        alert(`Only ${remaining} ${rarityName} Fighter${remaining > 1 ? 's' : ''} remaining in this phase!`);
        setMinting(false);
        return;
      }
      
      console.log('🎯 Minting with Fighter V4:', {
        contract: FIGHTER_V4_ADDRESS,
        function: mintFunction,
        rarity: rarityName,
        quantity,
        pricePerNFT: ethers.formatEther(pricePerNFT),
        totalPrice: ethers.formatEther(totalPrice)
      });
      
      // Fighter V4: mintBronze(amount), mintSilver(amount), mintGold(amount)
      // All mints happen in ONE transaction!
      const tx = await contract[mintFunction](quantity, { value: totalPrice });
      
      console.log('📝 Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      // Parse minted token IDs from events
      let mintedTokenIds = [];
      try {
        receipt.logs.forEach(log => {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'FighterMinted') {
              mintedTokenIds.push(parsed.args.tokenId.toString());
              console.log(`🎉 Minted Fighter #${parsed.args.tokenId} - ${rarityName} Clan ${parsed.args.clan}`);
            }
          } catch (e) {
            // Not a FighterMinted event
          }
        });
      } catch (e) {
        console.log('Could not parse mint events:', e);
      }
      
      setMintSuccess({
        rarity: rarityName,
        quantity: mintedTokenIds.length || quantity,
        tokenIds: mintedTokenIds,
        totalPrice: ethers.formatEther(totalPrice),
        pricePerNFT: ethers.formatEther(pricePerNFT),
        txHash: receipt.hash
      });
      
      // Reload contract data
      await loadContractData();
      
    } catch (error) {
      console.error('❌ Minting failed:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction cancelled by user.');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient funds. Please add more ETH to your wallet on Base network.');
      } else if (error.message?.includes('M') || error.message?.includes('Minting')) {
        alert('Minting is currently paused. Please try again later.');
      } else if (error.message?.includes('P') || error.message?.includes('phase')) {
        alert('Sale is not active. Please wait for the sale to begin.');
      } else if (error.message?.includes('X') || error.message?.includes('supply')) {
        alert('Not enough supply remaining. Try minting fewer Fighters.');
      } else {
        alert('Minting failed: ' + (error.reason || error.shortMessage || error.message || 'Unknown error'));
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

  const getPhaseName = (phase) => {
    switch(phase) {
      case 1: return 'Genesis';
      case 2: return 'Early Bird';
      case 3: return 'Public A';
      case 4: return 'Public B';
      default: return 'Inactive';
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
          
          {/* Phase indicator */}
          {currentPhase > 0 && (
            <div className="inline-block bg-purple-600/30 border border-purple-500/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-purple-300">Current Phase:</span>{' '}
              <span className="font-bold text-white">{getPhaseName(currentPhase)}</span>
            </div>
          )}
          
          {loading && (
            <p className="text-yellow-400 animate-pulse">Loading contract data...</p>
          )}
          
          {!contractReady && !loading && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-400">⚠️ Minting is not currently active</p>
              <p className="text-sm text-gray-400 mt-1">Please check back when the sale begins</p>
            </div>
          )}
        </div>

        {/* Genesis Sale Perks */}
        {currentPhase === 1 && (
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
            const remaining = rarityData.genesisRemaining;
            const genesisLimit = rarityData.genesisLimit;
            const genesisMinted = genesisLimit - remaining;
            const percentMinted = genesisLimit > 0 ? (genesisMinted / genesisLimit) * 100 : 0;
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
                        {getPhaseName(currentPhase)} Supply
                      </span>
                      <span className="font-bold">{remaining}/{genesisLimit}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getRarityColor(rarity)} h-2 rounded-full transition-all`}
                        style={{ width: `${percentMinted}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getPhaseName(currentPhase)}: {genesisLimit} | Total: {rarityData.total}
                    </p>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-400 mb-2">Base Hit Chance:</div>
                    <div className="text-xl font-bold">
                      {rarity === 'bronze' ? '20%' : rarity === 'silver' ? '30%' : '40%'}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {remaining > 0 && connected && contractReady && (
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
                    onClick={() => mintFighter(rarity)}
                    disabled={minting || remaining === 0 || !connected || !contractReady}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      remaining === 0
                        ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                        : minting
                        ? 'bg-gray-700 cursor-wait text-gray-300'
                        : !connected
                        ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                        : !contractReady
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
                      : !contractReady
                      ? 'Sale Not Active'
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
                  Your {mintSuccess.rarity} Fighter{mintSuccess.quantity > 1 ? 's are' : ' is'} ready for battle
                </p>

                <div className="space-y-2 mb-6 bg-black/30 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="font-bold">{mintSuccess.quantity}</span>
                  </div>
                  {mintSuccess.tokenIds?.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Token IDs:</span>
                      <span className="font-bold">{mintSuccess.tokenIds.join(', ')}</span>
                    </div>
                  )}
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