import React, { useState } from 'react';
import { Crown, Coins, Swords, Shield, Flame, AlertTriangle, BookOpen, FileText, X } from 'lucide-react';

export default function AboutPage() {
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  
 return (
  <div className="min-h-screen">
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Game Overview */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Swords className="w-8 h-8 text-red-500" />
          What is Kings of Red?
        </h2>
        <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
          <p className="text-gray-300 leading-relaxed">
            Kings of Red is a collectible trading card game built on the Base blockchain network. Players collect NFT cards representing Heralds, Alphas, Fighters, Pets, Ladies, Weapons, and Badges across seven legendary clans.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Each card type serves a unique gameplay purpose, from resource generation to battle enhancements. The game features strategic elements including staking, token mining, PvE battles, and NFT crafting systems. 
          </p>
          <p className="text-gray-300 leading-relaxed">
            <strong>Join Our Community:</strong><br />
            Telegram: <a href="https://t.me/redkingcrypto" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">https://t.me/redkingcrypto</a><br />
            Twitter: <a href="https://x.com/RedKingDefi" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">@RedKingDefi</a><br />
            YouTube: <a href="https://www.youtube.com/watch?v=vRGD2sMYx2g" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Introduction Video</a>
          </p>
        </div>
      </section>



        {/* Gameplay Features */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Coins className="w-8 h-8 text-yellow-500" />
            Core Gameplay
          </h2>
          <div className="grid gap-4">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2 text-yellow-400">Herald NFTs (Phase 1)</h3>
              <p className="text-gray-300">
                Heralds are your entry point into Kings of Red. Stake your Herald to produce $KINGSFOOD tokens every 24 hours. Each Herald belongs to one of seven clans and comes in Bronze, Silver, or Gold rarity tiers with varying production rates.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2 text-blue-400">Token Economy</h3>
              <p className="text-gray-300">
                The game features two tokens: $KINGSFOOD (primary resource) and $KINGSGOLD (premium resource). Players earn tokens through staking, battles, and quests. Tokens can be used for in-game actions, NFT crafting, or withdrawn (subject to taxes and limits).
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2 text-red-400">Future Phases</h3>
              <p className="text-gray-300">
                Upcoming features include Alpha NFTs (enhanced mining), Fighter cards (battle system), Pet breeding mechanics, Lady NFTs (boost generation), Weapons, Badges, and clan-based team battles. Each phase will expand strategic gameplay depth.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2 text-green-400">NFT Progression</h3>
              <p className="text-gray-300">
                Players can merge lower-tier NFTs to create higher-tier cards. For example, combine 4 Bronze Heralds to forge 1 Silver Herald, or 2 Silver Heralds to create 1 Gold Herald. Merging requires token fees and burns the input NFTs, creating deflationary pressure.
              </p>
            </div>
          </div>
        </section>

        {/* Seven Clans */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-500" />
            The Seven Clans
          </h2>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <p className="text-gray-300 mb-4">
              Every NFT in Kings of Red belongs to one of seven legendary clans. Each clan has unique lore, visual themes, and future utility. Clans are randomly assigned during minting to ensure fair distribution and encourage trading.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Smizfume', 'Coalheart', 'Warmdice', 'Bervation', 'Konfisof', 'Witkastle', 'Bowkin'].map(clan => (
                <div key={clan} className="bg-black/50 rounded-lg p-3 text-center border border-gray-700">
                  <span className="font-bold text-sm">{clan}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Play */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              <li><strong>Connect Wallet:</strong> Install MetaMask and connect to the Base network</li>
              <li><strong>Mint Herald:</strong> Purchase your first Herald NFT during Genesis sale or on secondary markets</li>
              <li><strong>Stake Herald:</strong> Once staking opens, deposit your Herald to begin earning $KINGSFOOD</li>
              <li><strong>Claim Rewards:</strong> Collect your daily token production (requires small $KINGSGOLD fee)</li>
              <li><strong>Expand Collection:</strong> Acquire more Heralds, different clans, or higher rarities</li>
              <li><strong>Progress:</strong> Use tokens for future features like battles, crafting, and new NFT purchases</li>
            </ol>
          </div>
        </section>

        {/* Whitepaper Button */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h2 className="text-2xl font-bold mb-4">Read the Full Whitepaper</h2>
            <p className="text-gray-300 mb-6">
              Get detailed information about game mechanics, tokenomics, roadmap, and more in our comprehensive whitepaper.
            </p>
            <button
              onClick={() => setShowWhitepaper(true)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition text-lg inline-flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Read Whitepaper
            </button>
          </div>
        </section>

        {/* Important Disclaimer */}
        <section className="mb-12">
          <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-yellow-400">
              <AlertTriangle className="w-8 h-8" />
              Important Disclaimers
            </h2>
            <div className="space-y-4 text-gray-300">
              <p className="font-semibold text-white">
                PLEASE READ CAREFULLY BEFORE PARTICIPATING
              </p>
              
              <p>
                <strong>Not Financial Advice:</strong> Nothing on this website or in the Kings of Red game constitutes financial, investment, legal, or tax advice. All information is provided for entertainment and educational purposes only.
              </p>
              
              <p>
                <strong>No Investment Promises:</strong> Kings of Red NFTs and tokens are digital collectibles and game items. They are NOT investments, securities, or financial instruments. We make no promises, guarantees, or representations about potential returns, value appreciation, or profitability.
              </p>
              
              <p>
                <strong>Risk of Loss:</strong> The value of NFTs and tokens can be highly volatile and may decrease to zero. You may lose all money spent on purchases. Only spend what you can afford to lose entirely.
              </p>
              
              <p>
                <strong>No ROI Guarantee:</strong> Token production rates, gameplay mechanics, and economic parameters are subject to change at any time to maintain game balance. There is no guaranteed "return on investment" or ability to recover purchase costs.
              </p>
              
              <p>
                <strong>Blockchain Technology Risks:</strong> Transactions on the blockchain are irreversible. Lost private keys, smart contract bugs, or blockchain network issues could result in permanent loss of assets. Use at your own risk.
              </p>
              
              <p>
                <strong>Game Development:</strong> Kings of Red is under active development. Features may be added, modified, or removed. The game may be discontinued at any time without refunds.
              </p>
              
              <p>
                <strong>Regulatory Uncertainty:</strong> Cryptocurrency and NFT regulations vary by jurisdiction and are evolving. You are responsible for understanding and complying with your local laws.
              </p>
              
              <p>
                <strong>Age Requirement:</strong> You must be 18 years or older (or legal age in your jurisdiction) to participate.
              </p>
              
              <p className="font-semibold text-white">
                By purchasing Kings of Red NFTs or participating in the game, you acknowledge that you have read, understood, and accepted these disclaimers and agree to assume all risks associated with participation.
              </p>
            </div>
          </div>
        </section>

        {/* Contact/Community */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Join the Community</h2>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <p className="text-gray-300 mb-4">
              Stay updated on game development, connect with other players, and get support:
            </p>
            <div className="space-y-2 text-gray-300">
              <p>• Website: kingsofred.com</p>
              <p>• Telegram: https://t.me/kingsofred</p>
              <p>• Twitter/X: @RedKingDefi</p>
              <p>• Contract: <a 
                href="https://basescan.org/address/0xb282DC4c005C88A3E81D513D09a78f48CA404311" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono break-all"
              >
                0xb282DC4c005C88A3E81D513D09a78f48CA404311
              </a></p>
            </div>
          </div>
        </section>
      </div>

      {/* Whitepaper Modal */}
      {showWhitepaper && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowWhitepaper(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="prose prose-invert max-w-none">
              <h1 className="text-4xl font-bold mb-6 text-red-500">Kings of Red Whitepaper</h1>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Introduction</h2>
              <p>Kings of Red is a blockchain-based NFT trading card game built on Base Network, featuring token mining, strategic battles, and progressive gameplay across seven legendary clans.</p>

              <h2 className="text-2xl font-bold mt-8 mb-4">Game Overview</h2>
              <p>Players collect NFT cards, stake them to generate tokens, engage in PvE battles, and craft higher-tier NFTs through merging mechanics. The game economy is designed for long-term sustainability with deflationary mechanisms.</p>

              <h2 className="text-2xl font-bold mt-8 mb-4">NFT Card Types</h2>
              <ul>
                <li><strong>Heralds (Phase 1):</strong> Entry-level miners producing $KINGSFOOD tokens daily</li>
                <li><strong>Alphas (Phase 2):</strong> Enhanced miners producing $KINGSGOLD tokens</li>
                <li><strong>Fighters (Phase 3):</strong> Battle-focused cards for PvE combat</li>
                <li><strong>Pets (Phase 4):</strong> Breeding and companion mechanics</li>
                <li><strong>Ladies (Phase 5):</strong> Generate battle boosts and bonuses</li>
                <li><strong>Weapons & Badges:</strong> Equipment and achievement systems</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">Token Economics</h2>
              <h3 className="text-xl font-bold mt-6 mb-3">$KINGSFOOD</h3>
              <p>Primary resource token produced by Herald NFTs. Used for pet feeding, basic crafting, and in-game purchases. Daily production varies by rarity: Bronze (20), Silver (65), Gold (100).</p>

              <h3 className="text-xl font-bold mt-6 mb-3">$KINGSGOLD</h3>
              <p>Premium resource token produced by Alpha NFTs. Required for claiming Herald rewards (5 GOLD/claim), battle entries, and advanced features. More scarce and valuable than FOOD.</p>

              <h2 className="text-2xl font-bold mt-8 mb-4">Withdrawal Tax System</h2>
              <p>All token withdrawals are subject to a 7% tax split as follows:</p>
              <ul>
                <li>40% burned (reduces supply, supports token value)</li>
                <li>40% to treasury (funds development and operations)</li>
                <li>20% to rewards pool (incentivizes player engagement)</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">NFT Forging System</h2>
              <p>Players can merge NFTs to upgrade rarity tiers:</p>
              <ul>
                <li>4 Bronze → 1 Silver (costs 200 FOOD + 100 GOLD)</li>
                <li>2 Silver → 1 Gold (costs 500 FOOD + 300 GOLD)</li>
              </ul>
              <p>Forging burns input NFTs and tokens, creating deflationary pressure on both supply metrics.</p>

              <h2 className="text-2xl font-bold mt-8 mb-4">The Seven Clans</h2>
              <p>Every NFT belongs to one of seven clans: Smizfume, Coalheart, Warmdice, Bervation, Konfisof, Witkastle, and Bowkin. Clans are randomly assigned during minting. Future updates will introduce clan-specific bonuses and competitive elements.</p>

              <h2 className="text-2xl font-bold mt-8 mb-4">Development Roadmap</h2>
              <ul>
                <li><strong>Phase 1 (Current):</strong> Herald Genesis Sale and initial NFT distribution</li>
                <li><strong>Phase 2:</strong> Staking system activation and token production</li>
                <li><strong>Phase 3:</strong> Token withdrawals, exchange functionality</li>
                <li><strong>Phase 4:</strong> Alpha NFT sales and enhanced mining</li>
                <li><strong>Phase 5:</strong> Battle system and Fighter NFTs</li>
                <li><strong>Phase 6+:</strong> Pet breeding, Lady NFTs, advanced features</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">Important Disclaimers</h2>
              <p><strong>Subject to Change:</strong> All game mechanics, token production rates, fees, and features are subject to change at any time to ensure long-term game balance and sustainability.</p>
              <p><strong>Not Financial Advice:</strong> This is entertainment software. NFTs and tokens are collectibles, not investments. No guarantees of value or returns are made.</p>
              <p><strong>Risk Warning:</strong> Cryptocurrency and NFT values are volatile. Only participate with funds you can afford to lose.</p>

              <div className="mt-12 pt-8 border-t border-gray-700 text-center">
                <p className="text-gray-400">Kings of Red © 2025 • Built on Base Network</p>
                <p className="text-gray-500 text-sm mt-2">For detailed technical documentation, visit our GitHub repository</p>
              </div>
            </div>

            <button
              onClick={() => setShowWhitepaper(false)}
              className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold transition mt-8"
            >
              Close
            </button>

            {/* 🧪 TESTING SECTION - Remove before public launch */}
<div className="mt-16 pt-8 border-t border-gray-700">
  <div className="max-w-2xl mx-auto bg-gray-800/30 rounded-lg p-6">
    <h3 className="text-lg font-bold text-yellow-400 mb-4 text-center">
      🧪 Testing Panel (Dev Only)
    </h3>
    <p className="text-xs text-gray-400 text-center mb-4">
      For internal testing purposes - Remove before public launch
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Button 1: Mint Fighter */}
      <button
        onClick={() => onNavigate('mint-fighter')}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105"
      >
        🎨 Mint Fighter
      </button>
      
      {/* Button 2: Fighter Staking */}
      <button
        onClick={() => onNavigate('stake-fighters')}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105"
      >
        ⚡ Stake Fighters
      </button>
      
      {/* Button 3: Battle */}
      <button
        onClick={() => onNavigate('battle')}
        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105"
      >
        ⚔️ Enter Battle
      </button>
    </div>
    <p className="text-xs text-gray-500 text-center mt-4 italic">
      Scroll to bottom of About page to access testing features
    </p>
  </div>
</div>


          </div>
        </div>
        
      )}
    </div>
  );
}