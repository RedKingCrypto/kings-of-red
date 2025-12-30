import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, AlertCircle, CheckCircle, Loader, Plus } from 'lucide-react';
import { ethers } from 'ethers';
import {
  HERALD_ADDRESS,
  HERALD_STAKING_ADDRESS,
  HERALD_ABI,
  HERALD_STAKING_ABI,
  CLAN_NAMES,
  RARITY_NAMES,
  getHeraldImageUrl
} from './contractConfig';

const CLAN_COLORS = [
  'from-red-600 to-orange-500',
  'from-gray-600 to-slate-400',
  'from-purple-600 to-indigo-500',
  'from-blue-600 to-cyan-500',
  'from-green-600 to-emerald-500',
  'from-yellow-500 to-amber-400',
  'from-rose-600 to-red-700'
];

const RARITY_COLORS = ['text-orange-400', 'text-gray-300', 'text-yellow-400'];
const PRODUCTION_RATES = [20, 65, 100];

export default function StakingPage({ connected, walletAddress, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stakedByClans, setStakedByClans] = useState({});
  const [ownedHeralds, setOwnedHeralds] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [claimingClan, setClaimingClan] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedClan, setSelectedClan] = useState(null);

  useEffect(() => {
    if (connected && walletAddress) {
      loadStakingData();
      // Refresh every 60 seconds
      const interval = setInterval(loadStakingData, 60000);
      return () => clearInterval(interval);
    }
  }, [connected, walletAddress]);

  const loadStakingData = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, provider);
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI, provider);
      
      // Get staked Herald IDs
      const stakedIds = await stakingContract.getUserStakedHeralds(walletAddress);
      
      // Load staked Heralds details organized by clan
      const stakedData = {};
      for (let i = 0; i < stakedIds.length; i++) {
        const tokenId = stakedIds[i];
        const [owner, stakedAt, lastClaim, clan, rarity, canClaim] = await stakingContract.getStakeInfo(tokenId);
        const timeUntil = await stakingContract.getTimeUntilClaim(tokenId);
        
        const clanNum = parseInt(clan);
        stakedData[clanNum] = {
          tokenId: tokenId.toString(),
          clan: clanNum,
          rarity: parseInt(rarity),
          canClaim,
          timeUntilClaim: parseInt(timeUntil.toString()),
          lastClaim: parseInt(lastClaim.toString()),
          imageUrl: getHeraldImageUrl(clanNum, parseInt(rarity))
        };
      }
      
      setStakedByClans(stakedData);
      
      // Load owned (unstaked) Heralds using Transfer events
      const transferFilter = heraldContract.filters.Transfer(null, walletAddress);
      const transferEvents = await heraldContract.queryFilter(transferFilter, 0, 'latest');
      const potentialTokenIds = [...new Set(transferEvents.map(event => event.args.tokenId.toString()))];
      
      const userHeralds = [];
      for (const tokenId of potentialTokenIds) {
        try {
          const owner = await heraldContract.ownerOf(tokenId);
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            // Check if it's staked
            const isStaked = stakedIds.some(id => id.toString() === tokenId);
            if (!isStaked) {
              const [rarity, clan] = await heraldContract.getHerald(tokenId);
              userHeralds.push({
                tokenId: tokenId,
                rarity: parseInt(rarity),
                clan: parseInt(clan),
                imageUrl: getHeraldImageUrl(parseInt(clan), parseInt(rarity))
              });
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      setOwnedHeralds(userHeralds);
      setLoading(false);
    } catch (error) {
      console.error('Error loading staking data:', error);
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleStake = async (tokenId, clanId) => {
    try {
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI, signer);
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, signer);
      
      // Check if already approved
      const approved = await heraldContract.getApproved(tokenId);
      if (approved.toLowerCase() !== HERALD_STAKING_ADDRESS.toLowerCase()) {
        showMessage('info', 'Approving Herald for staking...');
        const approveTx = await heraldContract.approve(HERALD_STAKING_ADDRESS, tokenId);
        await approveTx.wait();
      }
      
      // Stake
      showMessage('info', 'Staking Herald...');
      const stakeTx = await stakingContract.stakeHerald(tokenId);
      await stakeTx.wait();
      
      showMessage('success', 'Herald staked successfully!');
      setShowStakeModal(false);
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
      showMessage('error', error.message || 'Failed to unstake');
      setProcessing(false);
    }
  };

  const handleClaimClan = async (clanId) => {
    const herald = stakedByClans[clanId];
    if (!herald || !herald.canClaim) return;
    
    try {
      setClaimingClan(clanId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI, signer);
      
      showMessage('info', 'Claiming rewards...');
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      
      showMessage('success', `Claimed ${PRODUCTION_RATES[herald.rarity]} FOOD! Check Dashboard.`);
      await loadStakingData();
      setClaimingClan(null);
    } catch (error) {
      console.error('Error claiming:', error);
      const errorMsg = error.message.includes('Insufficient in-game GOLD')
        ? 'Not enough GOLD! Visit Exchange to deposit GOLD.'
        : error.message || 'Failed to claim';
      showMessage('error', errorMsg);
      setClaimingClan(null);
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
        <p className="text-gray-400 mb-8">Connect to stake Heralds and earn FOOD tokens.</p>
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Herald Staking</h1>
        <p className="text-gray-400">Stake one Herald per clan to earn FOOD tokens (max 7 total)</p>
      </div>

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

      {loading ? (
        <div className="text-center py-16">
          <Loader className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Heralds...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CLAN_NAMES.map((clanName, clanId) => {
              const herald = stakedByClans[clanId];
              const isStaked = !!herald;
              
              return (
                <div key={clanId} className={`bg-gradient-to-br ${CLAN_COLORS[clanId]} p-1 rounded-lg`}>
                  <div className="bg-gray-900 rounded-lg overflow-hidden h-full">
                    <div className="p-3 border-b border-gray-800">
                      <h3 className="font-bold text-center">{clanName}</h3>
                      {isStaked && (
                        <p className={`text-center text-sm ${RARITY_COLORS[herald.rarity]}`}>
                          {RARITY_NAMES[herald.rarity]}
                        </p>
                      )}
                    </div>

                    <div className="aspect-[3/4] relative bg-gray-800">
                      {isStaked ? (
                        <>
                          <img
                            src={herald.imageUrl}
                            alt={`${clanName} Herald`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', herald.imageUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                            <span className="text-blue-400 font-bold">
                              {PRODUCTION_RATES[herald.rarity]} FOOD/day
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Plus className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Empty Slot</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2">
                      {isStaked ? (
                        <>
                          <div className="flex items-center justify-center gap-2 text-sm mb-2">
                            <Clock className="w-4 h-4" />
                            <span className={herald.canClaim ? 'text-green-400 font-bold' : 'text-gray-400'}>
                              {formatTime(herald.timeUntilClaim)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleClaimClan(clanId)}
                            disabled={!herald.canClaim || claimingClan === clanId}
                            className={`w-full px-3 py-2 rounded font-semibold text-sm transition ${
                              herald.canClaim
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-700 cursor-not-allowed'
                            } disabled:opacity-50`}
                          >
                            {claimingClan === clanId ? (
                              <Loader className="w-4 h-4 animate-spin mx-auto" />
                            ) : herald.canClaim ? (
                              `Claim ${PRODUCTION_RATES[herald.rarity]} FOOD`
                            ) : (
                              'Cooldown Active'
                            )}
                          </button>

                          <button
                            onClick={() => handleUnstake(herald.tokenId)}
                            disabled={processing}
                            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded text-sm transition"
                          >
                            Unstake
                          </button>

                          <p className="text-xs text-center text-gray-500">Herald #{herald.tokenId}</p>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedClan(clanId);
                            setShowStakeModal(true);
                          }}
                          disabled={ownedHeralds.length === 0}
                          className="block w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded font-semibold text-sm text-center transition"
                        >
                          {ownedHeralds.length === 0 ? 'No Heralds to Stake' : 'Stake Herald'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-semibold mb-1">How It Works</p>
                <ul className="list-disc ml-4 space-y-1 text-yellow-400/80">
                  <li>Stake one Herald per clan (max 7 total)</li>
                  <li>Each Herald produces 20/65/100 FOOD per day</li>
                  <li>Claim costs 7 GOLD (from in-game balance)</li>
                  <li>24-hour cooldown between claims</li>
                  <li>Need GOLD? <button onClick={() => onNavigate('exchange')} className="underline">Visit Exchange</button></li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Staking Modal */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Select Herald to Stake in {CLAN_NAMES[selectedClan]}
                </h2>
                <button
                  onClick={() => setShowStakeModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {ownedHeralds.filter(h => h.clan === selectedClan).length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    You don't own any {CLAN_NAMES[selectedClan]} Heralds
                  </p>
                  <p className="text-sm text-gray-500">
                    You have Heralds from other clans. Try a different slot!
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {ownedHeralds
                    .filter(herald => herald.clan === selectedClan)
                    .map((herald) => (
                      <div
                        key={herald.tokenId}
                        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-red-500 transition"
                      >
                        <div className="aspect-[3/4] relative">
                          <img
                            src={herald.imageUrl}
                            alt={`Herald #${herald.tokenId}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                            <span className={RARITY_COLORS[herald.rarity]}>
                              {RARITY_NAMES[herald.rarity]}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-center mb-1">Herald #{herald.tokenId}</p>
                          <p className="text-sm text-center text-gray-400 mb-3">
                            Earns {PRODUCTION_RATES[herald.rarity]} FOOD/day
                          </p>
                          <button
                            onClick={() => handleStake(herald.tokenId, selectedClan)}
                            disabled={processing}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition"
                          >
                            {processing ? (
                              <Loader className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                              'Stake This Herald'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}