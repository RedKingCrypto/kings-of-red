import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Target, Crown, Flame, Award, TrendingUp, Star } from 'lucide-react';
import { ethers } from 'ethers';

export default function LeaderboardPage({ connected, walletAddress }) {
  const [activeCategory, setActiveCategory] = useState('battles');
  const [loading, setLoading] = useState(true);
  const [leaderboards, setLeaderboards] = useState({
    battles: [],
    victories: [],
    collection: [],
    earnings: []
  });

  useEffect(() => {
    if (connected) {
      loadLeaderboards();
    }
  }, [connected]);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual contract calls
      // For now, using mock data for display
      
      const mockBattlesData = [
        { rank: 1, address: '0x1234...5678', username: 'WarriorKing', value: 1247, change: '+15' },
        { rank: 2, address: '0x2345...6789', username: 'BattleMaster', value: 1156, change: '+8' },
        { rank: 3, address: '0x3456...7890', username: 'SwordLord', value: 1089, change: '+22' },
        { rank: 4, address: '0x4567...8901', username: 'ClanChampion', value: 987, change: '-3' },
        { rank: 5, address: '0x5678...9012', username: 'DragonSlayer', value: 876, change: '+12' },
        { rank: 6, address: '0x6789...0123', username: 'KnightErrant', value: 745, change: '+5' },
        { rank: 7, address: '0x7890...1234', username: 'BerserkerRage', value: 698, change: '-2' },
        { rank: 8, address: '0x8901...2345', username: 'CrimsonBlade', value: 634, change: '+18' },
        { rank: 9, address: '0x9012...3456', username: 'IronFist', value: 589, change: '+7' },
        { rank: 10, address: '0x0123...4567', username: 'StormBreaker', value: 521, change: '+4' }
      ];

      const mockVictoriesData = [
        { rank: 1, address: '0x1234...5678', username: 'WarriorKing', value: 892, winRate: '71.5%' },
        { rank: 2, address: '0x3456...7890', username: 'SwordLord', value: 756, winRate: '69.4%' },
        { rank: 3, address: '0x2345...6789', username: 'BattleMaster', value: 734, winRate: '63.5%' },
        { rank: 4, address: '0x8901...2345', username: 'CrimsonBlade', value: 689, winRate: '68.2%' },
        { rank: 5, address: '0x5678...9012', username: 'DragonSlayer', value: 645, winRate: '73.6%' },
        { rank: 6, address: '0x6789...0123', username: 'KnightErrant', value: 578, winRate: '77.6%' },
        { rank: 7, address: '0x4567...8901', username: 'ClanChampion', value: 534, winRate: '54.1%' },
        { rank: 8, address: '0x9012...3456', username: 'IronFist', value: 487, winRate: '82.7%' },
        { rank: 9, address: '0x7890...1234', username: 'BerserkerRage', value: 456, winRate: '65.3%' },
        { rank: 10, address: '0x0123...4567', username: 'StormBreaker', value: 398, winRate: '76.4%' }
      ];

      const mockCollectionData = [
        { rank: 1, address: '0x2345...6789', username: 'BattleMaster', points: 3450, heralds: 12, fighters: 8, total: 20 },
        { rank: 2, address: '0x1234...5678', username: 'WarriorKing', points: 3280, heralds: 10, fighters: 9, total: 19 },
        { rank: 3, address: '0x5678...9012', username: 'DragonSlayer', points: 2890, heralds: 9, fighters: 7, total: 16 },
        { rank: 4, address: '0x3456...7890', username: 'SwordLord', points: 2750, heralds: 11, fighters: 4, total: 15 },
        { rank: 5, address: '0x6789...0123', username: 'KnightErrant', points: 2540, heralds: 8, fighters: 6, total: 14 },
        { rank: 6, address: '0x8901...2345', username: 'CrimsonBlade', points: 2310, heralds: 7, fighters: 6, total: 13 },
        { rank: 7, address: '0x4567...8901', username: 'ClanChampion', points: 2180, heralds: 9, fighters: 3, total: 12 },
        { rank: 8, address: '0x9012...3456', username: 'IronFist', points: 1950, heralds: 6, fighters: 5, total: 11 },
        { rank: 9, address: '0x7890...1234', username: 'BerserkerRage', points: 1820, heralds: 7, fighters: 3, total: 10 },
        { rank: 10, address: '0x0123...4567', username: 'StormBreaker', points: 1670, heralds: 5, fighters: 4, total: 9 }
      ];

      const mockEarningsData = [
        { rank: 1, address: '0x1234...5678', username: 'WarriorKing', food: 12450, gold: 3280, wood: 1560 },
        { rank: 2, address: '0x2345...6789', username: 'BattleMaster', food: 11230, gold: 2950, wood: 1420 },
        { rank: 3, address: '0x5678...9012', username: 'DragonSlayer', food: 10890, gold: 2780, wood: 1390 },
        { rank: 4, address: '0x3456...7890', username: 'SwordLord', food: 9670, gold: 2540, wood: 1210 },
        { rank: 5, address: '0x8901...2345', username: 'CrimsonBlade', food: 8950, gold: 2340, wood: 1150 },
        { rank: 6, address: '0x6789...0123', username: 'KnightErrant', food: 8120, gold: 2180, wood: 980 },
        { rank: 7, address: '0x4567...8901', username: 'ClanChampion', food: 7850, gold: 1990, wood: 920 },
        { rank: 8, address: '0x9012...3456', username: 'IronFist', food: 7340, gold: 1850, wood: 870 },
        { rank: 9, address: '0x7890...1234', username: 'BerserkerRage', food: 6890, gold: 1720, wood: 810 },
        { rank: 10, address: '0x0123...4567', username: 'StormBreaker', food: 6450, gold: 1620, wood: 750 }
      ];

      setLeaderboards({
        battles: mockBattlesData,
        victories: mockVictoriesData,
        collection: mockCollectionData,
        earnings: mockEarningsData
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      setLoading(false);
    }
  };

  const categories = [
    { id: 'battles', name: 'Most Active', icon: Target, color: 'blue' },
    { id: 'victories', name: 'Top Warriors', icon: Swords, color: 'red' },
    { id: 'collection', name: 'Top Collectors', icon: Crown, color: 'yellow' },
    { id: 'earnings', name: 'Top Earners', icon: TrendingUp, color: 'green' }
  ];

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Star className="w-6 h-6 text-orange-400" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  const isCurrentUser = (address) => {
    return connected && walletAddress && address.toLowerCase().includes(walletAddress.toLowerCase().slice(2, 6));
  };

  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Leaderboards</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to see rankings and compete!</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold">Leaderboards</h1>
        </div>
        <p className="text-gray-400">Compete with the best players in Kings of Red</p>
      </div>

      {/* Category Tabs */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition ${
                isActive
                  ? `border-${category.color}-500 bg-${category.color}-900/20`
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${
                isActive ? `text-${category.color}-400` : 'text-gray-400'
              }`} />
              <p className={`font-semibold text-sm ${
                isActive ? `text-${category.color}-400` : 'text-gray-400'
              }`}>
                {category.name}
              </p>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-400">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            {activeCategory === 'battles' && (
              <>
                <div className="col-span-3 text-center">Total Battles</div>
                <div className="col-span-2 text-center">Weekly</div>
                <div className="col-span-2 text-center">Trend</div>
              </>
            )}
            {activeCategory === 'victories' && (
              <>
                <div className="col-span-3 text-center">Victories</div>
                <div className="col-span-3 text-center">Win Rate</div>
                <div className="col-span-2 text-center">Status</div>
              </>
            )}
            {activeCategory === 'collection' && (
              <>
                <div className="col-span-2 text-center">Points</div>
                <div className="col-span-2 text-center">Heralds</div>
                <div className="col-span-2 text-center">Fighters</div>
                <div className="col-span-2 text-center">Total</div>
              </>
            )}
            {activeCategory === 'earnings' && (
              <>
                <div className="col-span-3 text-center">FOOD</div>
                <div className="col-span-2 text-center">GOLD</div>
                <div className="col-span-3 text-center">WOOD</div>
              </>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700">
          {leaderboards[activeCategory].map((entry) => (
            <div
              key={entry.rank}
              className={`px-6 py-4 hover:bg-gray-700/30 transition ${
                isCurrentUser(entry.address) ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Player Info */}
                <div className="col-span-4">
                  <p className="font-bold text-white">{entry.username}</p>
                  <p className="text-xs text-gray-400 font-mono">{entry.address}</p>
                  {isCurrentUser(entry.address) && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-xs rounded">You</span>
                  )}
                </div>

                {/* Category-specific Data */}
                {activeCategory === 'battles' && (
                  <>
                    <div className="col-span-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">{entry.value.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-lg font-semibold text-gray-300">
                        {Math.floor(entry.value * 0.15)}
                      </p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${
                        entry.change.startsWith('+')
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {entry.change}
                      </span>
                    </div>
                  </>
                )}

                {activeCategory === 'victories' && (
                  <>
                    <div className="col-span-3 text-center">
                      <p className="text-2xl font-bold text-red-400">{entry.value.toLocaleString()}</p>
                    </div>
                    <div className="col-span-3 text-center">
                      <p className="text-lg font-semibold text-green-400">{entry.winRate}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      {parseFloat(entry.winRate) > 70 ? (
                        <Flame className="w-5 h-5 text-orange-400 mx-auto" />
                      ) : (
                        <Swords className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </div>
                  </>
                )}

                {activeCategory === 'collection' && (
                  <>
                    <div className="col-span-2 text-center">
                      <p className="text-xl font-bold text-yellow-400">{entry.points.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-lg font-semibold text-blue-400">{entry.heralds}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-lg font-semibold text-red-400">{entry.fighters}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-lg font-bold text-purple-400">{entry.total}</p>
                    </div>
                  </>
                )}

                {activeCategory === 'earnings' && (
                  <>
                    <div className="col-span-3 text-center">
                      <p className="text-lg font-bold text-blue-400">{entry.food.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-lg font-bold text-yellow-400">{entry.gold.toLocaleString()}</p>
                    </div>
                    <div className="col-span-3 text-center">
                      <p className="text-lg font-bold text-amber-600">{entry.wood.toLocaleString()}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <Trophy className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">How Rankings Work</p>
            <ul className="list-disc ml-4 space-y-1 text-blue-400/80">
              <li><strong>Most Active:</strong> Total battles entered (all time)</li>
              <li><strong>Top Warriors:</strong> Total victories + win rate percentage</li>
              <li><strong>Top Collectors:</strong> Collection point value (Bronze Herald=20pts, Gold Fighter=400pts, etc.)</li>
              <li><strong>Top Earners:</strong> Total FOOD, GOLD, and WOOD earned from all sources</li>
              <li>Leaderboards update every 24 hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}