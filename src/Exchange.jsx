import React, { useState, useEffect } from 'react';
import { ArrowDownUp, ArrowUpRight, ArrowDownLeft, Coins, AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import {
  FOOD_TOKEN_ADDRESS,
  GOLD_TOKEN_ADDRESS,
  GAME_BALANCE_ADDRESS,
  FOOD_TOKEN_ABI,
  GOLD_TOKEN_ABI,
  GAME_BALANCE_ABI
} from './contractConfig';

export default function ExchangePage({ connected, walletAddress, onNavigate }) {
  const [activeTab, setActiveTab] = useState('deposit'); // deposit, withdraw, swap
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Balances
  const [balances, setBalances] = useState({
    walletFood: '0',
    walletGold: '0',
    inGameFood: '0',
    inGameGold: '0'
  });
  
  // Withdraw state
  const [canWithdraw, setCanWithdraw] = useState({ food: true, gold: true });
  const [timeUntilWithdraw, setTimeUntilWithdraw] = useState({ food: 0, gold: 0 });
  
  // Form inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [depositToken, setDepositToken] = useState('FOOD');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToken, setWithdrawToken] = useState('FOOD');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapFrom, setSwapFrom] = useState('FOOD'); // FOOD or GOLD

  useEffect(() => {
    if (connected && walletAddress) {
      loadBalances();
    }
  }, [connected, walletAddress]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const foodContract = new ethers.Contract(FOOD_TOKEN_ADDRESS, FOOD_TOKEN_ABI, provider);
      const goldContract = new ethers.Contract(GOLD_TOKEN_ADDRESS, GOLD_TOKEN_ABI, provider);
      const gameBalanceContract = new ethers.Contract(GAME_BALANCE_ADDRESS, GAME_BALANCE_ABI, provider);
      
      const [walletFood, walletGold, gameFood, gameGold] = await Promise.all([
        foodContract.balanceOf(walletAddress),
        goldContract.balanceOf(walletAddress),
        gameBalanceContract.inGameFood(walletAddress),
        gameBalanceContract.inGameGold(walletAddress)
      ]);
      
      setBalances({
        walletFood: parseFloat(ethers.formatEther(walletFood)).toFixed(2),
        walletGold: parseFloat(ethers.formatEther(walletGold)).toFixed(2),
        inGameFood: parseFloat(ethers.formatEther(gameFood)).toFixed(2),
        inGameGold: parseFloat(ethers.formatEther(gameGold)).toFixed(2)
      });
      
      // Check withdrawal status (separate for each token)
      const canWithdrawFoodNow = await gameBalanceContract.canWithdrawFood(walletAddress);
      const canWithdrawGoldNow = await gameBalanceContract.canWithdrawGold(walletAddress);
      
      setCanWithdraw({
        food: canWithdrawFoodNow,
        gold: canWithdrawGoldNow
      });
      
      // Get time until withdrawal for each
      if (!canWithdrawFoodNow) {
        const foodTimeLeft = await gameBalanceContract.timeUntilFoodWithdrawal(walletAddress);
        setTimeUntilWithdraw(prev => ({ ...prev, food: parseInt(foodTimeLeft.toString()) }));
      }
      if (!canWithdrawGoldNow) {
        const goldTimeLeft = await gameBalanceContract.timeUntilGoldWithdrawal(walletAddress);
        setTimeUntilWithdraw(prev => ({ ...prev, gold: parseInt(goldTimeLeft.toString()) }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading balances:', error);
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // ============ DEPOSIT ============
  const handleDeposit = async () => {
    try {
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        showMessage('error', 'Enter a valid amount');
        return;
      }
      
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenAddress = depositToken === 'FOOD' ? FOOD_TOKEN_ADDRESS : GOLD_TOKEN_ADDRESS;
      const tokenContract = new ethers.Contract(tokenAddress, FOOD_TOKEN_ABI, signer);
      const gameBalanceContract = new ethers.Contract(GAME_BALANCE_ADDRESS, GAME_BALANCE_ABI, signer);
      
      const amount = ethers.parseEther(depositAmount);
      
      // Approve
      showMessage('info', 'Approving tokens...');
      const approveTx = await tokenContract.approve(GAME_BALANCE_ADDRESS, amount);
      await approveTx.wait();
      
      // Deposit
      showMessage('info', 'Depositing tokens...');
      const depositTx = depositToken === 'FOOD' 
        ? await gameBalanceContract.depositFood(amount)
        : await gameBalanceContract.depositGold(amount);
      await depositTx.wait();
      
      showMessage('success', `Deposited ${depositAmount} ${depositToken} to in-game balance!`);
      setDepositAmount('');
      await loadBalances();
      setProcessing(false);
    } catch (error) {
      console.error('Error depositing:', error);
      showMessage('error', error.message || 'Failed to deposit');
      setProcessing(false);
    }
  };

  // ============ WITHDRAW ============
  const handleWithdraw = async () => {
    try {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        showMessage('error', 'Enter a valid amount');
        return;
      }
      
      const canWithdrawThis = withdrawToken === 'FOOD' ? canWithdraw.food : canWithdraw.gold;
      if (!canWithdrawThis) {
        showMessage('error', 'Withdrawal cooldown active. Wait 24 hours between withdrawals.');
        return;
      }
      
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gameBalanceContract = new ethers.Contract(GAME_BALANCE_ADDRESS, GAME_BALANCE_ABI, signer);
      
      const amount = ethers.parseEther(withdrawAmount);
      
      showMessage('info', 'Withdrawing tokens (7% tax applies)...');
      const withdrawTx = withdrawToken === 'FOOD'
        ? await gameBalanceContract.withdrawFood(amount)
        : await gameBalanceContract.withdrawGold(amount);
      await withdrawTx.wait();
      
      const netAmount = (parseFloat(withdrawAmount) * 0.93).toFixed(2);
      showMessage('success', `Withdrew ${netAmount} ${withdrawToken} (after 7% tax) to wallet!`);
      setWithdrawAmount('');
      await loadBalances();
      setProcessing(false);
    } catch (error) {
      console.error('Error withdrawing:', error);
      showMessage('error', error.message || 'Failed to withdraw');
      setProcessing(false);
    }
  };

  // ============ SWAP ============
  const handleSwap = async () => {
    try {
      if (!swapAmount || parseFloat(swapAmount) <= 0) {
        showMessage('error', 'Enter a valid amount');
        return;
      }
      
      setProcessing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gameBalanceContract = new ethers.Contract(GAME_BALANCE_ADDRESS, GAME_BALANCE_ABI, signer);
      
      const amount = ethers.parseEther(swapAmount);
      
      showMessage('info', 'Swapping tokens (2% fee applies)...');
      const swapTx = swapFrom === 'FOOD'
        ? await gameBalanceContract.swapFoodForGold(amount)
        : await gameBalanceContract.swapGoldForFood(amount);
      await swapTx.wait();
      
      const received = swapFrom === 'FOOD' 
        ? (parseFloat(swapAmount) * 0.98 / 4).toFixed(2) // 4:1 ratio, 2% fee
        : (parseFloat(swapAmount) * 0.98 * 4).toFixed(2);
      const receivedToken = swapFrom === 'FOOD' ? 'GOLD' : 'FOOD';
      
      showMessage('success', `Swapped ${swapAmount} ${swapFrom} → ${received} ${receivedToken}!`);
      setSwapAmount('');
      await loadBalances();
      setProcessing(false);
    } catch (error) {
      console.error('Error swapping:', error);
      showMessage('error', error.message || 'Failed to swap');
      setProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateSwapOutput = () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) return '0';
    const amount = parseFloat(swapAmount);
    const afterFee = amount * 0.98; // 2% fee
    if (swapFrom === 'FOOD') {
      return (afterFee / 4).toFixed(2); // 4 FOOD = 1 GOLD
    } else {
      return (afterFee * 4).toFixed(2); // 1 GOLD = 4 FOOD
    }
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Coins className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-8">Connect to manage your tokens.</p>
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Token Exchange</h1>
        <p className="text-gray-400">Deposit, withdraw, and swap your FOOD and GOLD tokens</p>
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

      {/* Balance Display */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">FOOD Token</h3>
            <button onClick={loadBalances} className="text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Wallet:</span>
              <span className="font-bold text-blue-400">{balances.walletFood}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">In-Game:</span>
              <span className="font-bold text-blue-400">{balances.inGameFood}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl text-blue-400">
                {(parseFloat(balances.walletFood) + parseFloat(balances.inGameFood)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">GOLD Token</h3>
            <button onClick={loadBalances} className="text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Wallet:</span>
              <span className="font-bold text-yellow-400">{balances.walletGold}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">In-Game:</span>
              <span className="font-bold text-yellow-400">{balances.inGameGold}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl text-yellow-400">
                {(parseFloat(balances.walletGold) + parseFloat(balances.inGameGold)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'deposit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <ArrowDownLeft className="w-5 h-5 inline mr-2" />
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'withdraw'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <ArrowUpRight className="w-5 h-5 inline mr-2" />
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'swap'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <ArrowDownUp className="w-5 h-5 inline mr-2" />
          Swap
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Deposit to In-Game Balance</h3>
          <p className="text-gray-400 text-sm mb-6">
            Move tokens from your wallet to in-game balance (no fees)
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Token</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDepositToken('FOOD')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    depositToken === 'FOOD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  FOOD
                </button>
                <button
                  onClick={() => setDepositToken('GOLD')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    depositToken === 'GOLD'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  GOLD
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setDepositAmount(depositToken === 'FOOD' ? balances.walletFood : balances.walletGold)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {depositToken === 'FOOD' ? balances.walletFood : balances.walletGold} {depositToken}
              </p>
            </div>

            <button
              onClick={handleDeposit}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition"
            >
              {processing ? (
                <Loader className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                `Deposit ${depositToken}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Withdraw to Wallet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Move tokens from in-game balance to wallet (7% tax, 24h cooldown)
          </p>

          {(!canWithdraw.food || !canWithdraw.gold) && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Withdrawal Cooldown Active</p>
                  {!canWithdraw.food && <p className="text-sm">FOOD: {formatTime(timeUntilWithdraw.food)} remaining</p>}
                  {!canWithdraw.gold && <p className="text-sm">GOLD: {formatTime(timeUntilWithdraw.gold)} remaining</p>}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Token</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWithdrawToken('FOOD')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    withdrawToken === 'FOOD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  FOOD
                </button>
                <button
                  onClick={() => setWithdrawToken('GOLD')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    withdrawToken === 'GOLD'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  GOLD
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={() => setWithdrawAmount(withdrawToken === 'FOOD' ? balances.inGameFood : balances.inGameGold)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-red-400 hover:text-red-300"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {withdrawToken === 'FOOD' ? balances.inGameFood : balances.inGameGold} {withdrawToken}
              </p>
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Amount:</span>
                  <span>{withdrawAmount} {withdrawToken}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">7% Tax:</span>
                  <span className="text-red-400">-{(parseFloat(withdrawAmount) * 0.07).toFixed(2)} {withdrawToken}</span>
                </div>
                <div className="border-t border-yellow-800/50 pt-2 flex justify-between font-bold">
                  <span>You Receive:</span>
                  <span className="text-green-400">{(parseFloat(withdrawAmount) * 0.93).toFixed(2)} {withdrawToken}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={processing || (withdrawToken === 'FOOD' ? !canWithdraw.food : !canWithdraw.gold)}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition"
            >
              {processing ? (
                <Loader className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                `Withdraw ${withdrawToken}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Swap Tab */}
      {activeTab === 'swap' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Swap Tokens</h3>
          <p className="text-gray-400 text-sm mb-6">
            Exchange FOOD ↔ GOLD at 4:1 ratio (2% swap fee)
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">From</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSwapFrom('FOOD')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    swapFrom === 'FOOD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  FOOD
                </button>
                <button
                  onClick={() => setSwapFrom('GOLD')}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    swapFrom === 'GOLD'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  GOLD
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => setSwapAmount(swapFrom === 'FOOD' ? balances.inGameFood : balances.inGameGold)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-purple-400 hover:text-purple-300"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {swapFrom === 'FOOD' ? balances.inGameFood : balances.inGameGold} {swapFrom}
              </p>
            </div>

            {swapAmount && parseFloat(swapAmount) > 0 && (
              <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Swap:</span>
                  <span>{swapAmount} {swapFrom}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Rate:</span>
                  <span>4 FOOD = 1 GOLD</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">2% Fee:</span>
                  <span className="text-yellow-400">-{(parseFloat(swapAmount) * 0.02).toFixed(2)} {swapFrom}</span>
                </div>
                <div className="border-t border-purple-800/50 pt-2 flex justify-between font-bold">
                  <span>You Receive:</span>
                  <span className="text-green-400">{calculateSwapOutput()} {swapFrom === 'FOOD' ? 'GOLD' : 'FOOD'}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSwap}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition"
            >
              {processing ? (
                <Loader className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                `Swap ${swapFrom} → ${swapFrom === 'FOOD' ? 'GOLD' : 'FOOD'}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Exchange Fees & Limits</p>
            <ul className="list-disc ml-4 space-y-1 text-blue-400/80">
              <li><strong>Deposit:</strong> Free, no limits</li>
              <li><strong>Withdraw:</strong> 7% tax (40% burned, 40% treasury, 20% rewards pool), 24h cooldown</li>
              <li><strong>Swap:</strong> 2% fee (50% burned, 50% treasury), 4:1 FOOD:GOLD ratio</li>
              <li>All transactions happen with in-game balance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}