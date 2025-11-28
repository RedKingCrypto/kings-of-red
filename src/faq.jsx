import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle, Shield, Coins, Crown } from 'lucide-react';

export default function FAQPage({ onNavigate }) {
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (index) => {
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
          a: "To start: (1) Install MetaMask wallet, (2) Add Base network to MetaMask, (3) Get some ETH on Base network, (4) Connect your wallet to kingsofred.com, (5) Mint your first Herald NFT from the Mint page. Check our 'How to Buy' guide for detailed instructions!"
        },
        {
          q: "Do I need cryptocurrency to play?",
          a: "Yes, you need ETH on the Base network to mint Herald NFTs. After that, you'll earn $KINGSFOOD and $KINGSGOLD tokens through gameplay which you can use within the game or withdraw to USDC."
        },
        {
          q: "What blockchain is this built on?",
          a: "Kings of Red is built on Base, which is Coinbase's Layer 2 network. It offers low gas fees ($1-3 per transaction), fast confirmations (2-5 seconds), and the security of Ethereum."
        }
      ]
    },
    {
      category: "Herald NFTs",
      icon: Shield,
      questions: [
        {
          q: "What are Herald NFTs?",
          a: "Herald NFTs are the first card type in Kings of Red. They act as miners that produce $KINGSFOOD tokens every 24 hours. Each Herald belongs to one of 7 clans (assigned randomly when you mint) and comes in 3 rarity tiers: Bronze, Silver, and Gold."
        },
        {
          q: "How much do Heralds cost?",
          a: "Herald prices vary by rarity and sale phase. Genesis Sale prices: Bronze $7 (0.00221 ETH), Silver $23 (0.00728 ETH), Gold $39 (0.01234 ETH). Check the current prices on the Mint page."
        },
        {
          q: "Can I choose which clan I get?",
          a: "No, clan assignment is random when you mint. This creates scarcity and makes certain clan combinations more valuable in the secondary market. You can trade with other players on OpenSea or Magic Eden to complete your collection."
        },
        {
          q: "What do the different rarities do?",
          a: "Bronze Heralds produce 20 FOOD/day, Silver produce 65 FOOD/day, and Gold produce 100 FOOD/day. Higher rarity = better rewards but higher initial cost."
        },
        {
          q: "How many Heralds can I mint?",
          a: "There's no limit per wallet, but supply is limited: 100 Bronze, 77 Silver, and 43 Gold per sale phase. Once a rarity sells out, it's gone until the next sale phase."
        },
        {
          q: "What happens after I mint?",
          a: "Your Herald NFT appears in your MetaMask wallet immediately. Once staking opens (announced in Discord/Twitter), you'll be able to stake your Herald to start producing $KINGSFOOD tokens daily."
        }
      ]
    },
    {
      category: "Gameplay & Rewards",
      icon: Coins,
      questions: [
        {
          q: "How do I earn tokens?",
          a: "You earn $KINGSFOOD by staking Herald NFTs (daily production). Later phases will introduce $KINGSGOLD through Alpha NFTs and battle rewards. Tokens can be swapped internally or withdrawn to USDC."
        },
        {
          q: "When does staking open?",
          a: "As per our roadmap Staking is set to open in February/March 2026. We'll announce the exact date on Telegram and Twitter. This delay allows us to ensure everything works perfectly."
        },
        {
          q: "How do I claim my daily rewards?",
          a: "Once staking is active, go to the Staking page, connect your wallet, and stake your Heralds. After 24 hours, you can claim your $KINGSFOOD. There's a small $KINGSGOLD fee to claim (prevents bot farming)."
        },
        {
          q: "Can I stake multiple Heralds?",
          a: "Yes, but you can only stake ONE Herald per clan (maximum 7 Heralds staked at once). This encourages collecting diverse clans rather than just farming with one clan."
        },
        {
          q: "What are battles?",
          a: "Battles are PvE (player vs environment) combat where you fight monsters for token rewards. You'll need Fighter NFTs (released in Phase 3) to enter battles. It's turn-based with RNG hit chances."
        },
        {
          q: "Will there be PvP battles?",
          a: "Not currently planned for the near future. We're focusing on perfecting PvE battles first. PvP may be considered based on community feedback after the core game is established."
        }
      ]
    },
    {
      category: "Tokens & Economy",
      icon: Coins,
      questions: [
        {
          q: "What is $KINGSFOOD used for?",
          a: "$KINGSFOOD is the primary utility token. Use it for: feeding Pets (coming later), claiming Alpha rewards, crafting/forging, daily quest entries, and it can be withdrawn to USDC with a 7% tax."
        },
        {
          q: "What is $KINGSGOLD used for?",
          a: "$KINGSGOLD is the premium token. Use it for: claiming Herald rewards (daily fee), battle entry fees, premium crafting, and it can be withdrawn to USDC with a 7% tax."
        },
        {
          q: "Can I sell my tokens for real money?",
          a: "Yes! Use the Exchange page (opens ~5-6 weeks after Genesis sale) to swap tokens to USDC, which you can then withdraw to your wallet and sell on any exchange."
        },
        {
          q: "What are the withdrawal fees?",
          a: "Withdrawing tokens to USDC has a 7% tax: 40% is burned (reduces supply), 40% goes to treasury (development), 20% goes to rewards pool (community rewards). Internal swaps between FOOD and GOLD have a 2% fee."
        },
        {
          q: "Are there withdrawal limits?",
          a: "Yes, for economy protection: Maximum 100 tokens per 24 hours, and only one withdrawal every 24 hours. This prevents massive dumps and protects token value."
        },
        {
          q: "Can tokens go to zero?",
          a: "Theoretically yes, like any cryptocurrency. We've designed multiple deflationary mechanisms (burns, taxes, sinks) to maintain value, but there are NO guarantees. Only invest what you can afford to lose."
        }
      ]
    },
    {
      category: "Technical & Security",
      icon: Shield,
      questions: [
        {
          q: "Is the smart contract audited?",
          a: "The contract uses OpenZeppelin's battle-tested standards (ERC-721, ERC-2981, Ownable). We'll pursue a full third-party audit as revenue allows. The contract is publicly verifiable on BaseScan."
        },
        {
          q: "Can the contract be changed after deployment?",
          a: "The core contract code cannot be changed. However, the owner can: update mint prices, change baseURI (metadata), and withdraw accumulated funds. This is standard for NFT projects."
        },
        {
          q: "What if I lose my wallet/seed phrase?",
          a: "Your NFTs and tokens are GONE forever. We cannot recover them. NEVER share your seed phrase with anyone. Write it down on paper and store it securely. Not your keys, not your NFTs!"
        },
        {
          q: "How do I know this isn't a scam?",
          a: "Verify everything: (1) Check our contract on BaseScan, (2) See it's verified with publicly readable code, (3) Contract owner matches our official addresses, (4) Join our Discord/Twitter for community verification, (5) NEVER trust DMs claiming to be support."
        },
        {
          q: "What happens if the website goes down?",
          a: "Your NFTs and tokens are safe on the blockchain forever. The website is just an interface. You can interact with the contract directly through BaseScan, or we can quickly redeploy the website on a different host."
        }
      ]
    },
    {
      category: "Roadmap & Future",
      icon: Crown,
      questions: [
        {
          q: "What's coming next after Heralds?",
          a: "Roadmap: Phase 1 (now) - Herald sale & staking. Phase 2 (Q1 2026) - Alpha NFTs & $KINGSGOLD. Phase 3 (Q2 2026) - Battles & Fighter NFTs. Phase 4 (Q3-Q4 2026) - Full ecosystem with all 7 card types."
        },
        {
          q: "Will there be more Herald sales?",
          a: "Yes! Genesis sale is the first of four: Genesis (220 Heralds), Early Bird (317 Heralds), Public Sale A (537 Heralds), Public Sale B (536 Heralds). Each sale has progressively higher prices."
        },
        {
          q: "Can I upgrade my Bronze to Silver?",
          a: "Yes, through the forging system (coming Phase 4)! Burn 4 Bronze cards from the same clan + pay token fee = receive 1 Silver card. Or burn 2 Silver cards = 1 Gold card."
        },
        {
          q: "Will prices/rates change?",
          a: "Yes, all game mechanics are subject to change to maintain a healthy economy. We'll always announce changes in advance and consider community feedback. This is stated clearly in our whitepaper."
        },
        {
          q: "Can I suggest features?",
          a: "Absolutely! Join our Discord to share ideas. We actively listen to community feedback and many features will be shaped by what players want. Your input matters!"
        }
      ]
    },
    {
      category: "Buying & Trading",
      icon: Coins,
      questions: [
        {
          q: "Where can I buy Heralds?",
          a: "Primary sales: kingsofred.com/mint (you're minting directly from the contract). Secondary market: OpenSea and Magic Eden (buy from other players). Always verify the contract address matches our official one!"
        },
        {
          q: "How much does minting cost in gas fees?",
          a: "On Base network, gas fees are typically $1-3 per transaction. This is much cheaper than Ethereum mainnet which can cost $20-100+ in gas fees."
        },
        {
          q: "Can I sell my Herald NFT?",
          a: "Yes! List it on OpenSea or Magic Eden. The project earns 3% royalty on all secondary sales, which helps fund ongoing development."
        },
        {
          q: "What determines Herald value?",
          a: "Factors: (1) Rarity (Gold > Silver > Bronze), (2) Clan (some may be more popular), (3) Token production potential, (4) Market demand, (5) How early you bought (Genesis Heralds may have collector value)."
        },
        {
          q: "Can I refund my NFT?",
          a: "No. All blockchain transactions are final and irreversible. Make sure you understand what you're buying before minting. This is not a traditional purchase - it's a blockchain transaction."
        },
        {
          q: "How do affiliate codes work?",
          a: "Genesis buyers receive a unique referral code. When someone mints using your code, you automatically earn 7% commission paid instantly in ETH to your wallet. No withdrawal needed - it's automatic on-chain!"
        }
      ]
    },
    {
      category: "Legal & Disclaimers",
      icon: AlertCircle,
      questions: [
        {
          q: "Is this an investment?",
          a: "NO. Kings of Red is a game and entertainment platform. NFTs are digital collectibles for gameplay purposes. We make ZERO promises about returns, profits, or value appreciation. This is NOT financial advice."
        },
        {
          q: "Can I lose money?",
          a: "Yes, absolutely. Token values can drop to zero. NFTs may become worthless. The game could shut down. Smart contracts could have bugs. Only spend what you can afford to lose completely."
        },
        {
          q: "What are the risks?",
          a: "Risks include: (1) Smart contract bugs, (2) Economic model failure, (3) Regulatory changes, (4) Loss of access to wallet, (5) Rug pull (we're building for long-term but it's always a risk in crypto), (6) Total loss of investment. Do your own research!"
        },
        {
          q: "Is this legal in my country?",
          a: "We cannot provide legal advice for your specific jurisdiction. It's YOUR responsibility to ensure participation is legal where you live. We cannot be held liable for your participation in regions where it may be restricted."
        },
        {
          q: "Do I pay taxes on my earnings?",
          a: "Likely yes, but tax laws vary by country. Consult a tax professional in your jurisdiction. We do NOT provide tax advice. Many countries consider crypto earnings as taxable income."
        },
        {
          q: "What if there's a dispute?",
          a: "All sales are final. Blockchain transactions cannot be reversed. We have no ability to refund, reverse, or modify transactions once they're confirmed on the blockchain."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-400">Find answers to common questions about Kings of Red</p>
        </div>

        {/* Search Tip */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-300">
            💡 <strong>Tip:</strong> Use Ctrl+F (or Cmd+F on Mac) to search for specific keywords on this page.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, catIndex) => {
            const CategoryIcon = category.icon;
            return (
              <div key={catIndex} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-b border-gray-700 p-4 flex items-center gap-3">
                  <CategoryIcon className="w-6 h-6 text-red-500" />
                  <h2 className="text-2xl font-bold">{category.category}</h2>
                </div>

                {/* Questions */}
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

        {/* Still Have Questions */}
        <div className="mt-12 bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-300 mb-6">
            Join our community to get help from experienced players and the team!
          </p>
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

        {/* Warning */}
        <div className="mt-8 bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-2">⚠️ Important Reminders</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Admins will NEVER DM you first</li>
                <li>• NEVER share your seed phrase or private keys with anyone</li>
                <li>• Always verify contract addresses on BaseScan before interacting</li>
                <li>• This is a game, not an investment platform</li>
                <li>• Only spend what you can afford to lose completely</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Button */}
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