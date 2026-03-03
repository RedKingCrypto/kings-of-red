import React, { useState, useEffect } from 'react';
import { ArrowDownUp, ArrowDownLeft, Coins, AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import {
  FOOD_TOKEN_ADDRESS,
  GOLD_TOKEN_ADDRESS,
  WOOD_TOKEN_ADDRESS,
  GAMEBALANCE_ADDRESS,
  ERC20_ABI,
} from './contractConfig';

// GameBalance V4 ABI - unified tokenId approach
// FOOD=1, GOLD=2, WOOD=3
// Old V1 functions that no longer exist and were causing silent failures:
//   inGameFood/Gold/Wood()     => getBalance(addr, tokenId)
//   depositFood/Gold/Wood()    => deposit(tokenId, amount)
//   withdrawFood/Gold/Wood()   => withdraw(tokenId, amount)
//   canWithdrawFood/Gold/Wood()=> canWithdraw(addr, tokenId)
const GAMEBALANCE_V4_ABI = [
  "function getBalance(address user, uint8 tokenId) view returns (uint256)",
  "function getAllBalances(address user) view returns (uint256 food, uint256 gold, uint256 wood, uint256 rkt)",
  "function canWithdraw(address user, uint8 tokenId) view returns (bool)",
  "function getTimeUntilWithdraw(address user, uint8 tokenId) view returns (uint256)",
  "function deposit(uint8 tokenId, uint256 amount)",
  "function withdraw(uint8 tokenId, uint256 amount)",
  "function swapFoodForGold(uint256 amount)",
  "function swapGoldForFood(uint256 amount)",
  "function swapFoodForWood(uint256 amount)",
  "function swapWoodForFood(uint256 amount)",
  "function swapGoldForWood(uint256 amount)",
  "function swapWoodForGold(uint256 amount)"
];

const TOKEN_ID = { FOOD: 1, GOLD: 2, WOOD: 3 };

export default function ExchangePage({ connected, walletAddress, onNavigate }) {
  const [activeTab, setActiveTab] = useState('deposit');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [balances, setBalances] = useState({
    walletFood: '0', walletGold: '0', walletWood: '0',
    inGameFood: '0', inGameGold: '0', inGameWood: '0'
  });
  const [canWithdrawState, setCanWithdrawState] = useState({ food: true, gold: true, wood: true });
  const [timeUntilWithdraw, setTimeUntilWithdraw] = useState({ food: 0, gold: 0, wood: 0 });
  const [depositAmount, setDepositAmount] = useState('');
  const [depositToken, setDepositToken] = useState('FOOD');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToken, setWithdrawToken] = useState('FOOD');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapFrom, setSwapFrom] = useState('FOOD');
  const [swapTo, setSwapTo] = useState('GOLD');

  useEffect(() => {
    if (connected && walletAddress) loadBalances();
  }, [connected, walletAddress]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const foodERC20 = new ethers.Contract(FOOD_TOKEN_ADDRESS, ERC20_ABI, provider);
      const goldERC20 = new ethers.Contract(GOLD_TOKEN_ADDRESS, ERC20_ABI, provider);
      const woodERC20 = new ethers.Contract(WOOD_TOKEN_ADDRESS, ERC20_ABI, provider);
      const gameBal = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_V4_ABI, provider);

      const [wFood, wGold, wWood] = await Promise.all([
        foodERC20.balanceOf(walletAddress),
        goldERC20.balanceOf(walletAddress),
        woodERC20.balanceOf(walletAddress)
      ]);

      let igFood = 0n, igGold = 0n, igWood = 0n;
      try {
        const all = await gameBal.getAllBalances(walletAddress);
        igFood = all.food ?? all[0] ?? 0n;
        igGold = all.gold ?? all[1] ?? 0n;
        igWood = all.wood ?? all[2] ?? 0n;
      } catch {
        [igFood, igGold, igWood] = await Promise.all([
          gameBal.getBalance(walletAddress, TOKEN_ID.FOOD),
          gameBal.getBalance(walletAddress, TOKEN_ID.GOLD),
          gameBal.getBalance(walletAddress, TOKEN_ID.WOOD)
        ]);
      }

      setBalances({
        walletFood: parseFloat(ethers.formatEther(wFood)).toFixed(2),
        walletGold: parseFloat(ethers.formatEther(wGold)).toFixed(2),
        walletWood: parseFloat(ethers.formatEther(wWood)).toFixed(2),
        inGameFood: parseFloat(ethers.formatEther(igFood)).toFixed(2),
        inGameGold: parseFloat(ethers.formatEther(igGold)).toFixed(2),
        inGameWood: parseFloat(ethers.formatEther(igWood)).toFixed(2)
      });

      try {
        const [cwF, cwG, cwW] = await Promise.all([
          gameBal.canWithdraw(walletAddress, TOKEN_ID.FOOD),
          gameBal.canWithdraw(walletAddress, TOKEN_ID.GOLD),
          gameBal.canWithdraw(walletAddress, TOKEN_ID.WOOD)
        ]);
        setCanWithdrawState({ food: cwF, gold: cwG, wood: cwW });
        try {
          const [tF, tG, tW] = await Promise.all([
            gameBal.getTimeUntilWithdraw(walletAddress, TOKEN_ID.FOOD),
            gameBal.getTimeUntilWithdraw(walletAddress, TOKEN_ID.GOLD),
            gameBal.getTimeUntilWithdraw(walletAddress, TOKEN_ID.WOOD)
          ]);
          setTimeUntilWithdraw({ food: Number(tF), gold: Number(tG), wood: Number(tW) });
        } catch {}
      } catch {
        setCanWithdrawState({ food: true, gold: true, wood: true });
      }
    } catch (err) {
      console.error('Error loading balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (type !== 'info') setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) { showMessage('error', 'Enter a valid amount'); return; }
    setProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenAddr = depositToken === 'FOOD' ? FOOD_TOKEN_ADDRESS : depositToken === 'GOLD' ? GOLD_TOKEN_ADDRESS : WOOD_TOKEN_ADDRESS;
      const tokenCtr = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const gameBal = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_V4_ABI, signer);
      const amount = ethers.parseEther(depositAmount);
      const allowance = await tokenCtr.allowance(walletAddress, GAMEBALANCE_ADDRESS);
      if (allowance < amount) {
        showMessage('info', 'Approving ' + depositToken + '...');
        await (await tokenCtr.approve(GAMEBALANCE_ADDRESS, amount)).wait();
      }
      showMessage('info', 'Depositing ' + depositToken + '...');
      await (await gameBal.deposit(TOKEN_ID[depositToken], amount)).wait();
      showMessage('success', 'Deposited ' + depositAmount + ' ' + depositToken + ' to in-game balance!');
      setDepositAmount('');
      await loadBalances();
    } catch (err) {
      showMessage('error', err.reason || err.message || 'Failed to deposit');
    } finally { setProcessing(false); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) { showMessage('error', 'Enter a valid amount'); return; }
    const canDo = withdrawToken === 'FOOD' ? canWithdrawState.food : withdrawToken === 'GOLD' ? canWithdrawState.gold : canWithdrawState.wood;
    if (!canDo) { showMessage('error', 'Withdrawal cooldown active. Wait 24 hours.'); return; }
    setProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gameBal = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_V4_ABI, signer);
      showMessage('info', 'Withdrawing tokens (7% tax applies)...');
      await (await gameBal.withdraw(TOKEN_ID[withdrawToken], ethers.parseEther(withdrawAmount))).wait();
      showMessage('success', 'Withdrew ' + (parseFloat(withdrawAmount) * 0.93).toFixed(2) + ' ' + withdrawToken + ' (after 7% tax) to wallet!');
      setWithdrawAmount('');
      await loadBalances();
    } catch (err) {
      showMessage('error', err.reason || err.message || 'Failed to withdraw');
    } finally { setProcessing(false); }
  };

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) { showMessage('error', 'Enter a valid amount'); return; }
    if (swapFrom === swapTo) { showMessage('error', 'Cannot swap same token'); return; }
    setProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gameBal = new ethers.Contract(GAMEBALANCE_ADDRESS, GAMEBALANCE_V4_ABI, signer);
      const amount = ethers.parseEther(swapAmount);
      const fns = {
        'FOOD_GOLD': () => gameBal.swapFoodForGold(amount),
        'GOLD_FOOD': () => gameBal.swapGoldForFood(amount),
        'FOOD_WOOD': () => gameBal.swapFoodForWood(amount),
        'WOOD_FOOD': () => gameBal.swapWoodForFood(amount),
        'GOLD_WOOD': () => gameBal.swapGoldForWood(amount),
        'WOOD_GOLD': () => gameBal.swapWoodForGold(amount)
      };
      const fn = fns[swapFrom + '_' + swapTo];
      if (!fn) throw new Error('Invalid swap pair');
      showMessage('info', 'Swapping tokens (2% fee applies)...');
      await (await fn()).wait();
      showMessage('success', 'Swapped ' + swapAmount + ' ' + swapFrom + ' to ' + calcSwapOut() + ' ' + swapTo + '!');
      setSwapAmount('');
      await loadBalances();
    } catch (err) {
      showMessage('error', err.reason || err.message || 'Failed to swap');
    } finally { setProcessing(false); }
  };

  const calcSwapOut = () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) return '0';
    const a = parseFloat(swapAmount) * 0.98;
    const m = { 'FOOD_GOLD': a/4, 'GOLD_FOOD': a*4, 'FOOD_WOOD': a/2, 'WOOD_FOOD': a*2, 'GOLD_WOOD': a/2, 'WOOD_GOLD': a*2 };
    return (m[swapFrom + '_' + swapTo] || 0).toFixed(2);
  };

  const swapRatio = () => {
    const m = { 'FOOD_GOLD':'4 FOOD = 1 GOLD','GOLD_FOOD':'1 GOLD = 4 FOOD','FOOD_WOOD':'2 FOOD = 1 WOOD','WOOD_FOOD':'1 WOOD = 2 FOOD','GOLD_WOOD':'2 GOLD = 1 WOOD','WOOD_GOLD':'1 WOOD = 2 GOLD' };
    return m[swapFrom + '_' + swapTo] || 'Select tokens';
  };

  const fmtTime = (s) => !s ? 'Ready soon' : Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
  const wBal = (t) => t==='FOOD'?balances.walletFood:t==='GOLD'?balances.walletGold:balances.walletWood;
  const igBal = (t) => t==='FOOD'?balances.inGameFood:t==='GOLD'?balances.inGameGold:balances.inGameWood;
  const canWd = (t) => t==='FOOD'?canWithdrawState.food:t==='GOLD'?canWithdrawState.gold:canWithdrawState.wood;
  const activeCls = (t) => t==='FOOD'?'bg-blue-600':t==='GOLD'?'bg-yellow-600':'bg-amber-600';
  const textCls = (t) => t==='FOOD'?'text-blue-400':t==='GOLD'?'text-yellow-400':'text-amber-600';

  const TokBtn = ({ tok, active, onSelect, disabled=false }) => (
    <button onClick={() => !disabled && onSelect(tok)} disabled={disabled}
      className={'px-4 py-3 rounded-lg font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed ' + (active===tok ? activeCls(tok)+' text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600')}>
      {tok}
    </button>
  );

  if (!connected) return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <Coins className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
      <p className="text-gray-400 mb-8">Connect to manage your tokens.</p>
      <button onClick={() => onNavigate('home')} className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition">Go Home</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Token Exchange</h1>
        <p className="text-gray-400">Deposit, withdraw, and swap your FOOD, GOLD, and WOOD tokens</p>
      </div>

      {message.text && (
        <div className={'mb-6 p-4 rounded-lg border ' + (message.type==='success'?'bg-green-900/20 border-green-800 text-green-300':message.type==='error'?'bg-red-900/20 border-red-800 text-red-300':'bg-blue-900/20 border-blue-800 text-blue-300')}>
          <div className="flex items-center gap-2">
            {message.type==='success' && <CheckCircle className="w-5 h-5" />}
            {message.type==='error' && <AlertCircle className="w-5 h-5" />}
            {message.type==='info' && <Loader className="w-5 h-5 animate-spin" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 mb-8">
          <Loader className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading balances...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {['FOOD','GOLD','WOOD'].map(tok => (
            <div key={tok} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{tok} Token</h3>
                <button onClick={loadBalances} className="text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-400">Wallet:</span><span className={'font-bold '+textCls(tok)}>{wBal(tok)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">In-Game:</span><span className={'font-bold '+textCls(tok)}>{igBal(tok)}</span></div>
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className={'font-bold text-xl '+textCls(tok)}>{(parseFloat(wBal(tok))+parseFloat(igBal(tok))).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('deposit')} className={'flex-1 px-6 py-3 rounded-lg font-semibold transition '+(activeTab==='deposit'?'bg-blue-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
          <ArrowDownLeft className="w-5 h-5 inline mr-2" />Deposit
        </button>
        <button onClick={() => setActiveTab('swap')} className={'flex-1 px-6 py-3 rounded-lg font-semibold transition '+(activeTab==='swap'?'bg-purple-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
          <ArrowDownUp className="w-5 h-5 inline mr-2" />Swap
        </button>
      </div>

      {activeTab==='deposit' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">Deposit to In-Game Balance</h3>
          <p className="text-gray-400 text-sm mb-6">Move tokens from your wallet to in-game balance (no fees)</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Token</label>
              <div className="grid grid-cols-3 gap-3">
                {['FOOD','GOLD','WOOD'].map(t => <TokBtn key={t} tok={t} active={depositToken} onSelect={setDepositToken} />)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="relative">
                <input type="number" value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                <button onClick={()=>setDepositAmount(wBal(depositToken))} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300">MAX</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Wallet balance: {wBal(depositToken)} {depositToken}</p>
            </div>
            <button onClick={handleDeposit} disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition">
              {processing ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Deposit '+depositToken}
            </button>
          </div>
        </div>
      )}

      {activeTab==='withdraw' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">Withdraw to Wallet</h3>
          <p className="text-gray-400 text-sm mb-6">Move tokens from in-game balance to wallet (7% tax, 24h cooldown)</p>
          {(!canWithdrawState.food||!canWithdrawState.gold||!canWithdrawState.wood) && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
              <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-5 h-5" /><p className="font-semibold">Withdrawal Cooldown Active</p></div>
              {!canWithdrawState.food && <p className="text-sm">FOOD: {fmtTime(timeUntilWithdraw.food)} remaining</p>}
              {!canWithdrawState.gold && <p className="text-sm">GOLD: {fmtTime(timeUntilWithdraw.gold)} remaining</p>}
              {!canWithdrawState.wood && <p className="text-sm">WOOD: {fmtTime(timeUntilWithdraw.wood)} remaining</p>}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Token</label>
              <div className="grid grid-cols-3 gap-3">
                {['FOOD','GOLD','WOOD'].map(t => <TokBtn key={t} tok={t} active={withdrawToken} onSelect={setWithdrawToken} />)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="relative">
                <input type="number" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500" />
                <button onClick={()=>setWithdrawAmount(igBal(withdrawToken))} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-red-400 hover:text-red-300">MAX</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">In-game balance: {igBal(withdrawToken)} {withdrawToken}</p>
            </div>
            {withdrawAmount && parseFloat(withdrawAmount)>0 && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-2"><span className="text-gray-400">Amount:</span><span>{withdrawAmount} {withdrawToken}</span></div>
                <div className="flex justify-between mb-2"><span className="text-gray-400">7% Tax:</span><span className="text-red-400">-{(parseFloat(withdrawAmount)*0.07).toFixed(2)} {withdrawToken}</span></div>
                <div className="border-t border-yellow-800/50 pt-2 flex justify-between font-bold"><span>You Receive:</span><span className="text-green-400">{(parseFloat(withdrawAmount)*0.93).toFixed(2)} {withdrawToken}</span></div>
              </div>
            )}
            <button onClick={handleWithdraw} disabled={processing||!canWd(withdrawToken)} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition">
              {processing ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Withdraw '+withdrawToken}
            </button>
          </div>
        </div>
      )}

      {activeTab==='swap' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">Swap Tokens</h3>
          <p className="text-gray-400 text-sm mb-6">Exchange FOOD, GOLD, and WOOD tokens (2% swap fee)</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">From</label>
              <div className="grid grid-cols-3 gap-3">
                {['FOOD','GOLD','WOOD'].map(t => <TokBtn key={t} tok={t} active={swapFrom} onSelect={setSwapFrom} />)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">To</label>
              <div className="grid grid-cols-3 gap-3">
                {['FOOD','GOLD','WOOD'].map(t => <TokBtn key={t} tok={t} active={swapTo} onSelect={setSwapTo} disabled={swapFrom===t} />)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="relative">
                <input type="number" value={swapAmount} onChange={e=>setSwapAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
                <button onClick={()=>setSwapAmount(igBal(swapFrom))} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-purple-400 hover:text-purple-300">MAX</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">In-game balance: {igBal(swapFrom)} {swapFrom}</p>
            </div>
            {swapAmount && parseFloat(swapAmount)>0 && swapFrom!==swapTo && (
              <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-2"><span className="text-gray-400">Swap:</span><span>{swapAmount} {swapFrom}</span></div>
                <div className="flex justify-between mb-2"><span className="text-gray-400">Rate:</span><span>{swapRatio()}</span></div>
                <div className="flex justify-between mb-2"><span className="text-gray-400">2% Fee:</span><span className="text-yellow-400">-{(parseFloat(swapAmount)*0.02).toFixed(2)} {swapFrom}</span></div>
                <div className="border-t border-purple-800/50 pt-2 flex justify-between font-bold"><span>You Receive:</span><span className="text-green-400">{calcSwapOut()} {swapTo}</span></div>
              </div>
            )}
            <button onClick={handleSwap} disabled={processing||swapFrom===swapTo} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition">
              {processing ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Swap '+swapFrom+' to '+swapTo}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Exchange Fees and Limits</p>
            <ul className="list-disc ml-4 space-y-1 text-blue-400/80">
              <li>Deposit: Free, no limits</li>
              <li>Withdraw: 7% tax (40% burned, 40% treasury, 20% rewards pool), 24h cooldown</li>
              <li>Swap Ratios: 4 FOOD = 1 GOLD, 2 FOOD = 1 WOOD, 2 GOLD = 1 WOOD</li>
              <li>Swap Fee: 2% (50% burned, 50% treasury)</li>
              <li>All transactions use in-game balance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}