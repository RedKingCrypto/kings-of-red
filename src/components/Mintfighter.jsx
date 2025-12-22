import React, { useState, useEffect } from 'react';
import { Shield, Swords, Crown, Users, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';

const FIGHTER_CONTRACT = '0x8b2c136B30537Be53BBe1bb7511C4c43A64d6D0d';

const FIGHTER_ABI = [
  "function mintFighter(uint8 rarity, string calldata referralCode) external payable",
  "function bronzePrice() external view returns (uint256)",
  "function silverPrice() external view returns (uint256)",
  "function goldPrice() external view returns (uint256)",
  "function getSupply() external view returns (uint256, uint256, uint256)",
  "function genesisSaleActive() external view returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function getFighter(uint256 tokenId) external view returns (uint8 rarity, uint8 clan, uint8 energy, uint32 wins, uint32 losses, bool isStaked)"
];

const CLANS = [
  { id: 0, name: 'Smizfume', color: 'from-purple-600 to-pink-600', description: 'Masters of poison and alchemy' },
  { id: 1, name: 'Coalheart', color: 'from-red-600 to-orange-600', description: 'Fire and forge warriors' },
  { id: 2, name: 'Warmdice', color: 'from-yellow-600 to-amber-600', description: 'Luck and fortune seekers' },
  { id: 3, name: 'Bervation', color: 'from-blue-600 to-cyan-600', description: 'Healers and holy warriors' },
  { id: 4, name: 'Konfisof', color: 'from-green-600 to-emerald-600', description: 'Strategic tacticians' },
  { id: 5, name: 'Witkastle', color: 'from-indigo-600 to-violet-600', description: 'Morale and inspiration' },
  { id: 6, name: 'Bowkin', color: 'from-teal-600 to-cyan-600', description: 'Trappers and hunters' }
];

const RARITIES = [
  {
    id: 0,
    name: 'Bronze',
    icon: Shield,
    color: 'from-orange-700 to-yellow-800',
    borderColor: 'border-orange-600',
    bgColor: 'bg-orange-900/20',
    baseHit: '20%',
    total: 777,
    genesis: 98,
    price: null,
    perks: ['Entry-level warrior', 'Hardest difficulty', 'Great for learning']
  },
  {
    id: 1,
    name: 'Silver',
    icon: Swords,
    color: 'from-gray-400 to-gray-600',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-700/20',
    baseHit: '30%',
    total: 560,
    genesis: 77,
    price: null,
    perks: ['Balanced warrior', 'Moderate difficulty', 'Best value']
  },
  {
    id: 2,
    name: 'Gold',
    icon: Crown,
    color: 'from-yellow-400 to-yellow-600',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-600/20',
    baseHit: '40%',
    total: 343,
    genesis: 49,
    price: null,
    perks: ['Elite warrior', 'Easiest difficulty', 'Premium experience']
  }
];

const MintFighter = ({ provider, signer, address }) => {
  const [selectedRarity, setSelectedRarity] = useState(1); // Default Silver
  const [quantity, setQuantity] = useState(1);
  const [referralCode, setReferralCode] = useState('');
  const [prices, setPrices] = useState([null, null, null]);
  const [supply, setSupply] = useState([0, 0, 0]);
  const [genesisSale, setGenesisSale] = useState(false);
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [myFighters, setMyFighters] = useState([]);
  const [showMyFighters, setShowMyFighters] = useState(false);

  // Load contract data
  useEffect(() => {
    if (provider) {
      loadContractData();
    }
  }, [provider]);

  // Load user's fighters
  useEffect(() => {
    if (provider && address) {
      loadMyFighters();
    }
  }, [provider, address, txHash]); // Reload after successful mint

  const loadContractData = async () => {
    try {
      const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, provider);
      
      const [bronze, silver, gold] = await Promise.all([
        contract.bronzePrice(),
        contract.silverPrice(),
        contract.goldPrice()
      ]);
      
      setPrices([bronze, silver, gold]);
      
      const [bronzeMinted, silverMinted, goldMinted] = await contract.getSupply();
      setSupply([
        bronzeMinted.toNumber(),
        silverMinted.toNumber(),
        goldMinted.toNumber()
      ]);
      
      const isGenesis = await contract.genesisSaleActive();
      setGenesisSale(isGenesis);
    } catch (err) {
      console.error('Error loading contract data:', err);
    }
  };

  const loadMyFighters = async () => {
    try {
      const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, provider);
      const balance = await contract.balanceOf(address);
      
      const fighters = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const details = await contract.getFighter(tokenId);
        fighters.push({
          tokenId: tokenId.toNumber(),
          rarity: details.rarity,
          clan: details.clan,
          energy: details.energy,
          wins: details.wins,
          losses: details.losses,
          isStaked: details.isStaked
        });
      }
      
      setMyFighters(fighters);
    } catch (err) {
      console.error('Error loading fighters:', err);
    }
  };

  const handleMint = async () => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setMinting(true);
    setError('');
    setTxHash('');

    try {
      const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, signer);
      const price = prices[selectedRarity];
      const totalCost = price.mul(quantity);

      const tx = await contract.mintFighter(selectedRarity, referralCode, {
        value: totalCost
      });

      setTxHash(tx.hash);
      await tx.wait();

      // Reload data
      await loadContractData();
      await loadMyFighters();

      alert(`🎉 Success! Minted ${quantity} ${RARITIES[selectedRarity].name} Fighter(s)!`);
    } catch (err) {
      console.error('Minting error:', err);
      setError(err.message || 'Minting failed');
    } finally {
      setMinting(false);
    }
  };

  const getRarityInfo = (rarity) => RARITIES[rarity];
  const getClanInfo = (clan) => CLANS[clan];

  const getMaxMintable = () => {
    if (!genesisSale) return RARITIES[selectedRarity].total - supply[selectedRarity];
    return RARITIES[selectedRarity].genesis - supply[selectedRarity];
  };

  const totalPrice = prices[selectedRarity] ? 
    ethers.utils.formatEther(prices[selectedRarity].mul(quantity)) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
            Mint Your Fighter
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Choose your warrior's rarity and join the battle!
          </p>
          {genesisSale && (
            <div className="inline-block bg-yellow-600/20 border border-yellow-500 rounded-lg px-4 py-2 mt-2">
              <span className="text-yellow-400 font-bold">🎉 GENESIS SALE ACTIVE</span>
              <span className="text-gray-300 ml-2">Limited supply at special prices!</span>
            </div>
          )}
        </div>

        {/* Supply Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {RARITIES.map((rarity, index) => (
            <div key={index} className={`${rarity.bgColor} border ${rarity.borderColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <rarity.icon className="w-6 h-6" />
                  <h3 className="text-xl font-bold">{rarity.name}</h3>
                </div>
                <span className="text-2xl font-bold">
                  {supply[index]}/{genesisSale ? rarity.genesis : rarity.total}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${rarity.color}`}
                  style={{ width: `${(supply[index] / (genesisSale ? rarity.genesis : rarity.total)) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {genesisSale ? 
                  `${rarity.genesis - supply[index]} remaining in Genesis` :
                  `${rarity.total - supply[index]} remaining total`
                }
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Rarity Selection */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Swords className="w-6 h-6" />
              Select Rarity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {RARITIES.map((rarity) => (
                <div
                  key={rarity.id}
                  onClick={() => setSelectedRarity(rarity.id)}
                  className={`cursor-pointer rounded-lg p-6 border-2 transition-all ${
                    selectedRarity === rarity.id
                      ? `${rarity.borderColor} ${rarity.bgColor} scale-105`
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <rarity.icon className="w-8 h-8" />
                    <div>
                      <h3 className="text-xl font-bold">{rarity.name}</h3>
                      <p className="text-sm text-gray-400">
                        {prices[rarity.id] ? ethers.utils.formatEther(prices[rarity.id]) : '...'} ETH
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Base Hit Rate:</span>
                      <span className="font-bold text-green-400">{rarity.baseHit}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-1">
                    {rarity.perks.map((perk, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Clan Info */}
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              The Seven Clans
            </h2>
            
            <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
              <p className="text-gray-300 mb-4">
                Your Fighter will be randomly assigned to one of the seven legendary clans. 
                Each clan has unique strengths and abilities!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CLANS.map((clan) => (
                  <div
                    key={clan.id}
                    className={`rounded-lg p-4 bg-gradient-to-br ${clan.color} bg-opacity-10 border border-gray-700`}
                  >
                    <h4 className="font-bold mb-1">{clan.name}</h4>
                    <p className="text-xs text-gray-400">{clan.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-400 mb-1">Home Arena Bonus</p>
                    <p className="text-sm text-gray-300">
                      When your Fighter battles in their clan's arena, they receive +4% hit chance!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mint Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-4">Mint Details</h2>
              
              {/* Selected Rarity */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Selected Rarity:</label>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getRarityInfo(selectedRarity).color}`}>
                  <span className="font-bold text-white">{getRarityInfo(selectedRarity).name} Fighter</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Quantity: (Max: {getMaxMintable()})
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.min(7, getMaxMintable())}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(7, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                />
              </div>

              {/* Referral Code */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Referral Code (Optional):
                </label>
                <input
                  type="text"
                  placeholder="Enter code for 7% discount to referrer"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Referrer gets 7% commission
                </p>
              </div>

              {/* Total Cost */}
              <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-2xl font-bold text-yellow-400">{totalPrice} ETH</span>
                </div>
                {referralCode && (
                  <p className="text-xs text-gray-400 mt-1">
                    Includes 7% referral commission
                  </p>
                )}
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={minting || !signer || getMaxMintable() === 0}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                  minting || !signer || getMaxMintable() === 0
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 transform hover:scale-105'
                }`}
              >
                {minting ? 'Minting...' : !signer ? 'Connect Wallet' : getMaxMintable() === 0 ? 'Sold Out' : `Mint ${quantity} Fighter${quantity > 1 ? 's' : ''}`}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {txHash && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
                  <p className="text-sm text-green-400 mb-2">✅ Transaction successful!</p>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline break-all"
                  >
                    View on BaseScan
                  </a>
                </div>
              )}

              {/* My Fighters */}
              {address && myFighters.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowMyFighters(!showMyFighters)}
                    className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-bold transition"
                  >
                    My Fighters ({myFighters.length}) {showMyFighters ? '▲' : '▼'}
                  </button>
                  
                  {showMyFighters && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                      {myFighters.map((fighter) => {
                        const rarityInfo = getRarityInfo(fighter.rarity);
                        const clanInfo = getClanInfo(fighter.clan);
                        
                        return (
                          <div
                            key={fighter.tokenId}
                            className={`p-3 rounded-lg border ${rarityInfo.borderColor} ${rarityInfo.bgColor}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold">Fighter #{fighter.tokenId}</h4>
                                <p className="text-xs text-gray-400">{rarityInfo.name} • {clanInfo.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Energy</p>
                                <p className="font-bold text-green-400">{fighter.energy}/100</p>
                              </div>
                            </div>
                            <div className="flex gap-4 text-xs">
                              <span className="text-green-400">{fighter.wins}W</span>
                              <span className="text-red-400">{fighter.losses}L</span>
                              {fighter.isStaked && <span className="text-yellow-400">⚡ Staked</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">About Fighters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">⚔️ Battle System</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Stake your Fighter to enable battles</li>
                <li>• Each Fighter starts with 100 energy</li>
                <li>• Each battle costs 20 energy</li>
                <li>• Refuel with FOOD tokens + 3 hours wait</li>
                <li>• Win battles to earn FOOD, GOLD, WOOD, and RKT tokens!</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">🔨 Forging</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Forge 2 Bronze → 1 Silver</li>
                <li>• Forge 2 Silver → 1 Gold</li>
                <li>• Forged Fighters keep the clan from the first Fighter</li>
                <li>• Increase your Fighter's power through forging!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintFighter;