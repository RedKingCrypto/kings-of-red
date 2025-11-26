import React, { useState } from 'react';
import { Crown, Coins, Sword, Shield, Flame, AlertTriangle, BookOpen, FileText, X } from 'lucide-react';

export default function AboutPage({ onNavigate }) {
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  
  // Rest of your component code...
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-red-800/50 bg-black/40 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-red-500" />
            <button 
              onClick={() => onNavigate && onNavigate('home')}
              className="hover:opacity-80 transition text-left"
            >
              <h1 className="text-2xl font-bold">KINGS OF RED</h1>
              <p className="text-sm text-gray-400">About the Game</p>
            </button>
          </div>
        </div>
      </div>

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
              <p>• Website: kingsofred.com </p>
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

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition text-lg"
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Kings of Red © 2025 • Built by Red King Crypto on Base Network</p>
            <p className="mt-2">For entertainment purposes only • Play responsibly</p>
          </div>
        </div>
      </div>
    </div>
  );
}