import React, { useState } from 'react';
import { ArrowDownUp, AlertCircle, TrendingUp, Clock, Shield, Coins } from 'lucide-react';

export default function ExchangePage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('swap');
  const [swapFrom, setSwapFrom] = useState('FOOD');
  const [swapTo, setSwapTo] = useState('GOLD');
  const [amount, setAmount] = useState('');
  const [withdrawToken, setWithdrawToken] = useState('FOOD');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Mock balances - will be real once integrated
  const balances = {
    FOOD: 2450,
    GOLD: 180,
    USDC: 0
  };

  // Mock exchange rates
  const rates = {
    FOOD_TO_GOLD: 0.05, // 1 FOOD = 0.05 GOLD
    GOLD_TO_FOOD: 20,   // 1 GOLD = 20 FOOD
    FOOD_TO_USDC: 0.03, // 1 FOOD = $0.03
    GOLD_TO_USDC: 0.50  // 1 GOLD = $0.50
  };

  // Mock data for 24h limits
  const withdrawalInfo = {
    used: 45,
    limit: 100,
    nextReset: '18h 32m'
  };

  const calculateSwapOutput = () => {
    if (!amount) return { output: 0, tax: 0, net: 0 };
    const input = parseFloat(amount);
    const tax = input * 0.02; // 2% swap tax
    const afterTax = input - tax;
    
    let output = 0;
    if (swapFrom === 'FOOD' && swapTo === 'GOLD') {
      output = afterTax * rates.FOOD_TO_GOLD;
    } else if (swapFrom === 'GOLD' && swapTo === 'FOOD') {
      output = afterTax * rates.GOLD_TO_FOOD;
    }
    
    return {
      output: output.toFixed(2),
      tax: tax.toFixed(2),
      net: output.toFixed(2)
    };
  };

  const calculateWithdrawalOutput = () => {
    if (!withdrawAmount) return { net: 0, tax: 0, burn: 0, treasury: 0, rewards: 0 };
    const input = parseFloat(withdrawAmount);
    const totalTax = input * 0.07; // 7% total tax
    const burn = totalTax * 0.40;  // 40% of tax
    const treasury = totalTax * 0.40; // 40% of tax
    const rewards = totalTax * 0.20; // 20% of tax
    const net = input - totalTax;
    
    const rate = withdrawToken === 'FOOD' ? rates.FOOD_TO_USDC : rates.GOLD_TO_USDC;
    
    return {
      net: (net * rate).toFixed(2),
      tax: (totalTax * rate).toFixed(2),
      burn: (burn * rate).toFixed(2),
      treasury: (treasury * rate).toFixed(2),
      rewards: (rewards * rate).toFixed(2)
    };
  };

  const swapOutput = calculateSwapOutput();
  const withdrawOutput = calculateWithdrawalOutput();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Token Exchange</h1>
          <p className="text-gray-400">Swap tokens internally or withdraw to USDC</p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-400">Exchange Opens Soon</span>
          </div>
          <p className="text-sm text-gray-300 mt-2">
            The exchange will open approximately 5-6 weeks after Genesis sale launch. 
            This preview shows what will be available.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('swap')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              activeTab === 'swap'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Swap Tokens
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              activeTab === 'withdraw'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Withdraw to USDC
          </button>
        </div>

        {/* Current Balances */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-900/30 to-green-700/30 border border-green-500/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">FOOD Balance</div>
            <div className="text-2xl font-bold text-green-400">{balances.FOOD.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-700/30 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">GOLD Balance</div>
            <div className="text-2xl font-bold text-yellow-400">{balances.GOLD.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 border border-blue-500/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">USDC Balance</div>
            <div className="text-2xl font-bold text-blue-400">${balances.USDC.toFixed(2)}</div>
          </div>
        </div>

        {/* Swap Tab */}
        {activeTab === 'swap' && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ArrowDownUp className="w-6 h-6 text-red-500" />
              Internal Token Swap
            </h2>
            
            <div className="space-y-4">
              {/* From */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">From</label>
                <div className="flex gap-2">
                  <select
                    value={swapFrom}
                    onChange={(e) => {
                      setSwapFrom(e.target.value);
                      setSwapTo(e.target.value === 'FOOD' ? 'GOLD' : 'FOOD');
                    }}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="FOOD">$KINGSFOOD</option>
                    <option value="GOLD">$KINGSGOLD</option>
                  </select>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Balance: {balances[swapFrom].toLocaleString()} {swapFrom}
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const temp = swapFrom;
                    setSwapFrom(swapTo);
                    setSwapTo(temp);
                  }}
                  className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition"
                >
                  <ArrowDownUp className="w-5 h-5" />
                </button>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">To (after 2% tax)</label>
                <div className="flex gap-2">
                  <select
                    value={swapTo}
                    disabled
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white opacity-50"
                  >
                    <option value="GOLD">$KINGSGOLD</option>
                    <option value="FOOD">$KINGSFOOD</option>
                  </select>
                  <input
                    type="text"
                    value={swapOutput.output}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Exchange Rate: 1 {swapFrom} = {swapFrom === 'FOOD' ? rates.FOOD_TO_GOLD : rates.GOLD_TO_FOOD} {swapTo}
                </div>
              </div>

              {/* Swap Breakdown */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Swap Amount:</span>
                    <span>{amount} {swapFrom}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-400">
                    <span>Swap Tax (2%):</span>
                    <span>-{swapOutput.tax} {swapFrom}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    └ 1% burned • 1% treasury
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between font-bold text-green-400">
                      <span>You Receive:</span>
                      <span>{swapOutput.output} {swapTo}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-400 mb-1">Low 2% Swap Fee</div>
                    <div className="text-sm text-gray-300">
                      Internal token swaps have a 2% fee (1% burned, 1% to treasury). 
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled
                className="w-full bg-gray-700 py-4 rounded-lg font-bold text-gray-500 cursor-not-allowed"
              >
                Exchange Not Yet Active
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Coins className="w-6 h-6 text-red-500" />
              Withdraw to USDC
            </h2>

            {/* Withdrawal Limit Bar */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">24-Hour Withdrawal Limit</span>
                <span className="text-sm font-semibold">{withdrawalInfo.used}/{withdrawalInfo.limit} tokens used</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{width: `${(withdrawalInfo.used / withdrawalInfo.limit) * 100}%`}}
                />
              </div>
              <div className="text-xs text-gray-500">
                Resets in: {withdrawalInfo.nextReset}
              </div>
            </div>

            <div className="space-y-4">
              {/* Token Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Token to Withdraw</label>
                <select
                  value={withdrawToken}
                  onChange={(e) => setWithdrawToken(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                >
                  <option value="FOOD">$KINGSFOOD</option>
                  <option value="GOLD">$KINGSGOLD</option>
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">
                    Balance: {balances[withdrawToken].toLocaleString()} {withdrawToken}
                  </span>
                  <button
                    onClick={() => setWithdrawAmount(Math.min(balances[withdrawToken], withdrawalInfo.limit - withdrawalInfo.used).toString())}
                    className="text-red-500 hover:text-red-400"
                  >
                    Max Available
                  </button>
                </div>
              </div>

              {/* Withdrawal Breakdown */}
              {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Withdraw Amount:</span>
                    <span>{withdrawAmount} {withdrawToken}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 space-y-1">
                    <div className="flex justify-between text-sm text-red-400">
                      <span>Tax (7%):</span>
                      <span>-${withdrawOutput.tax}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 ml-4">
                      <span>└ Burned (40%):</span>
                      <span>${withdrawOutput.burn}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 ml-4">
                      <span>└ Treasury (40%):</span>
                      <span>${withdrawOutput.treasury}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 ml-4">
                      <span>└ Rewards Pool (20%):</span>
                      <span>${withdrawOutput.rewards}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between font-bold text-green-400">
                      <span>You Receive:</span>
                      <span>${withdrawOutput.net} USDC</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning Box */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-400 mb-1">Withdrawal Restrictions</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Maximum 100 tokens per 24 hours</li>
                      <li>• Only one withdrawal every 24 hours</li>
                      <li>• 7% tax on all withdrawals (helps sustain economy)</li>
                      <li>• Transactions are irreversible</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                disabled
                className="w-full bg-gray-700 py-4 rounded-lg font-bold text-gray-500 cursor-not-allowed"
              >
                Withdrawals Not Yet Active
              </button>
            </div>
          </div>
        )}

        {/* Exchange Rates Info */}
        <div className="mt-6 bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Current Exchange Rates
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">FOOD → GOLD</div>
              <div className="text-lg font-bold">1 FOOD = {rates.FOOD_TO_GOLD} GOLD</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">GOLD → FOOD</div>
              <div className="text-lg font-bold">1 GOLD = {rates.GOLD_TO_FOOD} FOOD</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">FOOD → USDC</div>
              <div className="text-lg font-bold">1 FOOD = ${rates.FOOD_TO_USDC}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">GOLD → USDC</div>
              <div className="text-lg font-bold">1 GOLD = ${rates.GOLD_TO_USDC}</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * Exchange rates are dynamic and may fluctuate based on market conditions. Rates shown are estimates.
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}