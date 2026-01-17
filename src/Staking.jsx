import React, { useState, useEffect } from 'react';
import { Crown, Coins, Clock, AlertCircle, CheckCircle, Loader, Plus } from 'lucide-react';
import { ethers } from 'ethers';
import {
  HERALD_ADDRESS,
  HERALD_STAKING_ADDRESS,
  CLAN_NAMES,
  RARITY_NAMES,
  getHeraldImageUrl
} from './contractConfig';

// ============================================
// COMPLETE HERALD ABI - includes ERC721Enumerable
// ============================================
const HERALD_ABI_COMPLETE = [
  // ERC721 Standard
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  
  // ERC721Enumerable
  "function totalSupply() view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  
  // Herald-specific
  "function getHerald(uint256 tokenId) view returns (uint8 rarity, uint8 clan)",
  "function heralds(uint256 tokenId) view returns (uint8 rarity, uint8 clan)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// ============================================
// COMPLETE HERALD STAKING ABI
// ============================================
const HERALD_STAKING_ABI_COMPLETE = [
  // Staking functions
  "function stakeHerald(uint256 tokenId)",
  "function unstakeHerald(uint256 tokenId)",
  "function claimRewards()",
  "function claimRewardsForHerald(uint256 tokenId)",
  
  // View functions
  "function getUserStakedHeralds(address user) view returns (uint256[])",
  "function getStakedHeralds(address user) view returns (uint256[])",
  "function stakedHeralds(address user, uint256 index) view returns (uint256)",
  "function getStakeInfo(uint256 tokenId) view returns (address owner, uint256 stakedAt, uint256 lastClaim, uint8 clan, uint8 rarity, bool canClaim)",
  "function getTimeUntilClaim(uint256 tokenId) view returns (uint256)",
  "function stakes(uint256 tokenId) view returns (address owner, uint256 stakedAt, uint256 lastClaim)",
  "function isStaked(uint256 tokenId) view returns (bool)",
  "function userStakeCount(address user) view returns (uint256)",
  
  // Config
  "function claimCooldown() view returns (uint256)",
  "function goldCostPerClaim() view returns (uint256)",
  
  // Events
  "event HeraldStaked(uint256 indexed tokenId, address indexed owner)",
  "event HeraldUnstaked(uint256 indexed tokenId, address indexed owner)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];

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
      const interval = setInterval(loadStakingData, 60000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [connected, walletAddress]);

  const loadStakingData = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI_COMPLETE, provider);
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI_COMPLETE, provider);
      
      console.log('Loading Herald staking data for:', walletAddress);
      console.log('Herald contract:', HERALD_ADDRESS);
      console.log('Staking contract:', HERALD_STAKING_ADDRESS);
      
      // ============================================
      // Get staked Herald IDs - try multiple function names
      // ============================================
      let stakedIds = [];
      
      // Try getUserStakedHeralds first
      try {
        stakedIds = await stakingContract.getUserStakedHeralds(walletAddress);
        console.log('getUserStakedHeralds worked:', stakedIds.map(id => id.toString()));
      } catch (e1) {
        console.warn('getUserStakedHeralds failed, trying getStakedHeralds:', e1.message);
        
        // Try getStakedHeralds
        try {
          stakedIds = await stakingContract.getStakedHeralds(walletAddress);
          console.log('getStakedHeralds worked:', stakedIds.map(id => id.toString()));
        } catch (e2) {
          console.warn('getStakedHeralds failed, trying userStakeCount:', e2.message);
          
          // Try iterating through stakedHeralds mapping
          try {
            const count = await stakingContract.userStakeCount(walletAddress);
            const countNum = Number(count);
            console.log('User stake count:', countNum);
            
            for (let i = 0; i < countNum; i++) {
              try {
                const tokenId = await stakingContract.stakedHeralds(walletAddress, i);
                stakedIds.push(tokenId);
              } catch (e3) {
                console.warn(`Could not get staked herald at index ${i}`);
              }
            }
          } catch (e3) {
            console.warn('All staking lookup methods failed:', e3.message);
          }
        }
      }
      
      console.log('Found staked IDs:', stakedIds.map(id => id.toString()));
      
      // Load staked Heralds details organized by clan
      const stakedData = {};
      for (let i = 0; i < stakedIds.length; i++) {
        const tokenId = stakedIds[i];
        try {
          const [owner, stakedAt, lastClaim, clan, rarity, canClaim] = await stakingContract.getStakeInfo(tokenId);
          const timeUntil = await stakingContract.getTimeUntilClaim(tokenId);
          
          const clanNum = parseInt(clan);
          const rarityNum = parseInt(rarity);
          
          stakedData[clanNum] = {
            tokenId: tokenId.toString(),
            clan: clanNum,
            rarity: rarityNum,
            canClaim,
            timeUntilClaim: parseInt(timeUntil.toString()),
            lastClaim: parseInt(lastClaim.toString()),
            imageUrl: getHeraldImageUrl(clanNum, rarityNum)
          };
          
          console.log(`Staked Herald #${tokenId}: ${CLAN_NAMES[clanNum]} ${RARITY_NAMES[rarityNum]}`);
        } catch (err) {
          console.error(`Error loading staked Herald ${tokenId}:`, err.message);
        }
      }
      
      setStakedByClans(stakedData);
      
      // ============================================
      // Load owned (unstaked) Heralds using tokenOfOwnerByIndex
      // ============================================
      const userHeralds = [];
      
      try {
        const balance = await heraldContract.balanceOf(walletAddress);
        const heraldCount = Number(balance);
        console.log(`User owns ${heraldCount} Heralds total`);
        
        for (let i = 0; i < heraldCount; i++) {
          try {
            const tokenId = await heraldContract.tokenOfOwnerByIndex(walletAddress, i);
            const tokenIdStr = tokenId.toString();
            
            // Check if this Herald is staked
            const isStaked = stakedIds.some(id => id.toString() === tokenIdStr);
            
            if (!isStaked) {
              // Get Herald details
              let rarity = 0, clan = 0;
              
              try {
                const heraldData = await heraldContract.getHerald(tokenId);
                rarity = parseInt(heraldData[0]);
                clan = parseInt(heraldData[1]);
              } catch {
                try {
                  const heraldData = await heraldContract.heralds(tokenId);
                  rarity = parseInt(heraldData.rarity);
                  clan = parseInt(heraldData.clan);
                } catch (e) {
                  console.warn(`Could not get Herald #${tokenIdStr} details:`, e.message);
                }
              }
              
              console.log(`Found unstaked Herald #${tokenIdStr}: ${RARITY_NAMES[rarity]} ${CLAN_NAMES[clan]}`);
              
              userHeralds.push({
                tokenId: tokenIdStr,
                rarity: rarity,
                clan: clan,
                imageUrl: getHeraldImageUrl(clan, rarity)
              });
            }
          } catch (err) {
            console.warn(`Error loading Herald at index ${i}:`, err.message);
          }
        }
      } catch (err) {
        console.error('Error loading owned Heralds:', err.message);
      }
      
      console.log('Owned (unstaked) Heralds:', userHeralds);
      setOwnedHeralds(userHeralds);
      setMessage({ type: '', text: '' });
      
    } catch (error) {
      console.error('Error loading staking data:', error);
      setMessage({ type: 'error', text: 'Failed to load Heralds: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const showMessageFunc = (type, text) => {
    setMessage({ type, text });
    if (type !== 'info') {
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleStake = async (tokenId, clanId) => {
    try {
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const heraldContract = new ethers.Contract(HERALD_ADDRESS, HERALD_ABI_COMPLETE, signer);
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI_COMPLETE, signer);
      
      // Check if already approved
      const approved = await heraldContract.getApproved(tokenId);
      if (approved.toLowerCase() !== HERALD_STAKING_ADDRESS.toLowerCase()) {
        showMessageFunc('info', 'Approving Herald for staking...');
        const approveTx = await heraldContract.approve(HERALD_STAKING_ADDRESS, tokenId);
        await approveTx.wait();
      }
      
      // Stake
      showMessageFunc('info', 'Staking Herald...');
      const stakeTx = await stakingContract.stakeHerald(tokenId);
      await stakeTx.wait();
      
      showMessageFunc('success', 'Herald staked successfully!');
      setShowStakeModal(false);
      await loadStakingData();
    } catch (error) {
      console.error('Error staking:', error);
      showMessageFunc('error', error.reason || error.message || 'Failed to stake Herald');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnstake = async (tokenId) => {
    try {
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI_COMPLETE, signer);
      
      showMessageFunc('info', 'Unstaking Herald...');
      const tx = await stakingContract.unstakeHerald(tokenId);
      await tx.wait();
      
      showMessageFunc('success', 'Herald unstaked successfully!');
      await loadStakingData();
    } catch (error) {
      console.error('Error unstaking:', error);
      showMessageFunc('error', error.reason || error.message || 'Failed to unstake');
    } finally {
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
      const stakingContract = new ethers.Contract(HERALD_STAKING_ADDRESS, HERALD_STAKING_ABI_COMPLETE, signer);
      
      showMessageFunc('info', 'Claiming rewards...');
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      
      showMessageFunc('success', `Claimed ${PRODUCTION_RATES[herald.rarity]} FOOD! Check Dashboard.`);
      await loadStakingData();
    } catch (error) {
      console.error('Error claiming:', error);
      const errorMsg = error.message?.includes('GOLD') || error.message?.includes('gold')
        ? 'Not enough GOLD! Visit Exchange to deposit GOLD.'
        : error.reason || error.message || 'Failed to claim';
      showMessageFunc('error', errorMsg);
    } finally {
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Herald Staking</h1>
        <p className="text-gray-400">Stake one Herald per clan to earn FOOD tokens (max 7 total)</p>
        <p className="text-xs text-gray-600 mt-2">
          Owned: {ownedHeralds.length} | Staked: {Object.keys(stakedByClans).length}
        </p>
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
              const availableForClan = ownedHeralds.filter(h => h.clan === clanId);
              
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
                            onError={(e) => { e.target.style.display = 'none'; }}
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
                            {availableForClan.length > 0 && (
                              <p className="text-xs text-green-400 mt-1">{availableForClan.length} available</p>
                            )}
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
                              herald.canClaim ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed'
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
                          disabled={availableForClan.length === 0}
                          className="block w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded font-semibold text-sm text-center transition"
                        >
                          {availableForClan.length === 0 ? 'No Heralds Available' : `Stake Herald (${availableForClan.length})`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {ownedHeralds.length > 0 && (
            <div className="mt-8 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
              <h3 className="font-bold text-green-300 mb-2">Your Unstaked Heralds ({ownedHeralds.length})</h3>
              <div className="flex flex-wrap gap-2">
                {ownedHeralds.map(h => (
                  <span key={h.tokenId} className="bg-gray-800 px-2 py-1 rounded text-sm">
                    #{h.tokenId} - {RARITY_NAMES[h.rarity]} {CLAN_NAMES[h.clan]}
                  </span>
                ))}
              </div>
            </div>
          )}

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
                  {ownedHeralds.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">Your available Heralds:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {ownedHeralds.map(h => (
                          <span key={h.tokenId} className="bg-gray-800 px-2 py-1 rounded text-xs">
                            {CLAN_NAMES[h.clan]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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