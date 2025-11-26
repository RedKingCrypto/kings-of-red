import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, Flame, Shield, Swords, Sparkles, Users, Trophy, Gift } from 'lucide-react';
import { ethers } from 'ethers';
import { HERALD_CONTRACT_ADDRESS, HERALD_ABI, BASE_MAINNET_CONFIG } from './contractConfig';

const CLANS = [
  { id: 0, name: 'Smizfume', color: 'from-red-600 to-orange-500', icon: Flame },
  { id: 1, name: 'Coalheart', color: 'from-gray-600 to-slate-400', icon: Shield },
  { id: 2, name: 'Warmdice', color: 'from-purple-600 to-indigo-500', icon: Crown },
  { id: 3, name: 'Bervation', color: 'from-blue-600 to-cyan-500', icon: Swords },
  { id: 4, name: 'Konfisof', color: 'from-green-600 to-emerald-500', icon: Shield },
  { id: 5, name: 'Witkastle', color: 'from-yellow-500 to-amber-400', icon: Crown },
  { id: 6, name: 'Bowkin', color: 'from-rose-600 to-red-700', icon: Flame }
];

export default function HeraldMintingPage({ onNavigate }) {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [userAffiliateCode, setUserAffiliateCode] = useState('');
  
  // Contract data
  const [supply, setSupply] = useState({
    bronze: { total: 100, minted: 0, price: '0.00221' },
    silver: { total: 77, minted: 0, price: '0.00728' },
    gold: { total: 43, minted: 0, price: '0.01234' }
  });
  const [loading, setLoading] = useState(false);

  // Load contract data on mount and when connected
  useEffect(() => {
    loadContractData();
    if (connected) {
      checkGenesisStatus();
    }
  }, [connected]);

  const loadContractData = async () => {
  try {
    setLoading(true);
    
    // Use connected wallet provider if available, otherwise use public RPC
    let provider;
    if (window.ethereum && connected) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      provider = new ethers.JsonRpcProvider(BASE_MAINNET_CONFIG.rpcUrls[0]);
    }
    
    const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, provider);
    
    // Load supply data - force fresh read
    const [bronzeMinted, silverMinted, goldMinted, bronzePrice, silverPrice, goldPrice] = await Promise.all([
      contract.bronzeMinted(),
      contract.silverMinted(),
      contract.goldMinted(),
      contract.bronzePrice(),
      contract.silverPrice(),
      contract.goldPrice()
    ]);
    
    console.log('Contract data loaded:', {
      bronze: Number(bronzeMinted),
      silver: Number(silverMinted),
      gold: Number(goldMinted)
    });
    
    setSupply({
      bronze: { 
        total: 100, 
        minted: Number(bronzeMinted), 
        price: ethers.formatEther(bronzePrice) 
      },
      silver: { 
        total: 77, 
        minted: Number(silverMinted), 
        price: ethers.formatEther(silverPrice) 
      },
      gold: { 
        total: 43, 
        minted: Number(goldMinted), 
        price: ethers.formatEther(goldPrice) 
      }
    });
  } catch (error) {
    console.error('Error loading contract data:', error);
  } finally {
    setLoading(false);
  }
};

  const checkGenesisStatus = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, provider);
      
      const hasGenesis = await contract.hasGenesisBadge(walletAddress);
      if (hasGenesis) {
        // Generate affiliate code based on wallet address
        const code = 'KOR-' + walletAddress.slice(2, 8).toUpperCase();
        setUserAffiliateCode(code);
      }
    } catch (error) {
      console.error('Error checking Genesis status:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to mint Heralds!\n\nMetaMask is a crypto wallet browser extension.\nDownload at: https://metamask.io');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Check if on Base network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== BASE_MAINNET_CONFIG.chainId) {
        // Try to switch to Base
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_MAINNET_CONFIG.chainId }],
          });
        } catch (switchError) {
          // If Base not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BASE_MAINNET_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      setWalletAddress(accounts[0]);
      setConnected(true);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const mintHerald = async (rarity) => {
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    setMinting(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, signer);
      
      // Get price for this rarity
      let price;
      let rarityNum;
      let rarityName;
      
      if (rarity === 'bronze') {
        price = await contract.bronzePrice();
        rarityNum = 0;
        rarityName = 'Bronze';
      } else if (rarity === 'silver') {
        price = await contract.silverPrice();
        rarityNum = 1;
        rarityName = 'Silver';
      } else {
        price = await contract.goldPrice();
        rarityNum = 2;
        rarityName = 'Gold';
      }
      
      // Check if sold out
      const remaining = supply[rarity].total - supply[rarity].minted;
      if (remaining <= 0) {
        alert(`${rarityName} Heralds are sold out!`);
        setMinting(false);
        return;
      }
      
      // Send mint transaction
      const tx = await contract.mintHerald(rarityNum, { value: price });
      
      alert('Transaction sent! Waiting for confirmation...\n\nThis may take 10-30 seconds.');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Parse the HeraldMinted event to get clan and tokenId
      let clanId = Math.floor(Math.random() * 7);
      let tokenId = '???';
      
      try {
        const event = receipt.logs.find(log => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === 'HeraldMinted';
          } catch {
            return false;
          }
        });
        
        if (event) {
          const parsed = contract.interface.parseLog(event);
          tokenId = parsed.args.tokenId.toString();
          clanId = Number(parsed.args.clan);
        }
      } catch (error) {
        console.error('Error parsing event:', error);
      }
      
      setMintSuccess({
        rarity: rarityName,
        clan: CLANS[clanId],
        tokenId: tokenId,
        price: ethers.formatEther(price),
        txHash: receipt.hash
      });
      
      // Reload contract data
      await loadContractData();
      
      // Check if this was their first mint (Genesis badge)
      if (connected) {
        await checkGenesisStatus();
      }
      
    } catch (error) {
      console.error('Minting failed:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction cancelled by user.');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient funds. Please add more ETH to your wallet on Base network.');
      } else if (error.message.includes('sold out')) {
        alert('This Herald rarity is sold out!');
      } else {
        alert('Minting failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    } finally {
      setMinting(false);
    }
  };

  const copyAffiliateLink = () => {
    const link = `https://kings-of-red-e2b2.vercel.app/mint?ref=${userAffiliateCode}`;
    navigator.clipboard.writeText(link);
    alert('Affiliate link copied to clipboard!');
  };

  const getRarityColor = (rarity) => {
    const r = rarity.toLowerCase();
    switch(r) {
      case 'gold': return 'from-yellow-600 to-amber-500';
      case 'silver': return 'from-gray-400 to-slate-300';
      case 'bronze': return 'from-orange-600 to-amber-700';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-red-800/50 bg-black/40 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-red-500" />
              <button 
                onClick={() => onNavigate && onNavigate('home')}
                className="hover:opacity-80 transition text-left"
              >
                <h1 className="text-2xl font-bold">KINGS OF RED</h1>
                <p className="text-sm text-gray-400">Herald Minting - Genesis Sale</p>
              </button>
            </div>
            
            {!connected ? (
              <button
                onClick={connectWallet}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <span className="text-sm text-gray-400">Connected:</span>
                <span className="ml-2 font-mono text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <Sparkles className="w-16 h-16 mx-auto text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-5xl font-bold mb-4">Mint Your Herald NFT</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Begin your journey in Kings of Red. Each Herald produces $KINGSFOOD tokens daily. 
            Clan is randomly assigned to create a vibrant secondary market.
          </p>
          
          {loading && (
            <p className="text-yellow-400 animate-pulse">Loading contract data...</p>
          )}
        </div>

        {/* Genesis Sale Perks */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6" />
            Genesis Sale Exclusive Perks
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Guaranteed lowest Price for First Generation Herald NFTs</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Exclusive Genesis Badge NFT</span>
            </li>
           </ul>
        </div>

        {/* Minting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {['bronze', 'silver', 'gold'].map(rarity => {
            const rarityData = supply[rarity];
            const remaining = rarityData.total - rarityData.minted;
            const percentMinted = (rarityData.minted / rarityData.total) * 100;
            const priceUSD = (parseFloat(rarityData.price) * 3160).toFixed(2); // ETH price ~$3160

            return (
              <div
                key={rarity}
                className={`bg-gradient-to-br ${getRarityColor(rarity)} p-0.5 rounded-xl`}
              >
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold capitalize mb-1">{rarity} Herald</h3>
                    <p className="text-3xl font-bold">{rarityData.price} ETH</p>
                    <p className="text-sm text-gray-400">(≈ ${priceUSD})</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Supply</span>
                      <span className="font-bold">{remaining}/{rarityData.total}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getRarityColor(rarity)} h-2 rounded-full transition-all`}
                        style={{ width: `${percentMinted}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-400 mb-2">Daily Mining Rate:</div>
                    <div className="text-xl font-bold">
                      {rarity === 'bronze' ? '20' : rarity === 'silver' ? '65' : '100'} $KINGSFOOD
                    </div>
                  </div>

                  <button
  onClick={() => mintHerald(rarity)}
  disabled={minting || remaining === 0 || !connected}
  className={`w-full py-3 rounded-lg font-bold transition ${
    remaining === 0
      ? 'bg-gray-700 cursor-not-allowed text-gray-500'
      : minting
      ? 'bg-gray-700 cursor-wait text-gray-300'
      : !connected
      ? 'bg-gray-700 cursor-not-allowed text-gray-400'
      : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
  }`}
>
  {!connected
    ? 'Connect Wallet'  // ❌ THIS IS THE PROBLEM LINE
    : remaining === 0
    ? 'SOLD OUT'
    : minting
    ? 'Minting...'
    : `Mint ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Herald`}
</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mint Success Modal */}
        {mintSuccess && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-green-500/50">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Herald Minted!</h3>
                <p className="text-gray-400 mb-6">Congratulations on your new Herald NFT</p>
                
                <div className={`bg-gradient-to-br ${mintSuccess.clan.color} p-0.5 rounded-xl mb-6`}>
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="text-yellow-400 font-bold text-lg mb-2">{mintSuccess.rarity}</div>
                    <div className="text-2xl font-bold mb-1">{mintSuccess.clan.name}</div>
                    <div className="text-sm text-gray-400">Token #{mintSuccess.tokenId}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price Paid:</span>
                    <span className="font-bold">{mintSuccess.price} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily Rewards:</span>
                    <span className="font-bold">
                      {mintSuccess.rarity === 'Gold' ? '100' : mintSuccess.rarity === 'Silver' ? '65' : '20'} FOOD
                    </span>
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
  loadContractData(); // Refresh supply counts
}}
                  className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Affiliate System */}
        {connected && userAffiliateCode && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Your Genesis Affiliate Code
            </h3>
            <p className="text-gray-300 mb-4">
              Share your unique link and earn 10% commission on every Herald minted through your referral!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`https://kings-of-red-e2b2.vercel.app/mint?ref=${userAffiliateCode}`}
                readOnly
                className="flex-1 bg-black/50 border border-green-500/30 rounded-lg px-4 py-2 font-mono text-sm"
              />
              <button
                onClick={copyAffiliateLink}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold transition"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Random Clan Info */}
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4">Seven Legendary Clans</h3>
          <p className="text-gray-300 mb-4">
            Your Herald's clan is randomly assigned during minting. Each clan has unique lore and future utility. Collect them all or trade for your favorites!
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

        {/* FAQ / Info */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">What happens after minting?</h4>
            <p className="text-gray-300 text-sm">
              Your Herald NFT will appear in your wallet immediately. Once staking opens you can stake your Herald and start earning $KINGSFOOD tokens every 24 hours!
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">Can I choose my clan?</h4>
            <p className="text-gray-300 text-sm">
              No, clans are randomly assigned to ensure fair distribution and create an active secondary marketplace where players trade to complete their collections.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-bold mb-2">What's the difference between rarities?</h4>
            <p className="text-gray-300 text-sm">
              Bronze Heralds produce 20 FOOD/day, Silver produce 65 FOOD/day, and Gold produce 100 FOOD/day. 
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-red-800/50 bg-black/40 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Kings of Red © 2025 • Built on Base Network</p>
            <p className="mt-2">
              Contract: <a 
                href={`https://basescan.org/address/${HERALD_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono"
              >
                {HERALD_CONTRACT_ADDRESS.slice(0, 6)}...{HERALD_CONTRACT_ADDRESS.slice(-4)}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}