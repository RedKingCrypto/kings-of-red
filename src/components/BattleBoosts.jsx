import React, { useState, useEffect } from 'react';
import { Zap, Target, Heart, Shield, Droplet, Snowflake, Gift, TrendingUp, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';

// This will be your Battle Boost contract address (to be deployed later)
const BOOST_CONTRACT = '0x0000000000000000000000000000000000000000'; // Update after deployment

const BattleBoosts = ({ provider, signer, address }) => {
  const [cart, setCart] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // All 8 Battle Boosts
  const BOOSTS = [
    {
      id: 1,
      name: 'Battle Boost Minor',
      clan: 'Konfisof',
      icon: Target,
      color: 'from-green-600 to-emerald-600',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-900/20',
      price: '20 FOOD or 2 GOLD',
      priceUSD: 5,
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
      price: '50 FOOD or 5 GOLD',
      priceUSD: 12,
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
      price: '30 FOOD or 3 GOLD',
      priceUSD: 7,
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
      price: '40 FOOD or 4 GOLD',
      priceUSD: 10,
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
      price: '35 FOOD or 3.5 GOLD',
      priceUSD: 8,
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
      price: '45 FOOD or 4.5 GOLD',
      priceUSD: 11,
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
      price: '25 FOOD',
      priceUSD: 6,
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
      price: '50 FOOD or 5 GOLD',
      priceUSD: 12,
      effect: 'Enemy Loses 1 HP',
      description: 'Set a deadly trap that damages the enemy before battle even starts!',
      duration: 'Instant at battle start',
      type: 'Damage'
    }
  ];

  const addToCart = (boost) => {
    if (!cart.find(item => item.id === boost.id)) {
      setCart([...cart, boost]);
    }
  };

  const removeFromCart = (boostId) => {
    setCart(cart.filter(item => item.id !== boostId));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, boost) => sum + boost.priceUSD, 0);
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

    setPurchasing(true);
    setError('');
    setTxHash('');

    try {
      // This will be implemented when Battle Boost contract is deployed
      alert('Battle Boost purchasing will be available soon!\n\nFor now, boosts are FREE during battles.');
      
      // Future implementation:
      // const contract = new ethers.Contract(BOOST_CONTRACT, BOOST_ABI, signer);
      // const tx = await contract.purchaseBoosts(cart.map(b => b.id), { value: totalCost });
      // setTxHash(tx.hash);
      // await tx.wait();
      
      setCart([]);
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
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
          <div className="inline-block bg-purple-900/30 border border-purple-500 rounded-lg px-6 py-3">
            <p className="text-yellow-400 font-bold text-lg">🎮 Currently FREE in Battle!</p>
            <p className="text-sm text-gray-300">Purchase system coming soon</p>
          </div>
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
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="text-sm font-bold">${boost.priceUSD}</p>
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Cost:</span>
                    <span className="text-yellow-400">{boost.price}</span>
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
                  {inCart ? 'Remove from Cart' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Shopping Cart */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-purple-500 p-6 shadow-2xl">
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
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-yellow-400">${getTotalPrice()}</p>
                  </div>

                  <button
                    onClick={() => setCart([])}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition"
                  >
                    Clear Cart
                  </button>

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !signer}
                    className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                      purchasing || !signer
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 transform hover:scale-105'
                    }`}
                  >
                    {purchasing ? 'Processing...' : !signer ? 'Connect Wallet' : 'Purchase Now'}
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
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

        {/* How It Works */}
        <div className="mt-12 bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">How Battle Boosts Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">🎯 Using Boosts</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Select boosts before entering battle</li>
                <li>• Maximum ONE boost per clan (7 clans total)</li>
                <li>• Passive boosts activate automatically</li>
                <li>• Active boosts can be triggered during battle</li>
                <li>• Strategic timing is key to victory!</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">💰 Purchasing</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Boosts are currently FREE in battles</li>
                <li>• Purchase system coming soon</li>
                <li>• Will be available with FOOD or GOLD tokens</li>
                <li>• Can also be earned as battle rewards</li>
                <li>• Alphas will produce boosts automatically</li>
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