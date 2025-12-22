import React, { useState, useEffect } from 'react';
import { Zap, Target, Heart, Shield, Droplet, Snowflake, Gift, TrendingUp, ShoppingCart, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { ethers } from 'ethers';

// Battle Boost contract (to be deployed)
const BOOST_CONTRACT = '0x0000000000000000000000000000000000000000'; // Update after deployment

// Token contracts
import { FOOD_TOKEN_ADDRESS, GOLD_TOKEN_ADDRESS } from '../contractConfig';

const BattleBoosts = ({ provider, signer, address }) => {
  const [cart, setCart] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [userBalances, setUserBalances] = useState({ food: 0, gold: 0 });

  // All 8 Battle Boosts with FOOD/GOLD pricing
  const BOOSTS = [
    {
      id: 1,
      name: 'Battle Boost Minor',
      clan: 'Konfisof',
      icon: Target,
      color: 'from-green-600 to-emerald-600',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-900/20',
      price: 35,
      currency: 'FOOD',
      rarity: 'Common',
      effect: '+15% Fighter Hit Chance',
      description: 'Increase your Fighter\'s accuracy by 15% for the entire battle.',
      duration: 'Entire battle',
      type: 'Passive'
    },
    {
      id: 2,
      name: 'Battle Boost Major',
      clan: 'Konfisof',
      icon: TrendingUp,
      color: 'from-green-600 to-emerald-600',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-900/20',
      price: 35,
      currency: 'GOLD',
      rarity: 'Ultra Rare',
      effect: '+40% Fighter Hit Chance',
      description: 'Massively increase your Fighter\'s accuracy by 40% for the entire battle.',
      duration: 'Entire battle',
      type: 'Passive'
    },
    {
      id: 3,
      name: 'Holy Prayer',
      clan: 'Bervation',
      icon: Heart,
      color: 'from-blue-600 to-cyan-600',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-900/20',
      price: 35,
      currency: 'FOOD',
      rarity: 'Common',
      effect: 'Restore 1 HP',
      description: 'Call upon divine power to restore 1 heart point during battle when needed.',
      duration: 'Use once per battle',
      type: 'Active'
    },
    {
      id: 4,
      name: 'Morale Boost',
      clan: 'Witkastle',
      icon: Shield,
      color: 'from-indigo-600 to-violet-600',
      borderColor: 'border-indigo-500',
      bgColor: 'bg-indigo-900/20',
      price: 35,
      currency: 'FOOD',
      rarity: 'Common',
      effect: '+10% Hit, -10% Enemy Hit',
      description: 'Rally your Fighter while intimidating the enemy. Double benefit!',
      duration: 'Entire battle',
      type: 'Passive'
    },
    {
      id: 5,
      name: 'Poison Potion',
      clan: 'Smizfume',
      icon: Droplet,
      color: 'from-purple-600 to-pink-600',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-900/20',
      price: 35,
      currency: 'FOOD',
      rarity: 'Common',
      effect: 'Enemy -20% Hit (2 attacks)',
      description: 'Poison the enemy, reducing their accuracy by 20% for their next 2 attacks.',
      duration: '2 enemy attacks',
      type: 'Active'
    },
    {
      id: 6,
      name: 'Freeze',
      clan: 'Coalheart',
      icon: Snowflake,
      color: 'from-red-600 to-orange-600',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-900/20',
      price: 15,
      currency: 'GOLD',
      rarity: 'Rare',
      effect: 'Enemy Skips 1 Turn',
      description: 'Freeze the enemy solid, causing them to lose their next attack completely.',
      duration: '1 enemy turn',
      type: 'Active'
    },
    {
      id: 7,
      name: 'Treasure Chest',
      clan: 'Warmdice',
      icon: Gift,
      color: 'from-yellow-600 to-amber-600',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-900/20',
      price: 20,
      currency: 'FOOD',
      rarity: 'Common',
      effect: 'Random Token Reward',
      description: 'Open a treasure chest for random rewards: FOOD (60%), GOLD (30%), or WOOD (10%).',
      duration: 'Instant at battle start',
      type: 'Reward'
    },
    {
      id: 8,
      name: 'Trap',
      clan: 'Bowkin',
      icon: Zap,
      color: 'from-teal-600 to-cyan-600',
      borderColor: 'border-teal-500',
      bgColor: 'bg-teal-900/20',
      price: 20,
      currency: 'GOLD',
      rarity: 'Rare',
      effect: 'Enemy Loses 1 HP',
      description: 'Set a deadly trap that damages the enemy before battle even starts!',
      duration: 'Instant at battle start',
      type: 'Damage'
    }
  ];

  // Load user balances
  useEffect(() => {
    if (provider && address) {
      loadBalances();
    }
  }, [provider, address]);

  const loadBalances = async () => {
    try {
      const TOKEN_ABI = ["function balanceOf(address) view returns (uint256)"];
      
      const foodContract = new ethers.Contract(FOOD_TOKEN_ADDRESS, TOKEN_ABI, provider);
      const goldContract = new ethers.Contract(GOLD_TOKEN_ADDRESS, TOKEN_ABI, provider);
      
      const [foodBal, goldBal] = await Promise.all([
        foodContract.balanceOf(address),
        goldContract.balanceOf(address)
      ]);
      
      setUserBalances({
        food: parseFloat(ethers.utils.formatEther(foodBal)),
        gold: parseFloat(ethers.utils.formatEther(goldBal))
      });
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  const addToCart = (boost) => {
    if (!cart.find(item => item.id === boost.id)) {
      setCart([...cart, boost]);
    }
  };

  const removeFromCart = (boostId) => {
    setCart(cart.filter(item => item.id !== boostId));
  };

  const getTotalCost = () => {
    const totals = { FOOD: 0, GOLD: 0 };
    cart.forEach(boost => {
      totals[boost.currency] += boost.price;
    });
    return totals;
  };

  const canAfford = () => {
    const totals = getTotalCost();
    return userBalances.food >= totals.FOOD && userBalances.gold >= totals.GOLD;
  };

  const handlePurchase = async () => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!canAfford()) {
      const totals = getTotalCost();
      setError(`Insufficient balance! Need ${totals.FOOD} FOOD and ${totals.GOLD} GOLD`);
      return;
    }

    setPurchasing(true);
    setError('');
    setTxHash('');

    try {
      // This will be implemented when Battle Boost contract is deployed
      // Payment split: 30% burn, 35% owner rewards, 35% treasury
      
      alert('Battle Boost purchasing coming soon!\n\n' +
        'Boosts will cost FOOD/GOLD tokens.\n' +
        'Payment split: 30% burned, 35% rewards pool, 35% treasury');
      
      /* Future implementation:
      const BOOST_ABI = [
        "function purchaseBoosts(uint256[] calldata boostIds) external"
      ];
      
      const contract = new ethers.Contract(BOOST_CONTRACT, BOOST_ABI, signer);
      
      // Approve tokens first
      const foodContract = new ethers.Contract(FOOD_TOKEN_ADDRESS, TOKEN_ABI, signer);
      const goldContract = new ethers.Contract(GOLD_TOKEN_ADDRESS, TOKEN_ABI, signer);
      
      const totals = getTotalCost();
      if (totals.FOOD > 0) {
        await foodContract.approve(BOOST_CONTRACT, ethers.utils.parseEther(totals.FOOD.toString()));
      }
      if (totals.GOLD > 0) {
        await goldContract.approve(BOOST_CONTRACT, ethers.utils.parseEther(totals.GOLD.toString()));
      }
      
      // Purchase
      const tx = await contract.purchaseBoosts(cart.map(b => b.id));
      setTxHash(tx.hash);
      await tx.wait();
      */
      
      setCart([]);
      await loadBalances();
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const getRarityColor = (rarity) => {
    if (rarity === 'Ultra Rare') return 'text-yellow-400';
    if (rarity === 'Rare') return 'text-purple-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
            Battle Boosts Shop
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Power up your Fighters with strategic boosts! Use one boost per clan (max 7 per battle).
          </p>
          
          {/* User Balances */}
          {address && (
            <div className="inline-flex gap-4 bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-bold">{userBalances.food.toFixed(0)} FOOD</span>
              </div>
              <div className="w-px bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold">{userBalances.gold.toFixed(0)} GOLD</span>
              </div>
            </div>
          )}
        </div>

        {/* Boost Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {BOOSTS.map((boost) => {
            const IconComponent = boost.icon;
            const inCart = cart.find(item => item.id === boost.id);
            
            return (
              <div
                key={boost.id}
                className={`rounded-lg p-6 border-2 transition-all ${
                  inCart 
                    ? `${boost.borderColor} ${boost.bgColor} scale-105` 
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${boost.color}`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${getRarityColor(boost.rarity)}`}>{boost.rarity}</p>
                    <p className="text-lg font-bold text-yellow-400">{boost.price} {boost.currency}</p>
                  </div>
                </div>

                {/* Name & Clan */}
                <h3 className="text-xl font-bold mb-1">{boost.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{boost.clan} Clan</p>

                {/* Effect Badge */}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-gradient-to-r ${boost.color}`}>
                  {boost.effect}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-300 mb-4 min-h-[60px]">
                  {boost.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-gray-200">{boost.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-gray-200">{boost.type}</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => inCart ? removeFromCart(boost.id) : addToCart(boost)}
                  className={`w-full py-2 rounded-lg font-bold transition-all ${
                    inCart
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700'
                  }`}
                >
                  {inCart ? 'Remove' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Shopping Cart */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-purple-500 p-6 shadow-2xl z-50">
            <div className="container mx-auto">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="font-bold text-lg">
                      {cart.length} Boost{cart.length > 1 ? 's' : ''} in Cart
                    </p>
                    <p className="text-sm text-gray-400">
                      {cart.map(b => b.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total Cost</p>
                    {(() => {
                      const totals = getTotalCost();
                      return (
                        <div className="flex gap-3 text-lg font-bold">
                          {totals.FOOD > 0 && <span className="text-yellow-400">{totals.FOOD} FOOD</span>}
                          {totals.GOLD > 0 && <span className="text-yellow-500">{totals.GOLD} GOLD</span>}
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    onClick={() => setCart([])}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !signer || !canAfford()}
                    className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                      purchasing || !signer || !canAfford()
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 transform hover:scale-105'
                    }`}
                  >
                    {purchasing ? 'Processing...' : !signer ? 'Connect Wallet' : !canAfford() ? 'Insufficient Balance' : 'Purchase'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {txHash && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
                  <p className="text-sm text-green-400 mb-2">✅ Purchase successful!</p>
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
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-12 bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Payment & Distribution</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <h4 className="font-bold text-red-400 mb-2">🔥 30% Burned</h4>
              <p className="text-sm text-gray-300">Permanently removed from circulation, increasing scarcity</p>
            </div>

            <div className="p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
              <h4 className="font-bold text-yellow-400 mb-2">🎁 35% Rewards Pool</h4>
              <p className="text-sm text-gray-300">Reserved for airdrops and community rewards</p>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
              <h4 className="font-bold text-blue-400 mb-2">💼 35% Treasury</h4>
              <p className="text-sm text-gray-300">Development, marketing, and operations</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">How Battle Boosts Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">🎯 Using Boosts</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Purchase boosts with FOOD or GOLD tokens</li>
                <li>• Select boosts before entering battle</li>
                <li>• Maximum ONE boost per clan (7 clans total)</li>
                <li>• Passive boosts activate automatically</li>
                <li>• Active boosts can be triggered during battle</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">⭐ Rarity Tiers</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="text-gray-400">• <span className="font-bold">Common:</span> 35 FOOD or 20 FOOD</li>
                <li className="text-purple-400">• <span className="font-bold">Rare:</span> 15-20 GOLD</li>
                <li className="text-yellow-400">• <span className="font-bold">Ultra Rare:</span> 35 GOLD</li>
                <li>• Prices may change based on game balance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Boost Strategies */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Recommended Strategies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
              <h4 className="font-bold text-green-400 mb-2">🎯 Accuracy Build</h4>
              <p className="text-sm text-gray-300 mb-3">Maximize hit chance for consistent damage</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Battle Boost Major (+40%)</li>
                <li>• Morale Boost (+10%/-10%)</li>
                <li>• Best for Bronze Fighters</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
              <h4 className="font-bold text-blue-400 mb-2">🛡️ Survival Build</h4>
              <p className="text-sm text-gray-300 mb-3">Outlast enemies with defensive boosts</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Holy Prayer (HP restore)</li>
                <li>• Freeze (skip enemy turn)</li>
                <li>• Best for tough enemies</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-900/20 border border-purple-500 rounded-lg">
              <h4 className="font-bold text-purple-400 mb-2">⚡ Speed Build</h4>
              <p className="text-sm text-gray-300 mb-3">Quick victories with offensive boosts</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Trap (instant damage)</li>
                <li>• Poison Potion (weaken enemy)</li>
                <li>• Best for Gold Fighters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleBoosts;