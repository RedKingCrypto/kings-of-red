import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import {
  HERALD_CONTRACT_ADDRESS,
  HERALD_STAKING_ADDRESS,
  HERALD_ABI,
  HERALD_STAKING_ABI
} from './contractConfig';

const CLAN_NAMES = ['Smizfume', 'Coalheart', 'Warmdice', 'Bervation', 'Konfisof', 'Witkastle', 'Bowkin'];
const RARITY_NAMES = ['Bronze', 'Silver', 'Gold'];
const RARITY_COLORS = ['text-orange-400', 'text-gray-300', 'text-yellow-400'];
const PRODUCTION_RATES = [20, 65, 100]; // FOOD per day

export default function StakingPage({ connected, walletAddress, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [ownedHeralds, setOwnedHeralds] = useState([]);
  const [stakedHeralds, setStakedHeralds] = useState([]);
  const [pendingRewards, setPendingRewards] = useState({ total: '0', count: 0 });
  const [claimCost, setClaimCost] = useState('7');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (connected && walletAddress) {
      loadStakingData();
    }
  }, [connected, walletAddress]);

  const loadStakingData = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const heraldContract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, provider);
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, provider);
      
      // Get user's total Herald balance
      const balance = await heraldContract.balanceOf(walletAddress);
      const heraldCount = parseInt(balance.toString());
      
      // Get staked Herald IDs
      const stakedIds = await stakingContract.getUserStakedHeralds(walletAddress);
      
      // Get pending rewards
      const [totalRewards, readyCount] = await stakingContract.getPendingRewards(walletAddress);
      setPendingRewards({
        total: parseFloat(ethers.formatEther(totalRewards)).toFixed(2),
        count: parseInt(readyCount.toString())
      });
      
      // Get claim cost
      const cost = await stakingContract.claimCost();
      setClaimCost(ethers.formatEther(cost));
      
      // Load staked Heralds details
      const stakedDetails = await Promise.all(
        stakedIds.map(async (tokenId) => {
          const [owner, stakedAt, lastClaim, clan, rarity, canClaim] = await stakingContract.getStakeInfo(tokenId);
          const timeUntil = await stakingContract.getTimeUntilClaim(tokenId);
          
          return {
            tokenId: tokenId.toString(),
            clan: parseInt(clan),
            rarity: parseInt(rarity),
            canClaim,
            timeUntilClaim: parseInt(timeUntil.toString()),
            lastClaim: parseInt(lastClaim.toString())
          };
        })
      );
      
      setStakedHeralds(stakedDetails);
      
      // Calculate owned (unstaked) Heralds
      // For now, we'll show count only (full NFT loading can be added later)
      const unstakedCount = heraldCount - stakedIds.length;
      setOwnedHeralds(Array(unstakedCount).fill({ placeholder: true }));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading staking data:', error);
      setLoading(false);
      showMessage('error', 'Error loading staking data');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleApproveAndStake = async (tokenId) => {
    try {
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const heraldContract = new ethers.Contract(HERALD_CONTRACT_ADDRESS, HERALD_ABI, signer);
      
      // Approve staking contract
      showMessage('info', 'Approving Herald for staking...');
      const approveTx = await heraldContract.approve(HERALD_STAKING_ADDRESS, tokenId);
      await approveTx.wait();
      
      // Stake
      showMessage('info', 'Staking Herald...');
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, signer);
      const stakeTx = await stakingContract.stakeHerald(tokenId);
      await stakeTx.wait();
      
      showMessage('success', 'Herald staked successfully!');
      await loadStakingData();
      setProcessing(false);
    } catch (error) {
      console.error('Error staking:', error);
      showMessage('error', error.message || 'Failed to stake Herald');
      setProcessing(false);
    }
  };

  const handleUnstake = async (tokenId) => {
    try {
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, signer);
      
      showMessage('info', 'Unstaking Herald...');
      const tx = await stakingContract.unstakeHerald(tokenId);
      await tx.wait();
      
      showMessage('success', 'Herald unstaked successfully!');
      await loadStakingData();
      setProcessing(false);
    } catch (error) {
      console.error('Error unstaking:', error);
      showMessage('error', error.message || 'Failed to unstake Herald');
      setProcessing(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, signer);
      
      showMessage('info', 'Claiming rewards...');
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      
      showMessage('success', `Claimed ${pendingRewards.total} FOOD! Check Dashboard.`);
      await loadStakingData();
      setProcessing(false);
    } catch (error) {
      console.error('Error claiming:', error);
      const errorMsg = error.message.includes('Insufficient in-game GOLD')
        ? 'Not enough GOLD in-game balance! Visit Exchange to deposit GOLD.'
        : error.message || 'Failed to claim rewards';
      showMessage('error', errorMsg);
      setProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return 'Ready!';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Crown className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-8">
          Connect your wallet to stake your Heralds and earn FOOD tokens.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Herald Staking</h1>
        <p className="text-gray-400">
          Stake your Heralds to earn FOOD tokens. Max 7 Heralds (one per clan).
        </p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-300' :
          message.type === 'error' ? 'bg-red-900/20 border-red-800 text-red-300' :
          'bg-blue-900/20 border-blue-800 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {message.type === 'info' && <Loader className="w-5 h-5 animate-spin" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Rewards Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-red-500" />
            <h3 className="font-bold">Staked Heralds</h3>
          </div>
          <p className="text-3xl font-bold">{stakedHeralds.length} / 7</p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="w-6 h-6 text-blue-400" />
            <h3 className="font-bold">Pending FOOD</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">{pendingRewards.total}</p>
          <p className="text-xs text-gray-400 mt-1">{pendingRewards.count} Heralds ready</p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            <h3 className="font-bold">Claim Cost</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{claimCost} GOLD</p>
          <p className="text-xs text-gray-400 mt-1">per Herald</p>
        </div>
      </div>

      {/* Claim Button */}
      {pendingRewards.count > 0 && (
        <div className="mb-8">
          <button
            onClick={handleClaimRewards}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Claim {pendingRewards.total} FOOD ({pendingRewards.count} Heralds)
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-400 mt-2">
            Cost: {(parseFloat(claimCost) * pendingRewards.count).toFixed(2)} GOLD total
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your Heralds...</p>
        </div>
      ) : (
        <>
          {/* Staked Heralds */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Staked Heralds ({stakedHeralds.length})</h2>
            
            {stakedHeralds.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
                <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No Heralds staked yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stakedHeralds.map((herald) => (
                  <div key={herald.tokenId} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">Herald #{herald.tokenId}</h3>
                        <p className="text-sm text-gray-400">{CLAN_NAMES[herald.clan]}</p>
                        <p className={`text-sm font-semibold ${RARITY_COLORS[herald.rarity]}`}>
                          {RARITY_NAMES[herald.rarity]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Earning</p>
                        <p className="text-sm font-bold text-blue-400">{PRODUCTION_RATES[herald.rarity]} FOOD/day</p>
                      </div>
                    </div>

                    <div className="mb-3 p-2 bg-gray-900/50 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span className={herald.canClaim ? 'text-green-400' : 'text-gray-400'}>
                          {formatTime(herald.timeUntilClaim)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnstake(herald.tokenId)}
                      disabled={processing}
                      className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 px-4 py-2 rounded text-sm transition"
                    >
                      Unstake
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unstaked Heralds */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Heralds (Unstaked)</h2>
            
            {ownedHeralds.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
                <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  {stakedHeralds.length === 0 
                    ? "You don't own any Heralds yet"
                    : "All your Heralds are staked!"}
                </p>
                {stakedHeralds.length === 0 && (
                  <button
                    onClick={() => onNavigate('mint')}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Mint Herald NFTs
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-2">Full NFT Gallery Coming Soon!</p>
                    <p className="text-blue-400/80 mb-3">
                      You have {ownedHeralds.length} unstaked Herald{ownedHeralds.length !== 1 ? 's' : ''} in your wallet. 
                      To stake them, you'll need the token ID.
                    </p>
                    <p className="text-blue-400/80 mb-3">
                      <strong>How to find Token IDs:</strong>
                    </p>
                    <ol className="list-decimal ml-4 space-y-1 text-blue-400/80">
                      <li>Go to <a href={`https://basescan.org/token/${HERALD_CONTRACT_ADDRESS}?a=${walletAddress}`} target="_blank" rel="noopener noreferrer" className="underline">BaseScan (Your Heralds)</a></li>
                      <li>Find the Token ID you want to stake</li>
                      <li>Come back and use the contract directly (for now)</li>
                    </ol>
                    <p className="text-blue-400/80 mt-3">
                      We're building a visual NFT gallery that will show all your Heralds with images and one-click staking!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <p className="font-semibold mb-1">Important Notes</p>
            <ul className="list-disc ml-4 space-y-1 text-yellow-400/80">
              <li>Claims cost {claimCost} GOLD per Herald (paid from in-game balance)</li>
              <li>Each Herald has a 24-hour cooldown between claims</li>
              <li>Staked Heralds cannot be transferred or sold (unstake first)</li>
              <li>Need GOLD? Visit the <button onClick={() => onNavigate('exchange')} className="underline">Exchange page</button> to deposit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}