import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords, Sparkles, Users, Trophy, Gift, Plus, Minus } from 'lucide-react';
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

export default function HeraldMintingPage({ onNavigate, connected, walletAddress, connectWallet }) {
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [userAffiliateCode, setUserAffiliateCode] = useState('');
  const [quantities, setQuantities] = useState({
    bronze: 1,
    silver: 1,
    gold: 1
  });
  
  // Contract data
  const [supply, setSupply] = useState({
    bronze: { total: 100, minted: 0, price: '0.00221' },
    silver: { total: 77, minted: 0, price: '0.00728' },
    gold: { total: 43, minted: 0, price: '0.01234' }
  });
  const [loading, setLoading] = useState(false);

  // Check URL for affiliate code on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setAffiliateCode(refCode);
    }
  }, []);

  // Load contract data on mount and when connected
  useEffect(() => {
    loadContractData();
    if (connected && walletAddress) {
      checkGenesisStatus();
    }
  }, [connected, walletAddress]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      
      // Use connected wallet provider if available, otherwise use public RPC
      let provider;
      if (window.ethereum && connected) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        provider = new ethers.JsonRpcProvider(BASE_MAINNET_CONFIG.rpcUrls[0]);
      }
      
      const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, provider);
      
      // Load supply data - force fresh read
      const [bronzeMinted, silverMinted, goldMinted, bronzePrice, silverPrice, goldPrice] = await Promise.all([
        contract.bronzeMinted(),
        contract.silverMinted(),
        contract.goldMinted(),
        contract.bronzePrice(),
        contract.silverPrice(),
        contract.goldPrice()
      ]);
      
      console.log('Contract data loaded:', {
        bronze: Number(bronzeMinted),
        silver: Number(silverMinted),
        gold: Number(goldMinted)
      });
      
      setSupply({
        bronze: { 
          total: 100, 
          minted: Number(bronzeMinted), 
          price: ethers.formatEther(bronzePrice) 
        },
        silver: { 
          total: 77, 
          minted: Number(silverMinted), 
          price: ethers.formatEther(silverPrice) 
        },
        gold: { 
          total: 43, 
          minted: Number(goldMinted), 
          price: ethers.formatEther(goldPrice) 
        }
      });
    } catch (error) {
      console.error('Error loading contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGenesisStatus = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, provider);
    
    // Check if user has Genesis badge
    const hasGenesis = await contract.hasGenesisBadge(walletAddress);
    
    // Get the actual affiliate code from the contract
    const code = await contract.affiliateCode(walletAddress);
    
    if (code && code !== '') {
      setUserAffiliateCode(code);
      console.log('Affiliate code loaded:', code);
    } else {
      console.log('No affiliate code yet for this wallet');
    }
  } catch (error) {
    console.error('Error checking Genesis status:', error);
  }
};

  const updateQuantity = (rarity, change) => {
    setQuantities(prev => {
      const newQty = prev[rarity] + change;
      const remaining = supply[rarity].total - supply[rarity].minted;
      // Clamp between 1 and min(7, remaining)
      return {
        ...prev,
        [rarity]: Math.max(1, Math.min(7, Math.min(newQty, remaining)))
      };
    });
  };

  const mintHerald = async (rarity) => {
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    setMinting(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, signer);
      
      // Get price and quantity for this rarity
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
      
      // Calculate total price
      const totalPrice = pricePerNFT * BigInt(quantity);
      
      // Check if sold out
      const remaining = supply[rarity].total - supply[rarity].minted;
      if (remaining <= 0) {
        alert(`${rarityName} Heralds are sold out!`);
        setMinting(false);
        return;
      }
      
      if (quantity > remaining) {
        alert(`Only ${remaining} ${rarityName} Herald${remaining > 1 ? 's' : ''} remaining!`);
        setMinting(false);
        return;
      }
      
      // Send mint transaction with affiliate code
      const refCode = affiliateCode || '';
      const tx = await contract.mintHerald(rarityNum, quantity, refCode, { value: totalPrice });
      
      alert(`Transaction sent! Minting ${quantity} Herald${quantity > 1 ? 's' : ''}...\n\nThis may take 10-30 seconds.`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Parse the HeraldMinted events to get clan and tokenIds
      let mintedNFTs = [];
      
      try {
        receipt.logs.forEach(log => {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'HeraldMinted') {
              mintedNFTs.push({
                tokenId: parsed.args.tokenId.toString(),
                clan: Number(parsed.args.clan)
              });
            }
          } catch {
            // Skip logs that aren't HeraldMinted events
          }
        });
      } catch (error) {
        console.error('Error parsing events:', error);
      }
      
      // If we couldn't parse events, create placeholder data
      if (mintedNFTs.length === 0) {
        for (let i = 0; i < quantity; i++) {
          mintedNFTs.push({
            tokenId: '???',
            clan: Math.floor(Math.random() * 7)
          });
        }
      }
      
      setMintSuccess({
        rarity: rarityName,
        nfts: mintedNFTs.map(nft => ({
          ...nft,
          clanData: CLANS[nft.clan]
        })),
        quantity: quantity,
        totalPrice: ethers.formatEther(totalPrice),
        pricePerNFT: ethers.formatEther(pricePerNFT),
        txHash: receipt.hash
      });
      
      // Reload contract data
      await loadContractData();
      
      // Check if this was their first mint (Genesis badge)
      if (connected && walletAddress) {
        await checkGenesisStatus();
      }
      
    } catch (error) {
      console.error('Minting failed:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction cancelled by user.');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient funds. Please add more ETH to your wallet on Base network.');
      } else if (error.message.includes('sold out')) {
        alert('This Herald rarity is sold out!');
      } else {
        alert('Minting failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    } finally {
      setMinting(false);
    }
  };

  const copyAffiliateLink = () => {
    const link = `https://kingsofred.com/mint?ref=${userAffiliateCode}`;
    navigator.clipboard.writeText(link);
    alert('Affiliate link copied to clipboard!');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
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
          
          {loading && (
            <p className="text-yellow-400 animate-pulse">Loading contract data...</p>
          )}
        </div>

        {/* Genesis Sale Perks */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6" />
            Genesis Sale Exclusive Perks
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Guaranteed lowest price for First Generation Herald NFTs</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Exclusive Genesis Badge NFT + 7% affiliate commission</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Mint up to 7 NFTs at once to save on gas fees</span>
            </li>
          </ul>
        </div>

        {/* Minting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {['bronze', 'silver', 'gold'].map(rarity => {
            const rarityData = supply[rarity];
            const remaining = rarityData.total - rarityData.minted;
            const percentMinted = (rarityData.minted / rarityData.total) * 100;
            const quantity = quantities[rarity];
            const pricePerNFT = parseFloat(rarityData.price);
            const totalPrice = (pricePerNFT * quantity).toFixed(5);
            const totalPriceUSD = (pricePerNFT * quantity * 3160).toFixed(2);

            return (
              <div
                key={rarity}
                className={`bg-gradient-to-br ${getRarityColor(rarity)} p-0.5 rounded-xl`}
              >
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold capitalize mb-1">{rarity} Herald</h3>
                    <p className="text-2xl font-bold">{rarityData.price} ETH</p>
                    <p className="text-sm text-gray-400">per NFT</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Supply</span>
                      <span className="font-bold">{remaining}/{rarityData.total}</span>
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
                      {rarity === 'bronze' ? '20' : rarity === 'silver' ? '65' : '100'} $KINGSFOOD
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
                    onClick={() => mintHerald(rarity)}
                    disabled={minting || remaining === 0 || !connected}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      remaining === 0
                        ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                        : minting
                        ? 'bg-gray-700 cursor-wait text-gray-300'
                        : !connected
                        ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                        : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                    }`}
                  >
                    {remaining === 0
                      ? 'SOLD OUT'
                      : minting
                      ? 'Minting...'
                      : !connected
                      ? 'Connect Wallet to Mint'
                      : `Mint ${quantity} Herald${quantity > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mint Success Modal */}
        {mintSuccess && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full border border-green-500/50 max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {mintSuccess.quantity} Herald{mintSuccess.quantity > 1 ? 's' : ''} Minted!
                </h3>
                <p className="text-gray-400 mb-6">
                  Congratulations on your new {mintSuccess.rarity} Herald{mintSuccess.quantity > 1 ? 's' : ''}
                </p>
                
                {/* Display all minted NFTs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {mintSuccess.nfts.map((nft, idx) => (
                    <div key={idx} className={`bg-gradient-to-br ${nft.clanData.color} p-0.5 rounded-xl`}>
                      <div className="bg-gray-800 rounded-xl p-4">
                        <div className="text-yellow-400 font-bold text-sm mb-1">{mintSuccess.rarity}</div>
                        <div className="text-xl font-bold mb-1">{nft.clanData.name}</div>
                        <div className="text-xs text-gray-400">Token #{nft.tokenId}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6 bg-black/30 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="font-bold">{mintSuccess.quantity} NFT{mintSuccess.quantity > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price Per NFT:</span>
                    <span className="font-bold">{mintSuccess.pricePerNFT} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Paid:</span>
                    <span className="font-bold">{mintSuccess.totalPrice} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily Rewards:</span>
                    <span className="font-bold">
                      {(mintSuccess.rarity === 'Gold' ? 100 : mintSuccess.rarity === 'Silver' ? 65 : 20) * mintSuccess.quantity} FOOD/day
                    </span>
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
              Your Genesis Affiliate Code
            </h3>
            <p className="text-gray-300 mb-4">
              Share your unique link and earn 7% commission (paid instantly in ETH) on every Herald minted through your referral!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`https://kingsofred.com/mint?ref=${userAffiliateCode}`}
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
              Your Herald NFT will appear in your wallet immediately. Once staking opens you can stake your Herald and start earning $KINGSFOOD tokens every 24 hours!
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">Can I choose my clan?</h4>
            <p className="text-gray-300 text-sm">
              No, clans are randomly assigned to ensure fair distribution and create an active secondary marketplace where players trade to complete their collections.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">Why mint multiple at once?</h4>
            <p className="text-gray-300 text-sm">
              Minting up to 7 NFTs in one transaction saves you gas fees! 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}