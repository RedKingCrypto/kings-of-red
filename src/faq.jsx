import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle, Shield, Coins, Crown } from 'lucide-react';

export default function FAQPage({ onNavigate }) {
  const [openQuestion, setOpenQuestion] = useState(null);

  // Add console log to verify component is mounting
  console.log('FAQPage is rendering');

  const toggleQuestion = (index) => {
    console.log('Toggling question:', index);
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const handleNavigate = (page) => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  const faqs = [
    {
      category: "Getting Started",
      icon: Crown,
      questions: [
        {
          q: "What is Kings of Red?",
          a: "Kings of Red is a collectible NFT trading card game built on the Base network. Players collect Herald NFTs that produce $KINGSFOOD tokens daily, battle monsters for rewards, and build collections across 7 legendary clans."
        },
        {
          q: "How do I start playing?",
          a: "To start: (1) Install MetaMask wallet, (2) Add Base network to MetaMask, (3) Get some ETH on Base network, (4) Connect your wallet to kingsofred.com, (5) Mint your first Herald NFT from the Mint page."
        }
      ]
    },
    {
      category: "Herald NFTs",
      icon: Shield,
      questions: [
        {
          q: "What are Herald NFTs?",
          a: "Herald NFTs are the first card type in Kings of Red. They act as miners that produce $KINGSFOOD tokens every 24 hours."
        },
        {
          q: "How much do Heralds cost?",
          a: "Herald prices vary by rarity and sale phase. Check the current prices on the Mint page."
        }
      ]
    }
  ];

  // Add console log to verify faqs array
  console.log('FAQ categories:', faqs.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-400">Find answers to common questions about Kings of Red</p>
        </div>

        {/* Debug Info - Remove this after testing */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-300">
            🐛 DEBUG: Rendering {faqs.length} categories with {faqs.reduce((sum, cat) => sum + cat.questions.length, 0)} total questions
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, catIndex) => {
            const CategoryIcon = category.icon;
            return (
              <div key={catIndex} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-b border-gray-700 p-4 flex items-center gap-3">
                  <CategoryIcon className="w-6 h-6 text-red-500" />
                  <h2 className="text-2xl font-bold">{category.category}</h2>
                  <span className="text-sm text-gray-400 ml-auto">
                    ({category.questions.length} questions)
                  </span>
                </div>

                <div className="divide-y divide-gray-700">
                  {category.questions.map((faq, qIndex) => {
                    const questionId = `${catIndex}-${qIndex}`;
                    const isOpen = openQuestion === questionId;

                    return (
                      <div key={qIndex} className="p-4">
                        <button
                          onClick={() => toggleQuestion(questionId)}
                          className="w-full flex items-start justify-between gap-4 text-left hover:text-red-400 transition"
                        >
                          <span className="font-semibold text-lg flex-1">{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 flex-shrink-0 mt-1 text-red-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 flex-shrink-0 mt-1" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="mt-3 text-gray-300 leading-relaxed pl-4 border-l-2 border-red-500">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-300 mb-6">Join our community!</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://t.me/kingsofred"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Join Telegram
            </a>
            <a
              href="https://twitter.com/redkingdefi"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Follow on Twitter
            </a>
            <button
              onClick={() => handleNavigate('about')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              Read Whitepaper
            </button>
          </div>
        </div>

        <div className="mt-8 bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-2">⚠️ Important Reminders</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Admins will NEVER DM you first</li>
                <li>• NEVER share your seed phrase or private keys</li>
                <li>• Always verify contract addresses on BaseScan</li>
                <li>• This is a game, not an investment platform</li>
                <li>• Only spend what you can afford to lose</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => handleNavigate('home')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}