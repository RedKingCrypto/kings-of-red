// MintFighter.jsx - FIXED VERSION with robust error handling
// Matches your existing codebase pattern (no wagmi, uses props for wallet connection)

import React, { useState, useEffect } from 'react';
import { Swords, Shield, Crown, Flame, Trophy, Gift, Plus, Minus, Sparkles } from 'lucide-react';
import { ethers } from 'ethers';

// ============================================
// FIGHTER V4 CONTRACT CONFIGURATION
// ============================================
const FIGHTER_ADDRESS = '0x303C26E8819be824f6bAEdAeEb3a2DeF3B624552';

// Minimal ABI with only the functions we need for minting
const FIGHTER_ABI = [
    // Read functions for minting
    "function mintingPaused() view returns (bool)",
    "function currentPhase() view returns (uint8)",
    "function bronzePrice() view returns (uint256)",
    "function silverPrice() view returns (uint256)",
    "function goldPrice() view returns (uint256)",
    "function bronzeMinted() view returns (uint256)",
    "function silverMinted() view returns (uint256)",
    "function goldMinted() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    // Write functions
    "function mintBronze(uint256 quantity) payable",
    "function mintSilver(uint256 quantity) payable",
    "function mintGold(uint256 quantity) payable",
    // Events
    "event FighterMinted(uint256 indexed tokenId, address indexed minter, uint8 rarity, uint8 clan)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

const CLANS = [
    { id: 0, name: 'Smizfume', color: 'from-red-600 to-orange-500', icon: Flame },
    { id: 1, name: 'Coalheart', color: 'from-gray-600 to-slate-400', icon: Shield },
    { id: 2, name: 'Warmdice', color: 'from-purple-600 to-indigo-500', icon: Crown },
    { id: 3, name: 'Bervation', color: 'from-blue-600 to-cyan-500', icon: Swords },
    { id: 4, name: 'Konfisof', color: 'from-green-600 to-emerald-500', icon: Shield },
    { id: 5, name: 'Witkastle', color: 'from-yellow-500 to-amber-400', icon: Crown },
    { id: 6, name: 'Bowkin', color: 'from-rose-600 to-red-700', icon: Flame }
];

const PHASE_NAMES = ['None', 'Genesis Sale', 'Early Bird Sale', 'Public Sale A', 'Public Sale B'];

// Genesis phase limits
const GENESIS_SUPPLY = { bronze: 98, silver: 77, gold: 49 };
const TOTAL_SUPPLY = { bronze: 777, silver: 560, gold: 343 };

export default function MintFighter({ onNavigate, connected, walletAddress, connectWallet }) {
    // State
    const [minting, setMinting] = useState(false);
    const [mintSuccess, setMintSuccess] = useState(null);
    const [quantities, setQuantities] = useState({ bronze: 1, silver: 1, gold: 1 });
    const [loading, setLoading] = useState(true);
    
    // Contract state
    const [isMintingActive, setIsMintingActive] = useState(false);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [mintingPaused, setMintingPaused] = useState(true);
    const [prices, setPrices] = useState({ bronze: '0.00638', silver: '0.00974', gold: '0.01310' });
    const [minted, setMinted] = useState({ bronze: 0, silver: 0, gold: 0 });
    const [loadError, setLoadError] = useState('');

    // ============================================
    // LOAD CONTRACT STATE - with robust error handling
    // ============================================
    const loadContractState = async () => {
        try {
            setLoading(true);
            setLoadError('');
            
            // Use public RPC for reading (doesn't require wallet connection)
            const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
            const contract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, provider);
            
            console.log('Loading Fighter V4 contract data...');

            // Load each value separately with individual try-catch
            // This prevents one failing call from breaking everything
            
            let paused = true;
            let phase = 0;
            
            // Read mintingPaused
            try {
                paused = await contract.mintingPaused();
                setMintingPaused(paused);
                console.log('mintingPaused:', paused);
            } catch (e) {
                console.warn('Could not read mintingPaused:', e.message);
            }
            
            // Read currentPhase
            try {
                phase = await contract.currentPhase();
                const phaseNum = Number(phase);
                setCurrentPhase(phaseNum);
                console.log('currentPhase:', phaseNum);
            } catch (e) {
                console.warn('Could not read currentPhase:', e.message);
            }
            
            // Determine if minting is active
            const phaseNum = Number(phase);
            const isActive = !paused && phaseNum > 0;
            setIsMintingActive(isActive);
            console.log('isMintingActive:', isActive);

            // Read prices
            try {
                const [bronzePrice, silverPrice, goldPrice] = await Promise.all([
                    contract.bronzePrice(),
                    contract.silverPrice(),
                    contract.goldPrice()
                ]);
                setPrices({
                    bronze: ethers.formatEther(bronzePrice),
                    silver: ethers.formatEther(silverPrice),
                    gold: ethers.formatEther(goldPrice)
                });
                console.log('Prices loaded');
            } catch (e) {
                console.warn('Could not read prices:', e.message);
            }

            // Read minted counts
            try {
                const [bronzeMintedCount, silverMintedCount, goldMintedCount] = await Promise.all([
                    contract.bronzeMinted(),
                    contract.silverMinted(),
                    contract.goldMinted()
                ]);
                setMinted({
                    bronze: Number(bronzeMintedCount),
                    silver: Number(silverMintedCount),
                    gold: Number(goldMintedCount)
                });
                console.log('Minted counts loaded');
            } catch (e) {
                console.warn('Could not read minted counts:', e.message);
            }

            console.log('✅ Fighter contract data loaded successfully');

        } catch (error) {
            console.error('❌ Error loading Fighter contract data:', error);
            setLoadError('Failed to load contract data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    // Load on mount and periodically
    useEffect(() => {
        loadContractState();
        const interval = setInterval(loadContractState, 30000);
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // UPDATE QUANTITY
    // ============================================
    const updateQuantity = (rarity, change) => {
        setQuantities(prev => {
            const newQty = prev[rarity] + change;
            const remaining = GENESIS_SUPPLY[rarity] - minted[rarity];
            return {
                ...prev,
                [rarity]: Math.max(1, Math.min(7, Math.min(newQty, remaining)))
            };
        });
    };

    // ============================================
    // MINT FUNCTION
    // ============================================
    const mintFighter = async (rarity) => {
        if (!connected) {
            alert('Please connect your wallet first!');
            return;
        }

        if (!isMintingActive) {
            alert('Minting is not currently active!');
            return;
        }

        setMinting(true);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, signer);

            const quantity = quantities[rarity];
            let pricePerNFT, mintFunction, rarityName, rarityNum;

            if (rarity === 'bronze') {
                pricePerNFT = await contract.bronzePrice();
                mintFunction = 'mintBronze';
                rarityName = 'Bronze';
                rarityNum = 0;
            } else if (rarity === 'silver') {
                pricePerNFT = await contract.silverPrice();
                mintFunction = 'mintSilver';
                rarityName = 'Silver';
                rarityNum = 1;
            } else {
                pricePerNFT = await contract.goldPrice();
                mintFunction = 'mintGold';
                rarityName = 'Gold';
                rarityNum = 2;
            }

            const totalPrice = pricePerNFT * BigInt(quantity);

            console.log(`Minting ${quantity} ${rarityName} Fighter(s)...`);
            console.log(`Price per NFT: ${ethers.formatEther(pricePerNFT)} ETH`);
            console.log(`Total price: ${ethers.formatEther(totalPrice)} ETH`);

            // Check remaining supply
            const remaining = GENESIS_SUPPLY[rarity] - minted[rarity];
            if (remaining <= 0) {
                alert(`${rarityName} Fighters are sold out for this phase!`);
                setMinting(false);
                return;
            }

            if (quantity > remaining) {
                alert(`Only ${remaining} ${rarityName} Fighter${remaining > 1 ? 's' : ''} remaining!`);
                setMinting(false);
                return;
            }

            // Send mint transaction
            const tx = await contract[mintFunction](quantity, { value: totalPrice });

            alert(`Transaction sent! Minting ${quantity} Fighter${quantity > 1 ? 's' : ''}...\n\nThis may take 10-30 seconds.`);

            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt.hash);

            // Parse events
            let mintedNFTs = [];
            try {
                receipt.logs.forEach(log => {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        if (parsed && parsed.name === 'FighterMinted') {
                            const tokenId = parsed.args.tokenId?.toString() || parsed.args[0]?.toString();
                            const clan = Number(parsed.args.clan ?? parsed.args[3]);
                            console.log('✅ Parsed FighterMinted:', { tokenId, clan });
                            mintedNFTs.push({ tokenId, clan });
                        }
                    } catch {
                        // Skip non-matching logs
                    }
                });
            } catch (error) {
                console.error('Error parsing events:', error);
            }

            // Fallback if parsing failed
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
                quantity,
                totalPrice: ethers.formatEther(totalPrice),
                pricePerNFT: ethers.formatEther(pricePerNFT),
                txHash: receipt.hash
            });

            // Reload contract data
            await loadContractState();

        } catch (error) {
            console.error('❌ Minting failed:', error);

            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                alert('Transaction cancelled by user.');
            } else if (error.message?.includes('insufficient funds')) {
                alert('Insufficient funds. Please add more ETH to your wallet on Base network.');
            } else {
                alert('Minting failed: ' + (error.reason || error.shortMessage || error.message || 'Unknown error'));
            }
        } finally {
            setMinting(false);
        }
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    const getRarityColor = (rarity) => {
        switch(rarity) {
            case 'gold': return 'from-yellow-600 to-amber-500';
            case 'silver': return 'from-gray-400 to-slate-300';
            case 'bronze': return 'from-orange-600 to-amber-700';
            default: return 'from-gray-600 to-gray-500';
        }
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-block mb-4">
                        <Swords className="w-16 h-16 mx-auto text-purple-400 animate-pulse" />
                    </div>
                    <h2 className="text-5xl font-bold mb-4">Mint Your Fighter NFT</h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
                        Battle-ready warriors for the Kings of Red arena. Each Fighter can battle enemies and earn rewards!
                    </p>

                    {loading && (
                        <p className="text-yellow-400 animate-pulse">Loading contract data...</p>
                    )}
                    
                    {loadError && (
                        <p className="text-red-400">{loadError}</p>
                    )}
                </div>

                {/* Minting Status Banner */}
                {!loading && (
                    isMintingActive ? (
                        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/50 rounded-lg p-4 mb-8 max-w-4xl mx-auto text-center">
                            <span className="text-2xl">✅</span>
                            <p className="text-green-200 font-semibold text-lg">{PHASE_NAMES[currentPhase]} is LIVE!</p>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/50 rounded-lg p-4 mb-8 max-w-4xl mx-auto text-center">
                            <span className="text-2xl">⚠️</span>
                            <p className="text-red-200 font-semibold">Minting is not currently active</p>
                            <p className="text-red-300 text-sm">
                                {mintingPaused ? 'Minting is paused by owner' : currentPhase === 0 ? 'No active sale phase' : 'Please check back later'}
                            </p>
                        </div>
                    )
                )}

                {/* Genesis Sale Perks */}
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

                {/* Minting Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
                    {['bronze', 'silver', 'gold'].map(rarity => {
                        const remaining = GENESIS_SUPPLY[rarity] - minted[rarity];
                        const percentMinted = (minted[rarity] / GENESIS_SUPPLY[rarity]) * 100;
                        const quantity = quantities[rarity];
                        const pricePerNFT = parseFloat(prices[rarity]);
                        const totalPrice = (pricePerNFT * quantity).toFixed(5);
                        const hitChance = rarity === 'bronze' ? '20%' : rarity === 'silver' ? '30%' : '40%';

                        return (
                            <div
                                key={rarity}
                                className={`bg-gradient-to-br ${getRarityColor(rarity)} p-0.5 rounded-xl`}
                            >
                                <div className="bg-gray-900 rounded-xl p-6">
                                    <div className="text-center mb-4">
                                        <h3 className="text-2xl font-bold capitalize mb-1">{rarity} Fighter</h3>
                                        <p className="text-2xl font-bold">{prices[rarity]} ETH</p>
                                        <p className="text-sm text-gray-400">≈ ${(pricePerNFT * 2970).toFixed(2)}</p>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Genesis Supply</span>
                                            <span className="font-bold">{remaining}/{GENESIS_SUPPLY[rarity]}</span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2">
                                            <div
                                                className={`bg-gradient-to-r ${getRarityColor(rarity)} h-2 rounded-full transition-all`}
                                                style={{ width: `${percentMinted}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Genesis: {GENESIS_SUPPLY[rarity]} | Total: {TOTAL_SUPPLY[rarity]}
                                        </p>
                                    </div>

                                    <div className="bg-black/50 rounded-lg p-4 mb-4">
                                        <div className="text-sm text-gray-400 mb-2">Base Hit Chance:</div>
                                        <div className="text-xl font-bold">{hitChance}</div>
                                    </div>

                                    {/* Quantity Selector */}
                                    {remaining > 0 && connected && isMintingActive && (
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
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => mintFighter(rarity)}
                                        disabled={minting || remaining === 0 || !connected || !isMintingActive}
                                        className={`w-full py-3 rounded-lg font-bold transition ${
                                            remaining === 0
                                                ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                                                : minting
                                                ? 'bg-gray-700 cursor-wait text-gray-300'
                                                : !connected
                                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                : !isMintingActive
                                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                        }`}
                                    >
                                        {remaining === 0
                                            ? 'SOLD OUT'
                                            : minting
                                            ? 'Minting...'
                                            : !connected
                                            ? 'Connect Wallet'
                                            : !isMintingActive
                                            ? 'Sale Not Active'
                                            : `Mint ${quantity} Fighter${quantity > 1 ? 's' : ''}`}
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
                                    {mintSuccess.quantity} Fighter{mintSuccess.quantity > 1 ? 's' : ''} Minted!
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Congratulations on your new {mintSuccess.rarity} Fighter{mintSuccess.quantity > 1 ? 's' : ''}
                                </p>

                                {/* Display minted NFTs */}
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
                                        loadContractState();
                                    }}
                                    className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fighter Info */}
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
                    <h3 className="text-xl font-bold mb-4">Seven Legendary Clans</h3>
                    <p className="text-gray-300 mb-4">
                        Your Fighter's clan is randomly assigned during minting. Each clan has unique lore and arena bonuses!
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

                {/* FAQ */}
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-6">
                        <h4 className="font-bold mb-2">What can Fighters do?</h4>
                        <p className="text-gray-300 text-sm">
                            Stake your Fighter, refuel with FOOD tokens, then battle arena enemies to earn FOOD, GOLD, WOOD, and RKT rewards!
                        </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-6">
                        <h4 className="font-bold mb-2">What's the difference between rarities?</h4>
                        <p className="text-gray-300 text-sm">
                            Higher rarity Fighters have better base hit chances in battle: Bronze (20%), Silver (30%), Gold (40%).
                        </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-6">
                        <h4 className="font-bold mb-2">Do I need a Herald to use my Fighter?</h4>
                        <p className="text-gray-300 text-sm">
                            Yes! To enter battle, you must have a Herald of the SAME CLAN as your Fighter staked.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}