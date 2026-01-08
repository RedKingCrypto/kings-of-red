// MintFighter.jsx - CORRECTED VERSION
// This version properly checks Fighter V4 contract at 0x303C26E8819be824f6bAEdAeEb3a2DeF3B624552

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';

// ============================================
// FIGHTER V4 CONTRACT CONFIGURATION
// ============================================
const FIGHTER_ADDRESS = '0x303C26E8819be824f6bAEdAeEb3a2DeF3B624552';

const FIGHTER_ABI = [
    // Read functions
    "function mintingPaused() view returns (bool)",
    "function currentPhase() view returns (uint8)",
    "function bronzePrice() view returns (uint256)",
    "function silverPrice() view returns (uint256)",
    "function goldPrice() view returns (uint256)",
    "function bronzeMinted() view returns (uint256)",
    "function silverMinted() view returns (uint256)",
    "function goldMinted() view returns (uint256)",
    "function getPhaseSupply(uint8 phase) view returns (uint256 bronze, uint256 silver, uint256 gold)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    // Write functions
    "function mintBronze(uint256 quantity) payable",
    "function mintSilver(uint256 quantity) payable",
    "function mintGold(uint256 quantity) payable",
    // Events
    "event FighterMinted(address indexed owner, uint256 indexed tokenId, uint8 rarity, uint8 clan)"
];

const CLANS = [
    { id: 0, name: 'Smizfume', color: 'from-red-600 to-orange-500' },
    { id: 1, name: 'Coalheart', color: 'from-gray-600 to-slate-400' },
    { id: 2, name: 'Warmdice', color: 'from-purple-600 to-indigo-500' },
    { id: 3, name: 'Bervation', color: 'from-blue-600 to-cyan-500' },
    { id: 4, name: 'Konfisof', color: 'from-green-600 to-emerald-500' },
    { id: 5, name: 'Witkastle', color: 'from-yellow-500 to-amber-400' },
    { id: 6, name: 'Bowkin', color: 'from-rose-600 to-red-700' }
];

const PHASE_NAMES = ['None', 'Genesis Sale', 'Early Bird Sale', 'Public Sale A', 'Public Sale B'];

const MintFighter = () => {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    // State
    const [isMintingActive, setIsMintingActive] = useState(false);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [mintingPaused, setMintingPaused] = useState(true);
    const [prices, setPrices] = useState({ bronze: '0', silver: '0', gold: '0' });
    const [minted, setMinted] = useState({ bronze: 0, silver: 0, gold: 0 });
    const [phaseSupply, setPhaseSupply] = useState({ bronze: 0, silver: 0, gold: 0 });
    const [selectedRarity, setSelectedRarity] = useState(0); // 0=bronze, 1=silver, 2=gold
    const [quantity, setQuantity] = useState(1);
    const [isMinting, setIsMinting] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [mintResult, setMintResult] = useState(null);
    const [debugInfo, setDebugInfo] = useState(''); // For debugging

    // ============================================
    // CRITICAL: Load contract state
    // ============================================
    const loadContractState = async () => {
        try {
            const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
            const contract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, provider);

            // Read mintingPaused
            const paused = await contract.mintingPaused();
            setMintingPaused(paused);
            console.log('mintingPaused:', paused);

            // Read currentPhase
            const phase = await contract.currentPhase();
            const phaseNum = Number(phase);
            setCurrentPhase(phaseNum);
            console.log('currentPhase:', phaseNum);

            // CRITICAL: Determine if minting is active
            // Minting is active when: NOT paused AND phase > 0
            const isActive = !paused && phaseNum > 0;
            setIsMintingActive(isActive);
            console.log('isMintingActive:', isActive);

            // Set debug info
            setDebugInfo(`paused=${paused}, phase=${phaseNum}, active=${isActive}`);

            // Read prices
            const [bronzePrice, silverPrice, goldPrice] = await Promise.all([
                contract.bronzePrice(),
                contract.silverPrice(),
                contract.goldPrice()
            ]);
            setPrices({
                bronze: ethers.utils.formatEther(bronzePrice),
                silver: ethers.utils.formatEther(silverPrice),
                gold: ethers.utils.formatEther(goldPrice)
            });

            // Read minted counts
            const [bronzeMinted, silverMinted, goldMinted] = await Promise.all([
                contract.bronzeMinted(),
                contract.silverMinted(),
                contract.goldMinted()
            ]);
            setMinted({
                bronze: Number(bronzeMinted),
                silver: Number(silverMinted),
                gold: Number(goldMinted)
            });

            // Read phase supply if phase > 0
            if (phaseNum > 0) {
                const supply = await contract.getPhaseSupply(phaseNum);
                setPhaseSupply({
                    bronze: Number(supply.bronze),
                    silver: Number(supply.silver),
                    gold: Number(supply.gold)
                });
            }

        } catch (error) {
            console.error('Error loading contract state:', error);
            setDebugInfo(`ERROR: ${error.message}`);
        }
    };

    // Load on mount and periodically
    useEffect(() => {
        loadContractState();
        const interval = setInterval(loadContractState, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // MINT FUNCTION
    // ============================================
    const handleMint = async () => {
        if (!isConnected || !walletClient) {
            setTxStatus('Please connect your wallet');
            return;
        }

        if (!isMintingActive) {
            setTxStatus('Minting is not currently active');
            return;
        }

        setIsMinting(true);
        setTxStatus('Preparing transaction...');
        setMintResult(null);

        try {
            const provider = new ethers.providers.Web3Provider(walletClient);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(FIGHTER_ADDRESS, FIGHTER_ABI, signer);

            // Determine price and function based on rarity
            let price, mintFunction;
            if (selectedRarity === 0) {
                price = ethers.utils.parseEther(prices.bronze);
                mintFunction = 'mintBronze';
            } else if (selectedRarity === 1) {
                price = ethers.utils.parseEther(prices.silver);
                mintFunction = 'mintSilver';
            } else {
                price = ethers.utils.parseEther(prices.gold);
                mintFunction = 'mintGold';
            }

            const totalCost = price.mul(quantity);

            setTxStatus('Please confirm in wallet...');

            // Execute mint
            const tx = await contract[mintFunction](quantity, {
                value: totalCost
            });

            setTxStatus('Transaction submitted, waiting for confirmation...');

            const receipt = await tx.wait();

            // Parse events to get token info
            const mintEvent = receipt.events?.find(e => e.event === 'FighterMinted');
            if (mintEvent) {
                const tokenId = mintEvent.args.tokenId.toString();
                const rarity = Number(mintEvent.args.rarity);
                const clan = Number(mintEvent.args.clan);

                setMintResult({
                    tokenId,
                    rarity: ['Bronze', 'Silver', 'Gold'][rarity],
                    clan: CLANS[clan]?.name || `Clan ${clan}`,
                    txHash: receipt.transactionHash
                });
            } else {
                // Fallback if event parsing fails
                setMintResult({
                    tokenId: '(check wallet)',
                    rarity: ['Bronze', 'Silver', 'Gold'][selectedRarity],
                    clan: 'Random',
                    txHash: receipt.transactionHash
                });
            }

            setTxStatus('Success!');
            loadContractState(); // Refresh counts

        } catch (error) {
            console.error('Mint error:', error);
            setTxStatus(`Error: ${error.message || 'Transaction failed'}`);
        } finally {
            setIsMinting(false);
        }
    };

    // ============================================
    // RENDER
    // ============================================
    const rarityNames = ['Bronze', 'Silver', 'Gold'];
    const rarityColors = ['text-amber-600', 'text-gray-400', 'text-yellow-400'];
    const currentPrice = selectedRarity === 0 ? prices.bronze : selectedRarity === 1 ? prices.silver : prices.gold;
    const currentMinted = selectedRarity === 0 ? minted.bronze : selectedRarity === 1 ? minted.silver : minted.gold;
    const currentSupply = selectedRarity === 0 ? phaseSupply.bronze : selectedRarity === 1 ? phaseSupply.silver : phaseSupply.gold;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-2">⚔️ Mint Fighter NFT</h1>
                <p className="text-center text-gray-400 mb-8">Battle-ready warriors for the Kings of Red arena</p>

                {/* Debug Info - Remove in production */}
                <div className="bg-gray-800/50 p-2 rounded mb-4 text-xs text-gray-500">
                    Debug: {debugInfo} | Contract: {FIGHTER_ADDRESS.slice(0, 10)}...
                </div>

                {/* Minting Status Banner */}
                {!isMintingActive ? (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-center">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-red-200 font-semibold">Minting is not currently active</p>
                        <p className="text-red-300 text-sm">
                            {mintingPaused ? 'Minting is paused' : currentPhase === 0 ? 'No active sale phase' : 'Please check back when the sale begins'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-6 text-center">
                        <span className="text-2xl">✅</span>
                        <p className="text-green-200 font-semibold">{PHASE_NAMES[currentPhase]} is LIVE!</p>
                    </div>
                )}

                {/* Sale Phase Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <h2 className="text-xl font-bold mb-2">{PHASE_NAMES[currentPhase] || 'No Active Phase'}</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-amber-600 font-bold">Bronze</p>
                            <p>{minted.bronze} / {phaseSupply.bronze}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 font-bold">Silver</p>
                            <p>{minted.silver} / {phaseSupply.silver}</p>
                        </div>
                        <div>
                            <p className="text-yellow-400 font-bold">Gold</p>
                            <p>{minted.gold} / {phaseSupply.gold}</p>
                        </div>
                    </div>
                </div>

                {/* Rarity Selection */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[0, 1, 2].map((rarity) => (
                        <button
                            key={rarity}
                            onClick={() => setSelectedRarity(rarity)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                selectedRarity === rarity 
                                    ? 'border-purple-500 bg-purple-900/50' 
                                    : 'border-gray-600 bg-gray-800/50 hover:border-purple-400'
                            }`}
                        >
                            <p className={`text-xl font-bold ${rarityColors[rarity]}`}>
                                {rarityNames[rarity]}
                            </p>
                            <p className="text-lg">{rarity === 0 ? prices.bronze : rarity === 1 ? prices.silver : prices.gold} ETH</p>
                        </button>
                    ))}
                </div>

                {/* Quantity Selection */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <label className="block text-sm mb-2">Quantity</label>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
                        >-</button>
                        <span className="text-2xl font-bold">{quantity}</span>
                        <button 
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
                        >+</button>
                    </div>
                    <p className="mt-2 text-gray-400">
                        Total: {(parseFloat(currentPrice) * quantity).toFixed(5)} ETH
                    </p>
                </div>

                {/* Mint Button */}
                <button
                    onClick={handleMint}
                    disabled={!isMintingActive || isMinting || !isConnected}
                    className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${
                        isMintingActive && isConnected && !isMinting
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                            : 'bg-gray-600 cursor-not-allowed'
                    }`}
                >
                    {!isConnected 
                        ? 'Connect Wallet' 
                        : isMinting 
                            ? 'Minting...' 
                            : !isMintingActive 
                                ? 'Minting Not Active' 
                                : `Mint ${quantity} ${rarityNames[selectedRarity]} Fighter${quantity > 1 ? 's' : ''}`
                    }
                </button>

                {/* Transaction Status */}
                {txStatus && (
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                        <p>{txStatus}</p>
                    </div>
                )}

                {/* Mint Result */}
                {mintResult && (
                    <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded-lg">
                        <h3 className="font-bold text-green-300 mb-2">🎉 Fighter Minted!</h3>
                        <p>Token ID: #{mintResult.tokenId}</p>
                        <p>Rarity: {mintResult.rarity}</p>
                        <p>Clan: {mintResult.clan}</p>
                        <a 
                            href={`https://basescan.org/tx/${mintResult.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-sm"
                        >
                            View on BaseScan →
                        </a>
                    </div>
                )}

                {/* Refresh Button */}
                <button
                    onClick={loadContractState}
                    className="mt-4 text-gray-400 hover:text-white underline"
                >
                    Refresh Contract State
                </button>
            </div>
        </div>
    );
};

export default MintFighter;
